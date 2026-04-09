import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { Ficha } from '../entities/Ficha.js';
import { User } from '../entities/User.js';
import { firebaseAuthMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logAction } from '../utils/auditLog.js';
import { appUserContextMiddleware, getAuthContext, requirePermission } from '../middleware/request-context.middleware.js';
import {
  buildValidationError,
  closeFichaPeriodSchema,
  createFichaSchema,
  dailyStatsQuerySchema,
  listFichasQuerySchema,
  requestFichaCorrectionSchema,
  reviewFichaCorrectionSchema,
  toMinutes,
  updateFichaSchema,
} from '../utils/validation.js';
import { getMadridDateTimeParts, getMadridUtcOffset, toUtcMidnightDate } from '../utils/timezone.js';
import { applyFichaCorrection, buildFichaCorrectionChanges, type FichaCorrectionChanges } from '../utils/ficha-correction.js';
import { getTimeEntryService } from '../services/TimeEntryService.js';
import { TimeEntryType, TimeEntrySource } from '../entities/TimeEntry.js';

const router = Router();

type FichaCorrectionRequestRecord = {
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  requestedAt: string;
  requestedBy: string;
  proposedChanges: FichaCorrectionChanges;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
};

/**
 * Returns a ficha only if it belongs to the authenticated user AND to their company.
 * Defense-in-depth: prevents cross-tenant access even if UIDs were ever reused.
 */
async function findScopedFicha(id: string, uid: string, companyId: string): Promise<Ficha | null> {
  return AppDataSource.getRepository(Ficha)
    .createQueryBuilder('ficha')
    .innerJoin(User, 'user', 'user.uid = ficha.userId')
    .where('ficha.id = :id', { id })
    .andWhere('ficha.userId = :uid', { uid })
    .andWhere('user.companyId = :companyId', { companyId })
    .getOne();
}

function getFichaCorrectionRequest(ficha: Ficha): FichaCorrectionRequestRecord | undefined {
  const correctionRequest = ficha.metadata?.correctionRequest;
  if (!correctionRequest || typeof correctionRequest !== 'object') {
    return undefined;
  }

  return correctionRequest as FichaCorrectionRequestRecord;
}

function buildFichaBaseState(ficha: Ficha) {
  return {
    startTime: ficha.startTime,
    endTime: ficha.endTime,
    description: ficha.description,
    projectCode: ficha.projectCode,
    hoursWorked: ficha.hoursWorked,
  };
}

function upsertFichaCorrectionMetadata(
  ficha: Ficha,
  correctionRequest: FichaCorrectionRequestRecord,
): void {
  ficha.metadata = {
    ...(ficha.metadata ?? {}),
    correctionRequest,
  };
}

/**
 * POST /api/v1/fichas
 * Create a new time tracking entry
 */
router.post(
  '/',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const parseBody = createFichaSchema.safeParse(req.body);

    if (!parseBody.success) {
      res.status(400).json(buildValidationError(parseBody.error));
      return;
    }

    const { date, startTime, endTime, description, projectCode, metadata } = parseBody.data;

    const fichaRepository = AppDataSource.getRepository(Ficha);

    // Calcular horas trabajadas si tenemos endTime
    let hoursWorked: number | undefined;
    if (endTime) {
      const startMinutes = toMinutes(startTime);
      const endMinutes = toMinutes(endTime);
      hoursWorked = parseFloat(((endMinutes - startMinutes) / 60).toFixed(2));
    }

    const ficha = fichaRepository.create({
      userId: auth.uid,
      date: new Date(date),
      startTime,
      endTime: endTime || undefined,
      hoursWorked,
      description,
      projectCode,
      metadata,
    });

    await fichaRepository.save(ficha);

    res.status(201).json({
      message: 'Ficha creada',
      ficha: {
        id: ficha.id,
        date: ficha.date,
        startTime: ficha.startTime,
        endTime: ficha.endTime,
        hoursWorked: ficha.hoursWorked,
        status: ficha.status,
      },
    });
  })
);

/**
 * GET /api/v1/fichas
 * List user's fichas with optional date range filter
 */
router.get(
  '/',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const parseQuery = listFichasQuerySchema.safeParse(req.query);

    if (!parseQuery.success) {
      res.status(400).json(buildValidationError(parseQuery.error));
      return;
    }

    const { startDate, endDate, status, limit, offset } = parseQuery.data;

    const qb = AppDataSource.getRepository(Ficha)
      .createQueryBuilder('ficha')
      .innerJoin(User, 'user', 'user.uid = ficha.userId')
      .where('ficha.userId = :uid', { uid: auth.uid })
      .andWhere('user.companyId = :companyId', { companyId: auth.companyId })
      .orderBy('ficha.date', 'DESC')
      .addOrderBy('ficha.startTime', 'DESC')
      .take(limit)
      .skip(offset);

    if (status) {
      qb.andWhere('ficha.status = :status', { status });
    }
    if (startDate && endDate) {
      qb.andWhere('ficha.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    } else if (startDate) {
      qb.andWhere('ficha.date >= :startDate', { startDate });
    } else if (endDate) {
      qb.andWhere('ficha.date <= :endDate', { endDate });
    }

    const [fichas, total] = await qb.getManyAndCount();

    res.json({
      data: fichas.map((f) => ({
        id: f.id,
        date: f.date,
        startTime: f.startTime,
        endTime: f.endTime,
        hoursWorked: f.hoursWorked,
        description: f.description,
        projectCode: f.projectCode,
        status: f.status,
      })),
      pagination: {
        total,
        limit,
        offset,
      },
    });
  })
);

/**
 * GET /api/v1/fichas/stats/daily
 * Get daily statistics (hours per day)
 * NOTE: Must be defined BEFORE /:id to prevent Express from capturing "stats" as :id
 */
router.get(
  '/stats/daily',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const parseQuery = dailyStatsQuerySchema.safeParse(req.query);

    if (!parseQuery.success) {
      res.status(400).json(buildValidationError(parseQuery.error));
      return;
    }

    const { startDate, endDate } = parseQuery.data;

    const qbStats = AppDataSource.getRepository(Ficha)
      .createQueryBuilder('ficha')
      .innerJoin(User, 'user', 'user.uid = ficha.userId')
      .where('ficha.userId = :uid', { uid: auth.uid })
      .andWhere('user.companyId = :companyId', { companyId: auth.companyId })
      .andWhere('ficha.status = :status', { status: 'confirmed' });

    if (startDate && endDate) {
      qbStats.andWhere('ficha.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const fichas = await qbStats.getMany();

    // Agrupar por día
    const dailyStats = fichas.reduce(
      (acc, ficha) => {
        // PostgreSQL puede devolver date como string o Date; normalizar siempre
        const raw = ficha.date as unknown as string | Date;
        const dateKey = typeof raw === 'string'
          ? (raw as string).split('T')[0]
          : (raw as Date).toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey, hours: 0, entries: 0 };
        }
        if (ficha.hoursWorked) {
          acc[dateKey].hours += Number(ficha.hoursWorked);
        }
        acc[dateKey].entries += 1;
        return acc;
      },
      {} as Record<string, { date: string; hours: number; entries: number }>
    );

    res.json({
      data: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
      total: Object.keys(dailyStats).length,
    });
  })
);

/**
 * GET /api/v1/fichas/:id
 * Get single ficha by ID
 */
router.get(
  '/:id',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { id } = req.params;

    const ficha = await findScopedFicha(id, auth.uid, auth.companyId);

    if (!ficha) {
      res.status(404).json({ error: 'Ficha no encontrada' });
      return;
    }

    res.json({
      id: ficha.id,
      date: ficha.date,
      startTime: ficha.startTime,
      endTime: ficha.endTime,
      hoursWorked: ficha.hoursWorked,
      description: ficha.description,
      projectCode: ficha.projectCode,
      metadata: ficha.metadata,
      status: ficha.status,
      createdAt: ficha.createdAt,
    });
  })
);

/**
 * GET /api/v1/fichas/:id/audit-trail
 * Obtiene trazabilidad completa: ficha + eventos + cambios
 * Requiere: admin, manager, auditor (no employee de otra persona)
 */
router.get(
  '/:id/audit-trail',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { id } = req.params;

    const ficha = await findScopedFicha(id, auth.uid, auth.companyId);

    if (!ficha) {
      res.status(404).json({ error: 'Ficha no encontrada' });
      return;
    }

    // Validar permisos: solo propietario, manager, admin o auditor pueden ver el audit trail
    const isOwner = auth.uid === ficha.userId;
    const isAuditor = auth.role === 'auditor' || auth.role === 'manager' || auth.role === 'admin';

    if (!isOwner && !isAuditor) {
      res.status(403).json({ error: 'No tienes permisos para ver el historial de auditoría.' });
      return;
    }

    // Obtener todos los TimeEntry de la ficha
    const timeEntries = await AppDataSource.getRepository('TimeEntry')
      .createQueryBuilder('te')
      .where('te.fichaId = :fichaId', { fichaId: id })
      .orderBy('te.timestampUtc', 'ASC')
      .getMany();

    // Obtener todos los cambios en batch (evita N+1)
    const entryIds = timeEntries.map((e: Record<string, unknown>) => e.id as string);
    const changesByEntry: Record<string, unknown[]> = {};
    if (entryIds.length > 0) {
      const allChanges = await AppDataSource.getRepository('TimeEntryChangeLog')
        .createQueryBuilder('log')
        .where('log.timeEntryId IN (:...ids)', { ids: entryIds })
        .orderBy('log.createdAt', 'ASC')
        .getMany();

      for (const change of allChanges as Array<Record<string, unknown>>) {
        const key = change.timeEntryId as string;
        if (!changesByEntry[key]) changesByEntry[key] = [];
        changesByEntry[key].push(change);
      }
    }

    res.json({
      ficha: {
        id: ficha.id,
        date: ficha.date,
        startTime: ficha.startTime,
        endTime: ficha.endTime,
        hoursWorked: ficha.hoursWorked,
        description: ficha.description,
        projectCode: ficha.projectCode,
        status: ficha.status,
        createdAt: ficha.createdAt,
        metadata: ficha.metadata,
      },
      timeEntries: timeEntries.map((te: Record<string, unknown>) => ({
        id: te.id,
        type: te.type,
        timestampUtc: te.timestampUtc,
        localDateTime: te.localDateTime,
        source: te.source,
        ip: te.ip,
        latitude: te.latitude,
        longitude: te.longitude,
        createdAt: te.createdAt,
      })),
      changeLog: changesByEntry,
      auditMeta: {
        requestedBy: auth.uid,
        requestedAt: new Date().toISOString(),
        requestedRole: auth.role,
      },
    });
  })
);

/**
 * PUT /api/v1/fichas/:id
 * Update ficha
 */
router.put(
  '/:id',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { id } = req.params;
    const parseBody = updateFichaSchema.safeParse(req.body);

    if (!parseBody.success) {
      res.status(400).json(buildValidationError(parseBody.error));
      return;
    }

    const { endTime, description, projectCode, status, metadata } = parseBody.data;

    const ficha = await findScopedFicha(id, auth.uid, auth.companyId);

    if (!ficha) {
      res.status(404).json({ error: 'Ficha no encontrada' });
      return;
    }

    // Permitir actualizar estos campos
    if (endTime !== undefined) {
      ficha.endTime = endTime;

      // Recalcular hoursWorked
      if (ficha.endTime) {
        const startMinutes = toMinutes(ficha.startTime);
        const endMinutes = toMinutes(ficha.endTime);
        ficha.hoursWorked = parseFloat(((endMinutes - startMinutes) / 60).toFixed(2));
      }
    }

    if (description !== undefined) {
      ficha.description = description;
    }

    if (projectCode !== undefined) {
      ficha.projectCode = projectCode;
    }

    if (status !== undefined) {
      ficha.status = status;
    }

    if (metadata !== undefined) {
      ficha.metadata = metadata;
    }

    await AppDataSource.getRepository(Ficha).save(ficha);

    res.json({
      message: 'Ficha actualizada',
      ficha: {
        id: ficha.id,
        date: ficha.date,
        startTime: ficha.startTime,
        endTime: ficha.endTime,
        hoursWorked: ficha.hoursWorked,
        description: ficha.description,
        projectCode: ficha.projectCode,
        status: ficha.status,
      },
    });
  })
);

/**
 * POST /api/v1/fichas/:id/request-correction
 * Solicita una correccion sobre una ficha propia ya registrada.
 */
router.post(
  '/:id/request-correction',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { id } = req.params;
    const parsed = requestFichaCorrectionSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }

    const ficha = await findScopedFicha(id, auth.uid, auth.companyId);
    if (!ficha) {
      res.status(404).json({ error: 'Ficha no encontrada' });
      return;
    }

    if (ficha.status === 'archived') {
      res.status(409).json({ error: 'No se pueden solicitar correcciones sobre fichas archivadas.' });
      return;
    }

    const activeRequest = getFichaCorrectionRequest(ficha);
    if (activeRequest?.status === 'pending') {
      res.status(409).json({ error: 'Ya existe una solicitud de corrección pendiente para esta ficha.' });
      return;
    }

    let proposedChanges: FichaCorrectionChanges;
    try {
      proposedChanges = buildFichaCorrectionChanges(buildFichaBaseState(ficha), {
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        description: parsed.data.description,
        projectCode: parsed.data.projectCode,
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Solicitud de corrección inválida.' });
      return;
    }

    const correctionRequest: FichaCorrectionRequestRecord = {
      status: 'pending',
      reason: parsed.data.reason,
      requestedAt: new Date().toISOString(),
      requestedBy: auth.uid,
      proposedChanges,
    };

    upsertFichaCorrectionMetadata(ficha, correctionRequest);
    ficha.status = 'disputed';
    await AppDataSource.getRepository(Ficha).save(ficha);

    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: 'ficha_correction_requested',
      metadata: { fichaId: ficha.id, proposedChanges },
      ip: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });

    res.status(202).json({
      message: 'Solicitud de corrección registrada',
      correctionRequest,
      ficha: {
        id: ficha.id,
        status: ficha.status,
        metadata: ficha.metadata,
      },
    });
  })
);

/**
 * POST /api/v1/fichas/:id/review-correction
 * Revisa una solicitud de corrección pendiente dentro de la empresa.
 */
router.post(
  '/:id/review-correction',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    if (!requirePermission(req, res, 'review_ficha_correction')) {
      return;
    }

    const { id } = req.params;
    const parsed = reviewFichaCorrectionSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }

    const ficha = await AppDataSource.getRepository(Ficha)
      .createQueryBuilder('ficha')
      .innerJoin(User, 'user', 'user.uid = ficha.userId')
      .where('ficha.id = :id', { id })
      .andWhere('user.companyId = :companyId', { companyId: auth.companyId })
      .getOne();

    if (!ficha) {
      res.status(404).json({ error: 'Ficha no encontrada' });
      return;
    }

    const correctionRequest = getFichaCorrectionRequest(ficha);
    if (!correctionRequest || correctionRequest.status !== 'pending') {
      res.status(409).json({ error: 'La ficha no tiene una solicitud de corrección pendiente.' });
      return;
    }

    const reviewedRequest: FichaCorrectionRequestRecord = {
      ...correctionRequest,
      status: parsed.data.decision,
      reviewedAt: new Date().toISOString(),
      reviewedBy: auth.uid,
      reviewComment: parsed.data.comment,
    };

    // Capturar estado anterior para auditoría
    const beforeState = {
      startTime: ficha.startTime,
      endTime: ficha.endTime,
      hoursWorked: ficha.hoursWorked,
      description: ficha.description,
      projectCode: ficha.projectCode,
    };

    if (parsed.data.decision === 'approved') {
      const nextState = applyFichaCorrection(buildFichaBaseState(ficha), correctionRequest.proposedChanges);
      ficha.startTime = nextState.startTime;
      ficha.endTime = nextState.endTime;
      ficha.description = nextState.description;
      ficha.projectCode = nextState.projectCode;
      ficha.hoursWorked = nextState.hoursWorked;
      ficha.status = ficha.endTime ? 'confirmed' : 'draft';
    } else {
      ficha.status = ficha.endTime ? 'confirmed' : 'draft';
    }

    upsertFichaCorrectionMetadata(ficha, reviewedRequest);
    await AppDataSource.getRepository(Ficha).save(ficha);

    // Registrar cambios en TimeEntry si fue aprobada la corrección
    if (parsed.data.decision === 'approved') {
      const timeEntryService = getTimeEntryService();
      const afterState = {
        startTime: ficha.startTime,
        endTime: ficha.endTime,
        hoursWorked: ficha.hoursWorked,
        description: ficha.description,
        projectCode: ficha.projectCode,
      };

      try {
        await timeEntryService.approveChanges({
          fichaId: ficha.id,
          approvedBy: auth.uid,
          reason: parsed.data.comment || 'Corrección aprobada por manager',
          beforeState,
          afterState,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
      } catch (error) {
        console.error('Error registrando TimeEntryChangeLog para corrección:', error);
        // No bloquear respuesta si falla changeLog (fallback graceful)
      }
    }

    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: parsed.data.decision === 'approved' ? 'ficha_correction_approved' : 'ficha_correction_rejected',
      metadata: { fichaId: ficha.id, requestedBy: correctionRequest.requestedBy },
      ip: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });

    res.json({
      message: parsed.data.decision === 'approved'
        ? 'Corrección aplicada sobre la ficha'
        : 'Corrección rechazada',
      ficha: {
        id: ficha.id,
        date: ficha.date,
        startTime: ficha.startTime,
        endTime: ficha.endTime,
        hoursWorked: ficha.hoursWorked,
        description: ficha.description,
        projectCode: ficha.projectCode,
        status: ficha.status,
        metadata: ficha.metadata,
      },
    });
  })
);

/**
 * POST /api/v1/fichas/close-period
 * Cierra un periodo archivando fichas confirmadas (tenant-aware).
 */
router.post(
  '/close-period',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    if (!requirePermission(req, res, 'close_ficha_period')) {
      return;
    }

    const parsed = closeFichaPeriodSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }

    const { startDate, endDate, userId } = parsed.data;

    const qbDisputed = AppDataSource.getRepository(Ficha)
      .createQueryBuilder('ficha')
      .innerJoin(User, 'user', 'user.uid = ficha.userId')
      .where('user.companyId = :companyId', { companyId: auth.companyId })
      .andWhere('ficha.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('ficha.status = :status', { status: 'disputed' });

    if (userId) {
      qbDisputed.andWhere('ficha.userId = :userId', { userId });
    }

    const disputedCount = await qbDisputed.getCount();
    if (disputedCount > 0) {
      res.status(409).json({
        error: 'No se puede cerrar el periodo mientras existan fichas en disputa.',
        disputedCount,
      });
      return;
    }

    const qbConfirmed = AppDataSource.getRepository(Ficha)
      .createQueryBuilder('ficha')
      .innerJoin(User, 'user', 'user.uid = ficha.userId')
      .where('user.companyId = :companyId', { companyId: auth.companyId })
      .andWhere('ficha.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('ficha.status = :status', { status: 'confirmed' })
      .select('ficha.id', 'id');

    if (userId) {
      qbConfirmed.andWhere('ficha.userId = :userId', { userId });
    }

    const rows = await qbConfirmed.getRawMany<{ id: string }>();
    const ids = rows.map((row) => row.id);

    if (ids.length > 0) {
      await AppDataSource.getRepository(Ficha)
        .createQueryBuilder()
        .update(Ficha)
        .set({ status: 'archived' })
        .whereInIds(ids)
        .execute();
    }

    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: 'ficha_period_closed',
      metadata: {
        startDate,
        endDate,
        userId: userId ?? null,
        archivedCount: ids.length,
      },
      ip: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });

    res.json({
      message: 'Periodo cerrado correctamente',
      archivedCount: ids.length,
      scope: userId ? 'user' : 'company',
      range: { startDate, endDate },
    });
  })
);

/**
 * DELETE /api/v1/fichas/:id
 * Soft delete (archive) ficha
 */
router.delete(
  '/:id',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { id } = req.params;

    const ficha = await findScopedFicha(id, auth.uid, auth.companyId);

    if (!ficha) {
      res.status(404).json({ error: 'Ficha no encontrada' });
      return;
    }

    // Soft delete: cambiar status a archived
    ficha.status = 'archived';
    await AppDataSource.getRepository(Ficha).save(ficha);

    res.json({
      message: 'Ficha archivada',
      id: ficha.id,
    });
  })
);

/**
 * POST /api/v1/fichas/clockin
 * Registrar hora de entrada (crea ficha con startTime = ahora)
 */
router.post(
  '/clockin',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { dateIso, timeHHMM } = getMadridDateTimeParts(new Date());
    const startTime = timeHHMM;
    const todayDate = toUtcMidnightDate(dateIso);

    const fichaRepository = AppDataSource.getRepository(Ficha);

    // Evitar fichas duplicadas si ya hay una entrada activa hoy
    const openFicha = await fichaRepository
      .createQueryBuilder('ficha')
      .innerJoin(User, 'user', 'user.uid = ficha.userId')
      .where('ficha.userId = :uid', { uid: auth.uid })
      .andWhere('user.companyId = :companyId', { companyId: auth.companyId })
      .andWhere('ficha.date = :todayDate', { todayDate: dateIso })
      .andWhere('ficha.endTime IS NULL')
      .getOne();

    if (openFicha) {
      res.status(409).json({ error: 'Ya hay una jornada activa. Cierra la sesión actual antes de fichar de nuevo.' });
      return;
    }

    const { description, projectCode } = req.body as { description?: string; projectCode?: string };

    const ficha = fichaRepository.create({
      userId: auth.uid,
      date: todayDate,
      startTime,
      description,
      projectCode,
      status: 'draft',
    });

    await fichaRepository.save(ficha);

    // Registrar evento atómico CLOCK_IN
    const timeEntryService = getTimeEntryService();
    const now = new Date();
    const { dateIso: localDate } = getMadridDateTimeParts(now);
    
    try {
      await timeEntryService.recordClockEvent({
        userId: auth.uid,
        fichaId: ficha.id,
        type: TimeEntryType.CLOCK_IN,
        source: TimeEntrySource.WEB,
        timestampUtc: now,
        localDateTime: `${localDate}T${timeHHMM}${getMadridUtcOffset(now)}`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    } catch (eventError) {
      console.error('Error registrando TimeEntry CLOCK_IN:', eventError);
      // No bloquear respuesta si falla registro de evento (fallback graceful)
    }

    res.status(201).json({
      message: 'Entrada registrada',
      ficha: { id: ficha.id, date: ficha.date, startTime: ficha.startTime, status: ficha.status },
    });
  })
);

/**
 * POST /api/v1/fichas/clockout
 * Registrar hora de salida (cierra la ficha abierta de hoy)
 */
router.post(
  '/clockout',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { dateIso, timeHHMM } = getMadridDateTimeParts(new Date());
    const endTime = timeHHMM;

    const fichaRepository = AppDataSource.getRepository(Ficha);

    const openFicha = await fichaRepository
      .createQueryBuilder('ficha')
      .innerJoin(User, 'user', 'user.uid = ficha.userId')
      .where('ficha.userId = :uid', { uid: auth.uid })
      .andWhere('user.companyId = :companyId', { companyId: auth.companyId })
      .andWhere('ficha.date = :todayDate', { todayDate: dateIso })
      .andWhere('ficha.endTime IS NULL')
      .getOne();

    if (!openFicha) {
      res.status(404).json({ error: 'No hay jornada activa para hoy.' });
      return;
    }

    openFicha.endTime = endTime;
    openFicha.hoursWorked = parseFloat(((toMinutes(endTime) - toMinutes(openFicha.startTime)) / 60).toFixed(2));
    openFicha.status = 'confirmed';

    await fichaRepository.save(openFicha);

    // Registrar evento atómico CLOCK_OUT
    const timeEntryService = getTimeEntryService();
    const now = new Date();
    const { dateIso: localDate } = getMadridDateTimeParts(now);

    try {
      await timeEntryService.recordClockEvent({
        userId: auth.uid,
        fichaId: openFicha.id,
        type: TimeEntryType.CLOCK_OUT,
        source: TimeEntrySource.WEB,
        timestampUtc: now,
        localDateTime: `${localDate}T${timeHHMM}${getMadridUtcOffset(now)}`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    } catch (eventError) {
      console.error('Error registrando TimeEntry CLOCK_OUT:', eventError);
      // No bloquear respuesta si falla registro de evento (fallback graceful)
    }

    res.json({
      message: 'Salida registrada',
      ficha: {
        id: openFicha.id,
        date: openFicha.date,
        startTime: openFicha.startTime,
        endTime: openFicha.endTime,
        hoursWorked: openFicha.hoursWorked,
        status: openFicha.status,
      },
    });
  })
);

export default router;
