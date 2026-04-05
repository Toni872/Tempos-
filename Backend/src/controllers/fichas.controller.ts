import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { Ficha } from '../entities/Ficha.js';
import { firebaseAuthMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { Between } from 'typeorm';

const router = Router();

/**
 * POST /api/v1/fichas
 * Crear nueva ficha (entrada de tiempo)
 */
router.post(
  '/',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const { date, startTime, endTime, description, projectCode, metadata } = req.body;

    if (!date || !startTime) {
      res.status(400).json({ error: 'date y startTime son requeridos' });
      return;
    }

    const fichaRepository = AppDataSource.getRepository(Ficha);

    // Calcular horasWorked si endTime está disponible
    let hoursWorked: number | undefined;
    if (endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      hoursWorked = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
    }

    const ficha = fichaRepository.create({
      userId: firebaseUser.uid,
      date: new Date(date),
      startTime,
      endTime,
      hoursWorked,
      description,
      projectCode,
      metadata,
      status: 'draft',
    });

    await fichaRepository.save(ficha);

    res.status(201).json({
      message: 'Ficha creada exitosamente',
      ficha,
    });
  })
);

/**
 * GET /api/v1/fichas
 * Listar fichas del usuario (con filtros opcionales)
 * Query params: startDate, endDate, status, projectCode
 */
router.get(
  '/',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const { startDate, endDate, status, projectCode } = req.query;

    const fichaRepository = AppDataSource.getRepository(Ficha);

    // Construir query dinámicamente
    let query = fichaRepository.createQueryBuilder('ficha').where('ficha.userId = :userId', {
      userId: firebaseUser.uid,
    });

    if (startDate && endDate) {
      query = query.andWhere('ficha.date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      });
    } else if (startDate) {
      query = query.andWhere('ficha.date >= :startDate', {
        startDate: new Date(startDate as string),
      });
    } else if (endDate) {
      query = query.andWhere('ficha.date <= :endDate', {
        endDate: new Date(endDate as string),
      });
    }

    if (status) {
      query = query.andWhere('ficha.status = :status', { status });
    }

    if (projectCode) {
      query = query.andWhere('ficha.projectCode = :projectCode', { projectCode });
    }

    const fichas = await query.orderBy('ficha.date', 'DESC').getMany();

    res.json({
      total: fichas.length,
      fichas,
    });
  })
);

/**
 * GET /api/v1/fichas/:id
 * Obtener ficha específica
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

    res.json(ficha);
  })
);

/**
 * PUT /api/v1/fichas/:id
 * Actualizar ficha
 */
router.put(
  '/:id',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const { id } = req.params;
    const { endTime, description, projectCode, status, metadata } = req.body;

    const fichaRepository = AppDataSource.getRepository(Ficha);
    const ficha = await fichaRepository.findOne({
      where: { id, userId: firebaseUser.uid },
    });

    if (!ficha) {
      res.status(404).json({ error: 'Ficha no encontrada' });
      return;
    }

    // Actualizar campos permitidos
    if (endTime) {
      ficha.endTime = endTime;
      // Recalcular hoursWorked
      const [startHour, startMin] = ficha.startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      ficha.hoursWorked = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
    }

    if (description !== undefined) ficha.description = description;
    if (projectCode !== undefined) ficha.projectCode = projectCode;
    if (status && ['draft', 'confirmed', 'disputed', 'archived'].includes(status)) {
      ficha.status = status;
    }
    if (metadata !== undefined) ficha.metadata = metadata;

    await fichaRepository.save(ficha);

    res.json({
      message: 'Ficha actualizada exitosamente',
      ficha,
    });
  })
);

/**
 * DELETE /api/v1/fichas/:id
 * Archivar ficha (soft delete)
 */
router.delete(
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

    ficha.status = 'archived';
    await fichaRepository.save(ficha);

    res.json({
      message: 'Ficha archivada',
      ficha,
    });
  })
);

/**
 * GET /api/v1/fichas/summary/daily
 * Resumen diario de horas trabajadas
 * Query params: startDate, endDate
 */
router.get(
  '/summary/daily',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'startDate y endDate son requeridos (YYYY-MM-DD)' });
      return;
    }

    const fichaRepository = AppDataSource.getRepository(Ficha);

    const fichas = await fichaRepository.find({
      where: {
        userId: firebaseUser.uid,
        date: Between(new Date(startDate as string), new Date(endDate as string)),
        status: 'confirmed',
      },
      order: { date: 'ASC' },
    });

    // Agrupar por date
    const summary: Record<string, { entries: number; totalHours: number; fichas: Ficha[] }> = {};

    fichas.forEach((ficha) => {
      const dateStr = ficha.date.toISOString().split('T')[0];
      if (!summary[dateStr]) {
        summary[dateStr] = { entries: 0, totalHours: 0, fichas: [] };
      }
      summary[dateStr].entries += 1;
      summary[dateStr].totalHours += ficha.hoursWorked || 0;
      summary[dateStr].fichas.push(ficha);
    });

    res.json({
      period: { startDate, endDate },
      summary,
      totalDays: Object.keys(summary).length,
      totalHours: Object.values(summary).reduce((acc, day) => acc + day.totalHours, 0),
    });
  })
);

export default router;
