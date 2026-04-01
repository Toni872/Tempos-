import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { Ficha } from '../entities/Ficha.js';
import { firebaseAuthMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  buildValidationError,
  createFichaSchema,
  dailyStatsQuerySchema,
  listFichasQuerySchema,
  toMinutes,
  updateFichaSchema,
} from '../utils/validation.js';

const router = Router();

/**
 * POST /api/v1/fichas
 * Create a new time tracking entry
 */
router.post(
  '/',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
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
      userId: firebaseUser.uid,
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const parseQuery = listFichasQuerySchema.safeParse(req.query);

    if (!parseQuery.success) {
      res.status(400).json(buildValidationError(parseQuery.error));
      return;
    }

    const { startDate, endDate, status, limit, offset } = parseQuery.data;

    const fichaRepository = AppDataSource.getRepository(Ficha);

    // Construir where clause
    const where: any = { userId: firebaseUser.uid };

    if (status) {
      where.status = status;
    }

    // Date range filter
    if (startDate && endDate) {
      where.date = Between(new Date(startDate as string), new Date(endDate as string));
    } else if (startDate) {
      where.date = MoreThanOrEqual(new Date(startDate as string));
    } else if (endDate) {
      where.date = LessThanOrEqual(new Date(endDate as string));
    }

    const [fichas, total] = await fichaRepository.findAndCount({
      where,
      order: { date: 'DESC', startTime: 'DESC' },
      take: limit,
      skip: offset,
    });

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
 * GET /api/v1/fichas/:id
 * Get single ficha by ID
 */
router.get(
  '/:id',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const { id } = req.params;

    const fichaRepository = AppDataSource.getRepository(Ficha);

    const ficha = await fichaRepository.findOne({
      where: { id, userId: firebaseUser.uid },
    });

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
 * PUT /api/v1/fichas/:id
 * Update ficha
 */
router.put(
  '/:id',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const { id } = req.params;
    const parseBody = updateFichaSchema.safeParse(req.body);

    if (!parseBody.success) {
      res.status(400).json(buildValidationError(parseBody.error));
      return;
    }

    const { endTime, description, projectCode, status, metadata } = parseBody.data;

    const fichaRepository = AppDataSource.getRepository(Ficha);

    let ficha = await fichaRepository.findOne({
      where: { id, userId: firebaseUser.uid },
    });

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

    await fichaRepository.save(ficha);

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
 * DELETE /api/v1/fichas/:id
 * Soft delete (archive) ficha
 */
router.delete(
  '/:id',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const { id } = req.params;

    const fichaRepository = AppDataSource.getRepository(Ficha);

    let ficha = await fichaRepository.findOne({
      where: { id, userId: firebaseUser.uid },
    });

    if (!ficha) {
      res.status(404).json({ error: 'Ficha no encontrada' });
      return;
    }

    // Soft delete: cambiar status a archived
    ficha.status = 'archived';
    await fichaRepository.save(ficha);

    res.json({
      message: 'Ficha archivada',
      id: ficha.id,
    });
  })
);

/**
 * GET /api/v1/fichas/stats/daily
 * Get daily statistics (hours per day)
 */
router.get(
  '/stats/daily',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const parseQuery = dailyStatsQuerySchema.safeParse(req.query);

    if (!parseQuery.success) {
      res.status(400).json(buildValidationError(parseQuery.error));
      return;
    }

    const { startDate, endDate } = parseQuery.data;

    const fichaRepository = AppDataSource.getRepository(Ficha);

    const where: any = {
      userId: firebaseUser.uid,
      status: 'confirmed',
    };

    if (startDate && endDate) {
      where.date = Between(new Date(startDate), new Date(endDate));
    }

    const fichas = await fichaRepository.find({ where });

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

export default router;
