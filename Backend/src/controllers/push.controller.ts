import { Router, Request, Response } from "express";
import webpush from "web-push";
import { AppDataSource } from "../database.js";
import { PushSubscription } from "../entities/PushSubscription.js";
import { firebaseAuthMiddleware } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@tempos.es",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

/**
 * POST /api/v1/push/subscribe
 * Guarda una suscripción de push para el usuario actual
 */
router.post(
  "/subscribe",
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).firebaseUser.uid;
    const subscription = req.body;

    if (!subscription || !subscription.endpoint) {
      res.status(400).json({ error: "Suscripción inválida" });
      return;
    }

    const pushRepo = AppDataSource.getRepository(PushSubscription);

    // Evitar duplicados para el mismo endpoint
    let pushSub = await pushRepo.findOneBy({ endpoint: subscription.endpoint });

    if (!pushSub) {
      pushSub = pushRepo.create({
        userId,
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime,
        keys: subscription.keys,
      });
    } else {
      pushSub.userId = userId;
      pushSub.keys = subscription.keys;
    }

    await pushRepo.save(pushSub);

    res.status(201).json({ message: "Suscrito a notificaciones push" });
  }),
);

/**
 * POST /api/v1/push/unsubscribe
 * Elimina una suscripción
 */
router.post(
  "/unsubscribe",
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { endpoint } = req.body;
    if (!endpoint) {
      res.status(400).json({ error: "Endpoint requerido" });
      return;
    }

    const pushRepo = AppDataSource.getRepository(PushSubscription);
    await pushRepo.delete({ endpoint });

    res.json({ message: "Suscripción eliminada" });
  }),
);

/**
 * POST /api/v1/push/send-test
 * Envía una notificación de prueba (solo para admin/dev)
 */
router.post(
  "/send-test",
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).firebaseUser.uid;
    const pushRepo = AppDataSource.getRepository(PushSubscription);
    const subscriptions = await pushRepo.findBy({ userId });

    if (subscriptions.length === 0) {
      res
        .status(404)
        .json({ error: "No se encontraron suscripciones para este usuario." });
      return;
    }

    const payload = JSON.stringify({
      title: "Tempos HR",
      body: "¡Notificación de prueba funcionando!",
      icon: "/icon-192x192.png",
      data: { url: "/dashboard" },
    });

    const results = await Promise.all(
      subscriptions.map((sub) =>
        webpush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload,
          )
          .catch((err) => {
            console.error("Error enviando push:", err);
            if (err.statusCode === 410) {
              // Suscripción expirada
              return pushRepo.delete(sub.id);
            }
            return null;
          }),
      ),
    );

    res.json({ message: "Notificaciones enviadas", count: results.length });
  }),
);

export default router;
