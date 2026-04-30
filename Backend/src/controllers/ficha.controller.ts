import { Router, Request, Response } from "express";
import { AppDataSource } from "../database.js";
import { IsNull } from "typeorm";
import { Ficha } from "../entities/Ficha.js";
import { User } from "../entities/User.js";
import { firebaseAuthMiddleware } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { logAction } from "../utils/auditLog.js";
import {
  appUserContextMiddleware,
  getAuthContext,
  requirePermission,
} from "../middleware/request-context.middleware.js";
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
} from "../utils/validation.js";
import {
  getMadridDateTimeParts,
  getMadridUtcOffset,
  toUtcMidnightDate,
} from "../utils/timezone.js";
import {
  applyFichaCorrection,
  buildFichaCorrectionChanges,
  type FichaCorrectionChanges,
} from "../utils/ficha-correction.js";
import { getTimeEntryService } from "../services/TimeEntryService.js";
import { TimeEntryType, TimeEntrySource } from "../entities/TimeEntry.js";
import { WorkCenter } from "../entities/WorkCenter.js";
import { LocationService } from "../services/LocationService.js";
import { clockInSchema, clockOutSchema } from "../utils/validation.js";

const router = Router();

type FichaCorrectionRequestRecord = {
  status: "pending" | "approved" | "rejected";
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
async function findScopedFicha(
  id: string,
  uid: string,
  companyId: string,
): Promise<Ficha | null> {
  return AppDataSource.getRepository(Ficha)
    .createQueryBuilder("ficha")
    .innerJoin(User, "user", "user.uid = ficha.userId")
    .where("ficha.id = :id", { id })
    .andWhere("ficha.userId = :uid", { uid })
    .andWhere("user.companyId = :companyId", { companyId })
    .getOne();
}

function getFichaCorrectionRequest(
  ficha: Ficha,
): FichaCorrectionRequestRecord | undefined {
  const correctionRequest = ficha.metadata?.correctionRequest;
  if (!correctionRequest || typeof correctionRequest !== "object") {
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
  "/",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const parseBody = createFichaSchema.safeParse(req.body);

    if (!parseBody.success) {
      res.status(400).json(buildValidationError(parseBody.error));
      return;
    }

    const { date, startTime, endTime, description, projectCode, metadata } =
      parseBody.data;

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
      message: "Ficha creada",
      ficha: {
        id: ficha.id,
        date: ficha.date,
        startTime: ficha.startTime,
        endTime: ficha.endTime,
        hoursWorked: ficha.hoursWorked,
        status: ficha.status,
      },
    });
  }),
);

/**
 * GET /api/v1/fichas
 * List user's fichas with optional date range filter
 */
router.get(
  "/",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const parseQuery = listFichasQuerySchema.safeParse(req.query);

    if (!parseQuery.success) {
      res.status(400).json(buildValidationError(parseQuery.error));
      return;
    }

    const { startDate, endDate, status, userId, limit, offset } =
      parseQuery.data;

    const qb = AppDataSource.getRepository(Ficha)
      .createQueryBuilder("ficha")
      .leftJoinAndSelect("User", "user", "user.uid = ficha.userId") // Cambio a leftJoin para mayor flexibilidad
      .select([
        "ficha.id",
        "ficha.userId",
        "ficha.date",
        "ficha.startTime",
        "ficha.endTime",
        "ficha.hoursWorked",
        "ficha.description",
        "ficha.projectCode",
        "ficha.status",
        "ficha.metadata",
        "user.displayName",
        "user.email",
        "user.uid",
      ])
      .where("user.companyId = :companyId", { companyId: auth.companyId })
      .orderBy("ficha.date", "DESC")
      .addOrderBy("ficha.startTime", "DESC")
      .take(limit)
      .skip(offset);

    // Si es admin/manager y hay userId, filtramos por ese empleado
    if (auth.isPrivileged && userId) {
      qb.andWhere("ficha.userId = :userId", { userId });
    } else if (!auth.isPrivileged) {
      // Si no es privilegiado, solo ve sus propias fichas
      qb.andWhere("ficha.userId = :uid", { uid: auth.uid });
    }

    if (status) {
      qb.andWhere("ficha.status = :status", { status });
    }

    if (startDate && endDate) {
      qb.andWhere("ficha.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });
    } else if (startDate) {
      qb.andWhere("ficha.date >= :startDate", { startDate });
    } else if (endDate) {
      qb.andWhere("ficha.date <= :endDate", { endDate });
    }

    const [fichas, total] = await qb.getManyAndCount();

    res.json({
      data: fichas.map((f) => ({
        ...f,
        userName:
          (f as any).displayName || (f as any).user?.displayName || "Sistema",
      })),
      pagination: {
        total,
        limit,
        offset,
      },
    });
  }),
);

/**
 * GET /api/v1/fichas/active
 * Obtiene la ficha activa (sin endTime) del usuario para hoy
 */
router.get(
  "/active",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);

    const repo = AppDataSource.getRepository(Ficha);
    const openFicha = await repo.findOne({
      where: {
        userId: auth.uid,
        endTime: IsNull(),
      },
    });

    if (openFicha) {
      const events = await getTimeEntryService().getsFichaEvents(openFicha.id);
      const lastEvent = events.length > 0 ? events[events.length - 1] : null;
      res.json({
        data: {
          ...openFicha,
          events: events.map((e) => ({
            type: e.type,
            timestampUtc: e.timestampUtc,
          })),
          lastEvent: lastEvent
            ? { type: lastEvent.type, timestampUtc: lastEvent.timestampUtc }
            : null,
        },
      });
      return;
    }

    res.json({ data: null });
  }),
);

/**
 * GET /api/v1/fichas/stats/daily
 * Get daily statistics (hours per day)
 * NOTE: Must be defined BEFORE /:id to prevent Express from capturing "stats" as :id
 */
router.get(
  "/stats/daily",
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
      .createQueryBuilder("ficha")
      .innerJoin(User, "user", "user.uid = ficha.userId")
      .where("ficha.userId = :uid", { uid: auth.uid })
      .andWhere("user.companyId = :companyId", { companyId: auth.companyId })
      .andWhere("ficha.status = :status", { status: "confirmed" });

    if (startDate && endDate) {
      qbStats.andWhere("ficha.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });
    }

    const fichas = await qbStats.getMany();

    // Agrupar por día
    const dailyStats = fichas.reduce(
      (acc, ficha) => {
        // PostgreSQL puede devolver date como string o Date; normalizar siempre
        const raw = ficha.date as unknown as string | Date;
        const dateKey =
          typeof raw === "string"
            ? (raw as string).split("T")[0]
            : (raw as Date).toISOString().split("T")[0];
        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey, hours: 0, entries: 0 };
        }
        if (ficha.hoursWorked) {
          acc[dateKey].hours += Number(ficha.hoursWorked);
        }
        acc[dateKey].entries += 1;
        return acc;
      },
      {} as Record<string, { date: string; hours: number; entries: number }>,
    );

    res.json({
      data: Object.values(dailyStats).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
      total: Object.keys(dailyStats).length,
    });
  }),
);

/**
 * GET /api/v1/fichas/:id
 * Get single ficha by ID
 */
router.get(
  "/:id",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { id } = req.params;

    const ficha = await findScopedFicha(id, auth.uid, auth.companyId);

    if (!ficha) {
      res.status(404).json({ error: "Ficha no encontrada" });
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
  }),
);

/**
 * GET /api/v1/fichas/:id/audit-trail
 * Obtiene trazabilidad completa: ficha + eventos + cambios
 * Requiere: admin, manager, auditor (no employee de otra persona)
 */
router.get(
  "/:id/audit-trail",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { id } = req.params;

    const ficha = await findScopedFicha(id, auth.uid, auth.companyId);

    if (!ficha) {
      res.status(404).json({ error: "Ficha no encontrada" });
      return;
    }

    // Validar permisos: solo propietario, manager, admin o auditor pueden ver el audit trail
    const isOwner = auth.uid === ficha.userId;
    const isAuditor =
      auth.role === "auditor" ||
      auth.role === "manager" ||
      auth.role === "admin";

    if (!isOwner && !isAuditor) {
      res
        .status(403)
        .json({
          error: "No tienes permisos para ver el historial de auditoría.",
        });
      return;
    }

    // Obtener todos los TimeEntry de la ficha
    const timeEntries = await AppDataSource.getRepository("TimeEntry")
      .createQueryBuilder("te")
      .where("te.fichaId = :fichaId", { fichaId: id })
      .orderBy("te.timestampUtc", "ASC")
      .getMany();

    // Obtener todos los cambios en batch (evita N+1)
    const entryIds = timeEntries.map(
      (e: Record<string, unknown>) => e.id as string,
    );
    const changesByEntry: Record<string, unknown[]> = {};
    if (entryIds.length > 0) {
      const allChanges = await AppDataSource.getRepository("TimeEntryChangeLog")
        .createQueryBuilder("log")
        .where("log.timeEntryId IN (:...ids)", { ids: entryIds })
        .orderBy("log.createdAt", "ASC")
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
  }),
);

/**
 * PUT /api/v1/fichas/:id
 * Update ficha
 */
router.put(
  "/:id",
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

    const {
      date,
      startTime,
      endTime,
      description,
      projectCode,
      status,
      metadata,
    } = parseBody.data;

    const ficha = await findScopedFicha(id, auth.uid, auth.companyId);

    if (!ficha) {
      res.status(404).json({ error: "Ficha no encontrada" });
      return;
    }

    // Permitir actualizar estos campos
    if (date) {
      ficha.date = new Date(date);
    }

    if (startTime) {
      ficha.startTime = startTime;
    }

    if (endTime !== undefined) {
      ficha.endTime = endTime || undefined;
    }

    // Recalcular horas trabajadas si ha cambiado algo de tiempo
    if (ficha.startTime && ficha.endTime) {
      try {
        const startMinutes = toMinutes(ficha.startTime);
        const endMinutes = toMinutes(ficha.endTime);
        ficha.hoursWorked = parseFloat(
          ((endMinutes - startMinutes) / 60).toFixed(2),
        );
      } catch (e) {
        console.error("Error recalculando horas:", e);
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
      message: "Ficha actualizada",
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
  }),
);

/**
 * POST /api/v1/fichas/:id/request-correction
 * Solicita una correccion sobre una ficha propia ya registrada.
 */
router.post(
  "/:id/request-correction",
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
      res.status(404).json({ error: "Ficha no encontrada" });
      return;
    }

    if (ficha.status === "archived") {
      res
        .status(409)
        .json({
          error: "No se pueden solicitar correcciones sobre fichas archivadas.",
        });
      return;
    }

    const activeRequest = getFichaCorrectionRequest(ficha);
    if (activeRequest?.status === "pending") {
      res
        .status(409)
        .json({
          error:
            "Ya existe una solicitud de corrección pendiente para esta ficha.",
        });
      return;
    }

    let proposedChanges: FichaCorrectionChanges;
    try {
      proposedChanges = buildFichaCorrectionChanges(
        buildFichaBaseState(ficha),
        {
          startTime: parsed.data.startTime,
          endTime: parsed.data.endTime,
          description: parsed.data.description,
          projectCode: parsed.data.projectCode,
        },
      );
    } catch (error) {
      res
        .status(400)
        .json({
          error:
            error instanceof Error
              ? error.message
              : "Solicitud de corrección inválida.",
        });
      return;
    }

    const correctionRequest: FichaCorrectionRequestRecord = {
      status: "pending",
      reason: parsed.data.reason,
      requestedAt: new Date().toISOString(),
      requestedBy: auth.uid,
      proposedChanges,
    };

    upsertFichaCorrectionMetadata(ficha, correctionRequest);
    ficha.status = "disputed";
    await AppDataSource.getRepository(Ficha).save(ficha);

    // Registrar solicitud en TimeEntryChangeLog (auditoría atómica)
    const timeEntryService = getTimeEntryService();
    try {
      await timeEntryService.requestCorrections({
        fichaId: ficha.id,
        requestedBy: auth.uid,
        reason: parsed.data.reason,
        beforeState: buildFichaBaseState(ficha), // El estado fue capturado antes de los cambios propuestos
        afterState: {
          startTime: parsed.data.startTime ?? ficha.startTime,
          endTime: parsed.data.endTime ?? ficha.endTime,
          description: parsed.data.description ?? ficha.description,
          projectCode: parsed.data.projectCode ?? ficha.projectCode,
        },
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });
    } catch (auditError) {
      console.error(
        "Error registrando TimeEntryChangeLog para solicitud de corrección:",
        auditError,
      );
      // No bloqueamos la solicitud principal, pero lo logueamos
    }

    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: "ficha_correction_requested",
      metadata: { fichaId: ficha.id, proposedChanges },
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
    });

    res.status(202).json({
      message: "Solicitud de corrección registrada",
      correctionRequest,
      ficha: {
        id: ficha.id,
        status: ficha.status,
        metadata: ficha.metadata,
      },
    });
  }),
);

/**
 * POST /api/v1/fichas/:id/review-correction
 * Revisa una solicitud de corrección pendiente dentro de la empresa.
 */
router.post(
  "/:id/review-correction",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    if (!requirePermission(req, res, "review_ficha_correction")) {
      return;
    }

    const { id } = req.params;
    const parsed = reviewFichaCorrectionSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }

    const ficha = await AppDataSource.getRepository(Ficha)
      .createQueryBuilder("ficha")
      .innerJoin(User, "user", "user.uid = ficha.userId")
      .where("ficha.id = :id", { id })
      .andWhere("user.companyId = :companyId", { companyId: auth.companyId })
      .getOne();

    if (!ficha) {
      res.status(404).json({ error: "Ficha no encontrada" });
      return;
    }

    const correctionRequest = getFichaCorrectionRequest(ficha);
    if (!correctionRequest || correctionRequest.status !== "pending") {
      res
        .status(409)
        .json({
          error: "La ficha no tiene una solicitud de corrección pendiente.",
        });
      return;
    }

    const reviewedRequest: FichaCorrectionRequestRecord = {
      ...correctionRequest,
      status: parsed.data.decision,
      reviewedAt: new Date().toISOString(),
      reviewedBy: auth.uid,
      reviewComment: parsed.data.comment,
    };

    if (parsed.data.decision === "approved") {
      const nextState = applyFichaCorrection(
        buildFichaBaseState(ficha),
        correctionRequest.proposedChanges,
      );
      ficha.startTime = nextState.startTime;
      ficha.endTime = nextState.endTime;
      ficha.description = nextState.description;
      ficha.projectCode = nextState.projectCode;
      ficha.hoursWorked = nextState.hoursWorked;
      ficha.status = ficha.endTime ? "confirmed" : "draft";
    } else {
      ficha.status = ficha.endTime ? "confirmed" : "draft";
    }

    upsertFichaCorrectionMetadata(ficha, reviewedRequest);
    await AppDataSource.getRepository(Ficha).save(ficha);

    // Cerrar ciclo de vida en TimeEntryChangeLog (Aprobar o Rechazar logs pendientes)
    const timeEntryService = getTimeEntryService();
    try {
      await timeEntryService.reviewCorrections({
        fichaId: ficha.id,
        reviewedBy: auth.uid,
        decision: parsed.data.decision,
        comment:
          parsed.data.comment ||
          (parsed.data.decision === "approved"
            ? "Corrección aprobada"
            : "Corrección rechazada"),
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });
    } catch (error) {
      console.error(
        "Error actualizando TimeEntryChangeLog en revisión:",
        error,
      );
      // Fallback graceful
    }

    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action:
        parsed.data.decision === "approved"
          ? "ficha_correction_approved"
          : "ficha_correction_rejected",
      metadata: {
        fichaId: ficha.id,
        requestedBy: correctionRequest.requestedBy,
      },
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
    });

    res.json({
      message:
        parsed.data.decision === "approved"
          ? "Corrección aplicada sobre la ficha"
          : "Corrección rechazada",
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
  }),
);

/**
 * POST /api/v1/fichas/close-period
 * Cierra un periodo archivando fichas confirmadas (tenant-aware).
 */
router.post(
  "/close-period",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    if (!requirePermission(req, res, "close_ficha_period")) {
      return;
    }

    const parsed = closeFichaPeriodSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }

    const { startDate, endDate, userId } = parsed.data;

    const qbDisputed = AppDataSource.getRepository(Ficha)
      .createQueryBuilder("ficha")
      .innerJoin(User, "user", "user.uid = ficha.userId")
      .where("user.companyId = :companyId", { companyId: auth.companyId })
      .andWhere("ficha.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("ficha.status = :status", { status: "disputed" });

    if (userId) {
      qbDisputed.andWhere("ficha.userId = :userId", { userId });
    }

    const disputedCount = await qbDisputed.getCount();
    if (disputedCount > 0) {
      res.status(409).json({
        error:
          "No se puede cerrar el periodo mientras existan fichas en disputa.",
        disputedCount,
      });
      return;
    }

    const qbConfirmed = AppDataSource.getRepository(Ficha)
      .createQueryBuilder("ficha")
      .innerJoin(User, "user", "user.uid = ficha.userId")
      .where("user.companyId = :companyId", { companyId: auth.companyId })
      .andWhere("ficha.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("ficha.status = :status", { status: "confirmed" })
      .select("ficha.id", "id");

    if (userId) {
      qbConfirmed.andWhere("ficha.userId = :userId", { userId });
    }

    const rows = await qbConfirmed.getRawMany<{ id: string }>();
    const ids = rows.map((row) => row.id);

    if (ids.length > 0) {
      await AppDataSource.getRepository(Ficha)
        .createQueryBuilder()
        .update(Ficha)
        .set({ status: "archived" })
        .whereInIds(ids)
        .execute();
    }

    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: "ficha_period_closed",
      metadata: {
        startDate,
        endDate,
        userId: userId ?? null,
        archivedCount: ids.length,
      },
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
    });

    res.json({
      message: "Periodo cerrado correctamente",
      archivedCount: ids.length,
      scope: userId ? "user" : "company",
      range: { startDate, endDate },
    });
  }),
);

/**
 * DELETE /api/v1/fichas/:id
 * Soft delete (archive) ficha
 */
router.delete(
  "/:id",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { id } = req.params;

    const ficha = await findScopedFicha(id, auth.uid, auth.companyId);

    if (!ficha) {
      res.status(404).json({ error: "Ficha no encontrada" });
      return;
    }

    // Soft delete: cambiar status a archived
    ficha.status = "archived";
    await AppDataSource.getRepository(Ficha).save(ficha);

    res.json({
      message: "Ficha archivada",
      id: ficha.id,
    });
  }),
);

/**
 * POST /api/v1/fichas/clockin
 * Registrar hora de entrada (crea ficha con startTime = ahora)
 */
router.post(
  "/clockin",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { dateIso, timeHHMM } = getMadridDateTimeParts(new Date());
    const startTime = timeHHMM;
    const todayDate = toUtcMidnightDate(dateIso);

    const fichaRepository = AppDataSource.getRepository(Ficha);

    // Evitar fichas duplicadas si ya hay una entrada activa hoy
    const openFicha = await fichaRepository.findOne({
      where: {
        userId: auth.uid,
        endTime: IsNull(),
      },
    });

    if (openFicha) {
      res
        .status(409)
        .json({
          error:
            "Ya hay una jornada activa. Cierra la sesión actual antes de fichar de nuevo.",
        });
      return;
    }

    const parseBody = clockInSchema.safeParse(req.body);
    if (!parseBody.success) {
      res.status(400).json(buildValidationError(parseBody.error));
      return;
    }

    const {
      description,
      projectCode,
      location,
      qrToken,
      deviceId,
      authMethod,
    } = parseBody.data;

    // --- VALIDACIONES DE RRHH ---
    const user = await AppDataSource.getRepository(User).findOneBy({
      uid: auth.uid,
    });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const workCenterRepo = AppDataSource.getRepository(WorkCenter);

    // 1. Geolocalización
    if (user.requiresGeolocation) {
      if (!location) {
        res
          .status(403)
          .json({ error: "La ubicación GPS es obligatoria para fichar." });
        return;
      }

      const centers = await workCenterRepo.findBy({
        companyId: auth.companyId,
        status: "active",
      });
      const isInsideAny = centers.some(
        (c) =>
          c.latitude &&
          c.longitude &&
          LocationService.isWithinRadius(
            location,
            { lat: Number(c.latitude), lng: Number(c.longitude) },
            c.radiusMeters,
          ),
      );

      if (!isInsideAny) {
        res
          .status(403)
          .json({
            error:
              "Estás fuera del radio de cualquier centro de trabajo autorizado.",
          });
        return;
      }
    }

    // 2. Código QR
    if (user.requiresQR) {
      if (!qrToken) {
        res
          .status(403)
          .json({
            error: "El escaneo de código QR es obligatorio para fichar.",
          });
        return;
      }

      const validToken = await workCenterRepo.findOneBy({
        companyId: auth.companyId,
        qrToken,
        status: "active",
      });
      if (!validToken) {
        res
          .status(403)
          .json({
            error:
              "El código QR no es válido o no pertenece a una sede autorizada.",
          });
        return;
      }
    }
    // 3. Bloqueo de Dispositivo (Antifraude)
    if (deviceId) {
      if (!user.authorizedDeviceId) {
        // Primer fichaje: vinculamos el dispositivo automáticamente
        user.authorizedDeviceId = deviceId;
        await AppDataSource.getRepository(User).save(user);
      } else if (user.authorizedDeviceId !== deviceId) {
        res.status(403).json({
          error: "Dispositivo no autorizado.",
          message:
            "Estás intentando fichar desde un dispositivo distinto al habitual. Contacta con tu administrador para desvincular el anterior.",
        });
        return;
      }
    }
    // ----------------------------

    const ficha = fichaRepository.create({
      userId: auth.uid,
      date: todayDate,
      startTime,
      description,
      projectCode,
      status: "draft",
      clockInMethod: authMethod || "password",
      metadata: location
        ? { location: `${location.lat},${location.lng}` }
        : undefined,
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
        userAgent: req.get("user-agent"),
        latitude: location?.lat,
        longitude: location?.lng,
        deviceId: deviceId,
      });
    } catch (eventError) {
      console.error("Error registrando TimeEntry CLOCK_IN:", eventError);
      // No bloquear respuesta si falla registro de evento (fallback graceful)
    }

    const events = await timeEntryService.getsFichaEvents(ficha.id);
    res.status(201).json({
      message: "Entrada registrada",
      ficha: {
        ...ficha,
        events: events.map((e) => ({
          type: e.type,
          timestampUtc: e.timestampUtc,
        })),
        lastEvent: events[events.length - 1],
      },
    });
  }),
);

/**
 * POST /api/v1/fichas/clockout
 * Registrar hora de salida (cierra la ficha abierta de hoy)
 */
router.post(
  "/clockout",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { timeHHMM } = getMadridDateTimeParts(new Date());
    const endTime = timeHHMM;

    const fichaRepository = AppDataSource.getRepository(Ficha);

    const openFicha = await fichaRepository
      .createQueryBuilder("ficha")
      .innerJoin(User, "user", "user.uid = ficha.userId")
      .where("ficha.userId = :uid", { uid: auth.uid })
      .andWhere("ficha.endTime IS NULL")
      .getOne();

    if (!openFicha) {
      res.status(404).json({ error: "No hay jornada activa para hoy." });
      return;
    }

    const parseBody = clockOutSchema.safeParse(req.body);
    if (!parseBody.success) {
      res.status(400).json(buildValidationError(parseBody.error));
      return;
    }

    const { location, qrToken, deviceId, authMethod } = parseBody.data;

    // --- VALIDACIONES DE RRHH ---
    const user = await AppDataSource.getRepository(User).findOneBy({
      uid: auth.uid,
    });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const workCenterRepo = AppDataSource.getRepository(WorkCenter);

    // 1. Geolocalización (CLOCK-OUT)
    if (user.requiresGeolocation) {
      if (!location) {
        res
          .status(403)
          .json({
            error: "La ubicación GPS es obligatoria para fichar la salida.",
          });
        return;
      }

      const centers = await workCenterRepo.findBy({
        companyId: auth.companyId,
        status: "active",
      });
      const isInsideAny = centers.some(
        (c) =>
          c.latitude &&
          c.longitude &&
          LocationService.isWithinRadius(
            location,
            { lat: Number(c.latitude), lng: Number(c.longitude) },
            c.radiusMeters,
          ),
      );

      if (!isInsideAny) {
        res
          .status(403)
          .json({
            error:
              "No puedes finalizar la jornada fuera de un centro de trabajo autorizado.",
          });
        return;
      }
    }

    // 2. Código QR (CLOCK-OUT)
    if (user.requiresQR) {
      if (!qrToken) {
        res
          .status(403)
          .json({
            error:
              "El escaneo de código QR es obligatorio para finalizar la jornada.",
          });
        return;
      }

      const validToken = await workCenterRepo.findOneBy({
        companyId: auth.companyId,
        qrToken,
        status: "active",
      });
      if (!validToken) {
        res
          .status(403)
          .json({ error: "El código QR no es válido para esta sede." });
        return;
      }
    }

    // 3. Bloqueo de Dispositivo (Antifraude)
    if (deviceId) {
      if (user.authorizedDeviceId && user.authorizedDeviceId !== deviceId) {
        res.status(403).json({
          error: "Dispositivo no autorizado para la salida.",
          message:
            "Debes finalizar la jornada desde el mismo dispositivo con el que la iniciaste.",
        });
        return;
      }
    }
    // ----------------------------

    openFicha.endTime = endTime;
    openFicha.clockOutMethod = authMethod || "password";

    // Calcular horas reales basadas en eventos atómicos (incluyendo pausas)
    const timeEntryService = getTimeEntryService();
    const now = new Date();
    const { dateIso: localDate } = getMadridDateTimeParts(now);

    // Primero registramos el evento de salida para que calculateWorkingHours lo tenga en cuenta
    try {
      await timeEntryService.recordClockEvent({
        userId: auth.uid,
        fichaId: openFicha.id,
        type: TimeEntryType.CLOCK_OUT,
        source: TimeEntrySource.WEB,
        timestampUtc: now,
        localDateTime: `${localDate}T${timeHHMM}${getMadridUtcOffset(now)}`,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        latitude: location?.lat,
        longitude: location?.lng,
        deviceId: deviceId,
      });
    } catch (eventError) {
      console.error("Error registrando TimeEntry CLOCK_OUT:", eventError);
    }

    // Ahora calculamos el total real
    openFicha.hoursWorked = await timeEntryService.calculateWorkingHours(
      openFicha.id,
    );
    openFicha.status = "confirmed";

    await fichaRepository.save(openFicha);

    res.json({
      message: "Salida registrada",
      ficha: {
        id: openFicha.id,
        date: openFicha.date,
        startTime: openFicha.startTime,
        endTime: openFicha.endTime,
        hoursWorked: openFicha.hoursWorked,
        status: openFicha.status,
      },
    });
  }),
);

/**
 * POST /api/v1/fichas/break-start
 * Iniciar una pausa
 */
router.post(
  "/break-start",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { timeHHMM } = getMadridDateTimeParts(new Date());
    const { deviceId } = req.body || {};

    const user = await AppDataSource.getRepository(User).findOneBy({
      uid: auth.uid,
    });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // Bloqueo de Dispositivo (Antifraude)
    if (deviceId) {
      if (user.authorizedDeviceId && user.authorizedDeviceId !== deviceId) {
        res.status(403).json({
          error: "Dispositivo no autorizado para la pausa.",
          message:
            "Debes interactuar desde el mismo dispositivo con el que iniciaste tu jornada.",
        });
        return;
      }
    }

    const fichaRepository = AppDataSource.getRepository(Ficha);
    const openFicha = await fichaRepository.findOne({
      where: {
        userId: auth.uid,
        endTime: IsNull(),
      },
    });

    if (!openFicha) {
      res
        .status(404)
        .json({ error: "No hay una jornada activa para iniciar una pausa." });
      return;
    }

    const timeEntryService = getTimeEntryService();
    const now = new Date();
    const { dateIso: localDate } = getMadridDateTimeParts(now);

    try {
      await timeEntryService.recordClockEvent({
        userId: auth.uid,
        fichaId: openFicha.id,
        type: TimeEntryType.BREAK_START,
        source: TimeEntrySource.WEB,
        timestampUtc: now,
        localDateTime: `${localDate}T${timeHHMM}${getMadridUtcOffset(now)}`,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        deviceId: deviceId,
      });

      res
        .status(201)
        .json({ message: "Pausa iniciada", fichaId: openFicha.id });
    } catch {
      res.status(500).json({ error: "Error al registrar inicio de pausa." });
    }
  }),
);

/**
 * POST /api/v1/fichas/break-end
 * Finalizar una pausa
 */
router.post(
  "/break-end",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { timeHHMM } = getMadridDateTimeParts(new Date());
    const { deviceId } = req.body || {};

    const user = await AppDataSource.getRepository(User).findOneBy({
      uid: auth.uid,
    });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // Bloqueo de Dispositivo (Antifraude)
    if (deviceId) {
      if (user.authorizedDeviceId && user.authorizedDeviceId !== deviceId) {
        res.status(403).json({
          error: "Dispositivo no autorizado para reanudar.",
          message: "Debes reanudar desde el mismo dispositivo autorizado.",
        });
        return;
      }
    }

    const fichaRepository = AppDataSource.getRepository(Ficha);
    const openFicha = await fichaRepository.findOne({
      where: {
        userId: auth.uid,
        endTime: IsNull(),
      },
    });

    if (!openFicha) {
      res.status(404).json({ error: "No hay una jornada activa." });
      return;
    }

    const timeEntryService = getTimeEntryService();
    const now = new Date();
    const { dateIso: localDate } = getMadridDateTimeParts(now);

    try {
      await timeEntryService.recordClockEvent({
        userId: auth.uid,
        fichaId: openFicha.id,
        type: TimeEntryType.BREAK_END,
        source: TimeEntrySource.WEB,
        timestampUtc: now,
        localDateTime: `${localDate}T${timeHHMM}${getMadridUtcOffset(now)}`,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        deviceId: deviceId,
      });

      res
        .status(201)
        .json({ message: "Pausa finalizada", fichaId: openFicha.id });
    } catch {
      res.status(500).json({ error: "Error al registrar fin de pausa." });
    }
  }),
);

export default router;
