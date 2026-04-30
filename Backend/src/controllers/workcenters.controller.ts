import { Router, Request, Response } from "express";
import { z } from "zod";
import { AppDataSource } from "../database.js";
import { WorkCenter } from "../entities/WorkCenter.js";
import { firebaseAuthMiddleware } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  appUserContextMiddleware,
  getAuthContext,
  requirePermission,
} from "../middleware/request-context.middleware.js";

const router = Router();

const createWorkCenterSchema = z.object({
  name: z.string().trim().min(2).max(255),
  address: z.string().trim().max(255).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radiusMeters: z.number().min(10).max(5000).default(100),
});

const updateWorkCenterSchema = createWorkCenterSchema.partial();

/**
 * GET /api/v1/work-centers
 */
router.get(
  "/",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!requirePermission(req, res, "view_work_centers")) return;

    const auth = getAuthContext(req);
    const repo = AppDataSource.getRepository(WorkCenter);

    const centers = await repo.find({
      where: { companyId: auth.companyId, status: "active" },
      order: { name: "ASC" },
    });

    res.json({ data: centers });
  }),
);

/**
 * POST /api/v1/work-centers
 */
router.post(
  "/",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!requirePermission(req, res, "manage_settings")) return;

    const auth = getAuthContext(req);
    const parsed = createWorkCenterSchema.safeParse(req.body);

    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Parámetros inválidos", details: parsed.error.issues });
      return;
    }

    const repo = AppDataSource.getRepository(WorkCenter);
    const center = repo.create({
      ...parsed.data,
      companyId: auth.companyId,
      status: "active",
    });

    await repo.save(center);
    res.status(201).json({ data: center });
  }),
);

/**
 * PUT /api/v1/work-centers/:id
 */
router.put(
  "/:id",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!requirePermission(req, res, "manage_settings")) return;

    const auth = getAuthContext(req);
    const { id } = req.params;
    const repo = AppDataSource.getRepository(WorkCenter);

    const center = await repo.findOne({
      where: { id, companyId: auth.companyId },
    });
    if (!center) {
      res.status(404).json({ error: "Centro de trabajo no encontrado" });
      return;
    }

    const parsed = updateWorkCenterSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Parámetros inválidos", details: parsed.error.issues });
      return;
    }

    Object.assign(center, parsed.data);
    await repo.save(center);

    res.json({ data: center });
  }),
);

/**
 * DELETE /api/v1/work-centers/:id
 */
router.delete(
  "/:id",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!requirePermission(req, res, "manage_settings")) return;

    const auth = getAuthContext(req);
    const { id } = req.params;
    const repo = AppDataSource.getRepository(WorkCenter);

    const center = await repo.findOne({
      where: { id, companyId: auth.companyId },
    });
    if (!center) {
      res.status(404).json({ error: "Centro de trabajo no encontrado" });
      return;
    }

    center.status = "inactive";
    await repo.save(center);

    res.json({ message: "Centro de trabajo desactivado" });
  }),
);

export default router;
