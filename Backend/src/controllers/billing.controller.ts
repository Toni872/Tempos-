import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { firebaseAuthMiddleware } from "../middleware/auth.middleware.js";
import {
  appUserContextMiddleware,
  getAuthContext,
} from "../middleware/request-context.middleware.js";

const router = Router();

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error(
    "\n❌ STRIPE_SECRET_KEY no está configurada en las variables de entorno.\n" +
    "   Configúrala en Railway como variable de entorno o en un archivo .env\n",
  );
  throw new Error("STRIPE_SECRET_KEY no está configurada");
}

const stripe = new Stripe(stripeKey, {
  apiVersion: "2023-10-16" as any,
});


/**
 * POST /api/v1/billing/create-checkout-session
 * Crea una sesión de Checkout para la suscripción de un plan.
 */
router.post(
  "/create-checkout-session",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { lookup_key } = req.body ?? {};

    if (!lookup_key || typeof lookup_key !== "string") {
      res.status(400).json({ error: "Se requiere un lookup_key de plan válido." });
      return;
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { uid: auth.uid } });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }

    try {
      // 1. Buscar precio del plan en Stripe usando el lookup_key
      const prices = await stripe.prices.list({
        lookup_keys: [lookup_key],
        expand: ["data.product"],
      });

      if (!prices.data || prices.data.length === 0) {
        res.status(400).json({
          error: `No se encontró el plan '${lookup_key}' en Stripe.`,
        });
        return;
      }

      const priceId = prices.data[0].id;
      const script9Url = process.env.SCRIPT9_URL || "https://www.script-9.com";

      // 2. Parámetros de la sesión de Checkout
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        automatic_tax: { enabled: true },
        success_url: `${script9Url}/pago-exitoso?payment_intent={CHECKOUT_SESSION_ID}&app=tempos`,
        cancel_url: `${script9Url}/dashboard`,
        metadata: {
          userId: user.uid,
          appName: "Tempos",
        },
      };

      // Si el usuario ya tiene un CustomerId registrado, lo asociamos directamente
      if (user.stripeCustomerId) {
        sessionParams.customer = user.stripeCustomerId;
      } else {
        // Si no, pre-populamos su email
        sessionParams.customer_email = user.email;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      res.status(200).json({ id: session.id, url: session.url });
    } catch (err: any) {
      console.error("❌ Error creando sesión de Checkout:", err);
      res.status(500).json({ error: err.message || "Error al procesar el pago." });
    }
  }),
);

/**
 * POST /api/v1/billing/create-portal-session
 * Crea una sesión para redirigir al usuario al Portal de Gestión de Facturación de Stripe.
 */
router.post(
  "/create-portal-session",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { uid: auth.uid } });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }

    if (!user.stripeCustomerId) {
      res.status(400).json({
        error:
          "No tienes un ID de cliente de Stripe asociado. Suscríbete a un plan primero.",
      });
      return;
    }

    try {
      const script9Url = process.env.SCRIPT9_URL || "https://www.script-9.com";
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${script9Url}/dashboard`,
      });

      res.status(200).json({ url: session.url });
    } catch (err: any) {
      console.error("❌ Error creando sesión de portal:", err);
      res.status(500).json({
        error: err.message || "Error al abrir el portal de facturación.",
      });
    }
  }),
);

/**
 * POST /api/v1/billing/webhook
 * Webhook público para procesar notificaciones asíncronas de Stripe.
 */
router.post(
  "/webhook",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      if (webhookSecret && sig) {
        // Nota: requiere que Express mantenga el buffer raw en req.rawBody
        event = stripe.webhooks.constructEvent(
          (req as any).rawBody || req.body,
          sig,
          webhookSecret,
        );
      } else {
        // En desarrollo local sin secreto webhook configurado
        console.warn("⚠️ Recibiendo webhook de Stripe sin verificación de firma.");
        event = req.body as Stripe.Event;
      }
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    const dataObject = event.data.object as any;
    const userRepo = AppDataSource.getRepository(User);

    console.log(`[STRIPE WEBHOOK] Recibido evento: ${event.type}`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = dataObject as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const stripeCustomerId = session.customer as string;
          const stripeSubscriptionId = session.subscription as string;

          if (userId) {
            const user = await userRepo.findOne({ where: { uid: userId } });
            if (user) {
              user.stripeCustomerId = stripeCustomerId;
              user.stripeSubscriptionId = stripeSubscriptionId;
              user.isTrial = false;

              if (stripeSubscriptionId) {
                const subscription = await stripe.subscriptions.retrieve(
                  stripeSubscriptionId,
                );
                user.subscriptionStatus = subscription.status;

                const priceId = subscription.items.data[0]?.price?.id;
                if (priceId) {
                  const price = await stripe.prices.retrieve(priceId);
                  user.subscriptionPlan = price.lookup_key || "starter";
                }
              }

              await userRepo.save(user);
              console.log(
                `✅ [WEBHOOK] Suscripción iniciada con éxito para ${user.email} (Plan: ${user.subscriptionPlan})`,
              );
            }
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = dataObject as Stripe.Subscription;
          const stripeCustomerId = subscription.customer as string;

          const user = await userRepo.findOne({ where: { stripeCustomerId } });
          if (user) {
            user.stripeSubscriptionId = subscription.id;
            user.subscriptionStatus = subscription.status;
            user.isTrial = false;

            const priceId = subscription.items.data[0]?.price?.id;
            if (priceId) {
              const price = await stripe.prices.retrieve(priceId);
              user.subscriptionPlan = price.lookup_key || "starter";
            }

            await userRepo.save(user);
            console.log(
              `🔄 [WEBHOOK] Suscripción actualizada para ${user.email} (Plan: ${user.subscriptionPlan}, Status: ${user.subscriptionStatus})`,
            );
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = dataObject as Stripe.Subscription;
          const stripeCustomerId = subscription.customer as string;

          const user = await userRepo.findOne({ where: { stripeCustomerId } });
          if (user) {
            user.stripeSubscriptionId = undefined;
            user.subscriptionStatus = "canceled";
            user.subscriptionPlan = "trial";
            user.isTrial = true;
            // Configurar periodo de prueba expirado para forzar re-suscripción
            user.trialExpiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000);

            await userRepo.save(user);
            console.log(
              `❌ [WEBHOOK] Suscripción cancelada para ${user.email}. Retornado a trial expirado.`,
            );
          }
          break;
        }

        default:
          console.log(`ℹ️ [WEBHOOK] Evento omitido: ${event.type}`);
      }
    } catch (err: any) {
      console.error(`❌ Error procesando Stripe Webhook (${event.type}):`, err);
    }

    res.status(200).json({ received: true });
  }),
);

export default router;
