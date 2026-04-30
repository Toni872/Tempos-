import { Router, Request, Response } from "express";
import { firebaseAuthMiddleware } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { AppDataSource } from "../database.js";
import { Absence } from "../entities/Absence.js";
import { User } from "../entities/User.js";
import {
  buildValidationError,
  createAbsenceSchema,
} from "../utils/validation.js";
import {
  appUserContextMiddleware,
  getAuthContext,
  requirePermission,
} from "../middleware/request-context.middleware.js";
import { hasPermission } from "../security/authorization.js";
import { logAction } from "../utils/auditLog.js";

const router = Router();

/**
 * GET /api/v1/absences
 * List absences: own absences for employees, company-wide for privileged roles.
 */
router.get(
  "/",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);

    const canViewAll = hasPermission(auth, "view_company_absences");

    const qb = AppDataSource.getRepository(Absence)
      .createQueryBuilder("absence")
      .innerJoin(User, "user", "user.uid = absence.userId")
      .where("user.companyId = :companyId", { companyId: auth.companyId })
      .orderBy("absence.createdAt", "DESC");

    if (!canViewAll) {
      qb.andWhere("absence.userId = :uid", { uid: auth.uid });
    }

    const absences = await qb.getMany();
    res.json({ data: absences });
  }),
);

/**
 * POST /api/v1/absences
 * Create a new absence request
 */
router.post(
  "/",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const parsed = createAbsenceSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }

    const repo = AppDataSource.getRepository(Absence);
    const absence = repo.create({
      userId: auth.uid,
      type: parsed.data.type,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      reason: parsed.data.reason,
      status: "pending",
    });

    await repo.save(absence);
    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: "absence_created",
      metadata: { absenceId: absence.id, type: absence.type },
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
    });
    res.status(201).json({ message: "Solicitud creada", absence });
  }),
);

/**
 * POST /api/v1/absences/:id/approve
 * Approve an absence (requires approve_absence permission + same company)
 */
router.post(
  "/:id/approve",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    if (!requirePermission(req, res, "approve_absence")) {
      return;
    }

    const { id } = req.params;
    const repo = AppDataSource.getRepository(Absence);

    // Scoped to company via JOIN
    const absence = await repo
      .createQueryBuilder("absence")
      .innerJoin(User, "user", "user.uid = absence.userId")
      .where("absence.id = :id", { id })
      .andWhere("user.companyId = :companyId", { companyId: auth.companyId })
      .getOne();

    if (!absence) {
      res.status(404).json({ error: "Ausencia no encontrada" });
      return;
    }

    absence.status = "approved";
    absence.adminComment =
      typeof req.body?.comment === "string" ? req.body.comment : undefined;
    await repo.save(absence);

    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: "absence_approved",
      metadata: { absenceId: absence.id, ownerId: absence.userId },
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
    });

    res.json({ message: "Ausencia aprobada", absence });
  }),
);

/**
 * POST /api/v1/absences/:id/reject
 * Reject an absence (requires reject_absence permission + same company)
 */
router.post(
  "/:id/reject",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    if (!requirePermission(req, res, "reject_absence")) {
      return;
    }

    const { id } = req.params;
    const repo = AppDataSource.getRepository(Absence);

    const absence = await repo
      .createQueryBuilder("absence")
      .innerJoin(User, "user", "user.uid = absence.userId")
      .where("absence.id = :id", { id })
      .andWhere("user.companyId = :companyId", { companyId: auth.companyId })
      .getOne();

    if (!absence) {
      res.status(404).json({ error: "Ausencia no encontrada" });
      return;
    }

    absence.status = "rejected";
    absence.adminComment =
      typeof req.body?.comment === "string" ? req.body.comment : undefined;
    await repo.save(absence);

    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: "absence_rejected",
      metadata: { absenceId: absence.id, ownerId: absence.userId },
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
    });

    res.json({ message: "Ausencia rechazada", absence });
  }),
);

/**
 * DELETE /api/v1/absences/:id
 * Cancel an absence (only if still pending, own absences only within company)
 */
router.delete(
  "/:id",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Absence);

    const absence = await repo
      .createQueryBuilder("absence")
      .innerJoin(User, "user", "user.uid = absence.userId")
      .where("absence.id = :id", { id })
      .andWhere("absence.userId = :uid", { uid: auth.uid })
      .andWhere("user.companyId = :companyId", { companyId: auth.companyId })
      .getOne();

    if (!absence) {
      res.status(404).json({ error: "Ausencia no encontrada" });
      return;
    }

    if (absence.status !== "pending") {
      res
        .status(409)
        .json({ error: "Solo se pueden cancelar ausencias pendientes" });
      return;
    }

    absence.status = "cancelled";
    await repo.save(absence);
    res.json({ message: "Ausencia cancelada", absence });
  }),
);

export default router;
