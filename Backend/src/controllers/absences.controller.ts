import { Router, Request, Response } from 'express';
import { firebaseAuthMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppDataSource } from '../database.js';
import { Absence } from '../entities/Absence.js';
import { buildValidationError, createAbsenceSchema } from '../utils/validation.js';

const router = Router();

/**
 * GET /api/v1/absences
 * List all absences for the authenticated user (or all if admin)
 */
router.get(
  '/',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const repo = AppDataSource.getRepository(Absence);

    // Admins can see all absences; regular users only their own
    const isAdmin = (req as any).isAdmin || req.query.admin === '1';
    const where = isAdmin ? {} : { userId: firebaseUser.uid };

    const absences = await repo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    res.json({ data: absences });
  })
);

/**
 * POST /api/v1/absences
 * Create a new absence request
 */
router.post(
  '/',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const parsed = createAbsenceSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }

    const repo = AppDataSource.getRepository(Absence);
    const absence = repo.create({
      userId: firebaseUser.uid,
      type: parsed.data.type,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      reason: parsed.data.reason,
      status: 'pending',
    });

    await repo.save(absence);
    res.status(201).json({ message: 'Solicitud creada', absence });
  })
);

/**
 * POST /api/v1/absences/:id/approve
 * Approve an absence (admin action)
 */
router.post(
  '/:id/approve',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Absence);

    const absence = await repo.findOne({ where: { id } });
    if (!absence) {
      res.status(404).json({ error: 'Ausencia no encontrada' });
      return;
    }

    absence.status = 'approved';
    absence.adminComment = (req.body as any)?.comment || undefined;
    await repo.save(absence);

    res.json({ message: 'Ausencia aprobada', absence });
  })
);

/**
 * POST /api/v1/absences/:id/reject
 * Reject an absence (admin action)
 */
router.post(
  '/:id/reject',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Absence);

    const absence = await repo.findOne({ where: { id } });
    if (!absence) {
      res.status(404).json({ error: 'Ausencia no encontrada' });
      return;
    }

    absence.status = 'rejected';
    absence.adminComment = (req.body as any)?.comment || undefined;
    await repo.save(absence);

    res.json({ message: 'Ausencia rechazada', absence });
  })
);

/**
 * DELETE /api/v1/absences/:id
 * Cancel an absence (only if still pending)
 */
router.delete(
  '/:id',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Absence);

    const absence = await repo.findOne({ where: { id, userId: firebaseUser.uid } });
    if (!absence) {
      res.status(404).json({ error: 'Ausencia no encontrada' });
      return;
    }

    if (absence.status !== 'pending') {
      res.status(409).json({ error: 'Solo se pueden cancelar ausencias pendientes' });
      return;
    }

    absence.status = 'cancelled';
    await repo.save(absence);
    res.json({ message: 'Ausencia cancelada', absence });
  })
);

export default router;
