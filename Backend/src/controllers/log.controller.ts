import { Request, Response, Router } from "express";
import { NotificationService } from "../services/NotificationService.js";

const router = Router();

/**
 * Endpoint para recibir errores del Frontend y notificarlos.
 */
router.post("/error", async (req: Request, res: Response) => {
  const errorData = req.body;

  // 1. Loguear en el servidor (para los logs de Docker/Pm2)
  console.error("🛑 [FRONTEND_ERROR_REPORTED]:", errorData);

  // 2. Notificar a Slack (Capa de estabilidad Senior)
  try {
    await NotificationService.sendErrorToSlack(errorData);
  } catch (err) {
    console.error("❌ Error al procesar reporte de Slack:", err);
  }

  res.status(200).json({ status: "received" });
});

export default router;
