import { Router, Request, Response } from "express";
import { firebaseAuthMiddleware } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  appUserContextMiddleware,
  requirePermission,
} from "../middleware/request-context.middleware.js";
import { AutoClockService } from "../services/AutoClockService.js";

const router = Router();

/**
 * POST /api/v1/system/run-autoclock
 * Disparador manual para el proceso de fichaje automático.
 * Solo roles con permiso manage_system pueden ejecutarlo.
 */
router.post(
  "/run-autoclock",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!requirePermission(req, res, "manage_system")) return;

    console.log(
      "🚀 [SYSTEM] Ejecutando sincronización manual de fichajes automáticos...",
    );

    try {
      await AutoClockService.processAllAutoClocks();
      res.json({ message: "Proceso de fichaje automático completado." });
    } catch (err) {
      console.error("❌ [SYSTEM] Error en auto-clock:", err);
      res.status(500).json({ error: "Error interno al procesar fichajes." });
    }
  }),
);

export default router;
