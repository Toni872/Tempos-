import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";
import { Plan } from "../entities/Plan.js";
import { Subscription as LocalSubscription } from "../entities/Subscription.js";
import { FeatureFlag } from "../entities/FeatureFlag.js";
import { UsageRecord } from "../entities/UsageRecord.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { firebaseAuthMiddleware } from "../middleware/auth.middleware.js";
import {
  appUserContextMiddleware,
  getAuthContext,
} from "../middleware/request-context.middleware.js";
import {
  getSubscriptionContext,
  createSubscriptionFromCheckout,
  createSubscriptionInvoiceFromStripe,
  getTrialPlan,
} from "../services/usage.service.js";
import {
  CancelSubscriptionSchema,
} from "../schemas/billing.schemas.js";

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

              let subscriptionPlan = "starter";
              let billingCycle: "monthly" | "annual" = "monthly";

              if (stripeSubscriptionId) {
                const subscription = await stripe.subscriptions.retrieve(
                  stripeSubscriptionId,
                );
                user.subscriptionStatus = subscription.status;

                const priceId = subscription.items.data[0]?.price?.id;
                if (priceId) {
                  const price = await stripe.prices.retrieve(priceId);
                  subscriptionPlan = price.lookup_key || "starter";
                  billingCycle = subscription.items.data[0]?.price?.recurring?.interval === "year" ? "annual" : "monthly";
                }
              }

              user.subscriptionPlan = subscriptionPlan;
              await userRepo.save(user);

              // Crear Subscription record en la nueva tabla
              await createSubscriptionFromCheckout(
                userId,
                stripeSubscriptionId,
                stripeCustomerId,
                subscriptionPlan,
                billingCycle,
              );

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

            let subscriptionPlan = "starter";
            if (subscription.items.data[0]?.price?.id) {
              const priceId = subscription.items.data[0].price.id;
              const price = await stripe.prices.retrieve(priceId);
              subscriptionPlan = price.lookup_key || "starter";
              user.subscriptionPlan = subscriptionPlan;
            }

            await userRepo.save(user);

            // Actualizar Subscription record si existe
            const subRepo = AppDataSource.getRepository(LocalSubscription);
            const existingSub = await subRepo.findOne({
              where: { stripeSubscriptionId: subscription.id },
            });
            if (existingSub) {
              existingSub.status = subscription.status as LocalSubscription["status"];
              const periodStart = (subscription as any).current_period_start;
              const periodEnd = (subscription as any).current_period_end;
              if (periodStart) existingSub.currentPeriodStart = new Date(periodStart * 1000);
              if (periodEnd) existingSub.currentPeriodEnd = new Date(periodEnd * 1000);
              await subRepo.save(existingSub);
            }

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
            user.trialExpiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000);

            await userRepo.save(user);

            // Marcar Subscription local como cancelada
            const subRepo = AppDataSource.getRepository(LocalSubscription);
            const localSub = await subRepo.findOne({
              where: { stripeSubscriptionId: subscription.id },
            });
            if (localSub) {
              localSub.status = "canceled";
              localSub.cancelledAt = new Date();
              await subRepo.save(localSub);
            }

            console.log(
              `❌ [WEBHOOK] Suscripción cancelada para ${user.email}. Retornado a trial expirado.`,
            );
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = dataObject as Stripe.Invoice;
          const stripeCustomerId = invoice.customer as string;

          const subRepo = AppDataSource.getRepository(LocalSubscription);
          const localSub = await subRepo.findOne({
            where: { stripeCustomerId },
          });
          if (localSub) {
            localSub.status = "past_due";
            await subRepo.save(localSub);

            // Crear UsageRecord de fallo de pago
            const usageRepo = AppDataSource.getRepository(UsageRecord);
            const now = new Date();
            const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            await usageRepo.save(
              usageRepo.create({
                subscriptionId: localSub.id,
                module: "billing",
                action: "payment_failed",
                count: 1,
                periodStart,
                periodEnd,
              }),
            );
            console.log(
              `⚠️ [WEBHOOK] Pago fallido para customer ${stripeCustomerId}. Subtracted: past_due`,
            );
          }
          break;
        }

        case "invoice.paid": {
          const invoice = dataObject as Stripe.Invoice;
          const stripeCustomerId = invoice.customer as string;
          const stripeInvoiceId = invoice.id;
          const amount = (invoice.amount_paid || 0) / 100;
          const currency = invoice.currency?.toUpperCase() || "EUR";

          const subRepo = AppDataSource.getRepository(LocalSubscription);
          const localSub = await subRepo.findOne({
            where: { stripeCustomerId },
          });
          if (localSub) {
            localSub.status = "active";
            await subRepo.save(localSub);

            // Crear SubscriptionInvoice
            await createSubscriptionInvoiceFromStripe(
              localSub.id,
              stripeInvoiceId,
              amount,
              currency,
              invoice.period_start ? new Date(invoice.period_start * 1000) : new Date(),
              invoice.period_end ? new Date(invoice.period_end * 1000) : new Date(),
            );
            console.log(
              `✅ [WEBHOOK] Pago recibido de customer ${stripeCustomerId}. Suscripción activa.`,
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

/**
 * GET /api/v1/billing/plans
 * Devuelve todos los planes activos con sus feature flags.
 * No requiere autenticación.
 */
router.get(
  "/plans",
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const planRepo = AppDataSource.getRepository(Plan);
    const flagRepo = AppDataSource.getRepository(FeatureFlag);

    const plans = await planRepo.find({ where: { isActive: true } });
    const plansWithFeatures = await Promise.all(
      plans.map(async (plan) => {
        const flags = await flagRepo.find({ where: { planId: plan.id } });
        const features: Record<string, boolean> = {};
        for (const flag of flags) {
          features[flag.featureKey] = flag.isEnabled;
        }
        return {
          id: plan.id,
          lookupKey: plan.lookupKey,
          name: plan.name,
          description: plan.description,
          priceMonthly: Number(plan.priceMonthly),
          priceAnnual: Number(plan.priceAnnual),
          userLimit: plan.userLimit,
          metadata: plan.metadata,
          isActive: plan.isActive,
          features,
        };
      }),
    );

    res.status(200).json(plansWithFeatures);
  }),
);

/**
 * GET /api/v1/billing/subscription/status
 * Devuelve el estado de suscripción del usuario autenticado:
 * plan, features activas, uso del período actual.
 */
router.get(
  "/subscription/status",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const subCtx = await getSubscriptionContext(auth.uid);

    if (!subCtx) {
      // Sin suscripción activa — devolver estado trial por defecto
      const trialPlan = await getTrialPlan();
      res.status(200).json({
        subscriptionId: null,
        planId: null,
        planName: trialPlan?.name ?? "Starter",
        planLookupKey: trialPlan?.lookupKey ?? "starter",
        status: "trial",
        billingCycle: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        features: {},
        usage: {},
        isTrialLike: true,
      });
      return;
    }

    const { subscription, plan, features, usage } = subCtx;

    res.status(200).json({
      subscriptionId: subscription?.id ?? null,
      planId: plan?.id ?? null,
      planName: plan?.name ?? null,
      planLookupKey: plan?.lookupKey ?? null,
      status: subscription?.status ?? subCtx.isTrialLike ? "trial" : null,
      billingCycle: subscription?.billingCycle ?? null,
      currentPeriodStart: subscription?.currentPeriodStart ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      features,
      usage,
      isTrialLike: subCtx.isTrialLike,
    });
  }),
);

/**
 * POST /api/v1/billing/cancel-subscription
 * Cancela la suscripción actual.
 * Si immediate=false (default), cancela al final del período de facturación.
 * Si immediate=true, cancela inmediatamente.
 */
router.post(
  "/cancel-subscription",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);

    const parseResult = CancelSubscriptionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "_body_invalido", details: parseResult.error.issues });
      return;
    }
    const { immediate } = parseResult.data;

    const subCtx = await getSubscriptionContext(auth.uid);
    if (!subCtx?.subscription?.stripeSubscriptionId) {
      res.status(400).json({ error: "No tienes una suscripción activa para cancelar." });
      return;
    }

    const { subscription } = subCtx;
    const stripeSubId = subscription!.stripeSubscriptionId!;

    try {
      if (immediate) {
        await stripe.subscriptions.cancel(stripeSubId);
      } else {
        await stripe.subscriptions.update(stripeSubId, {
          cancel_at_period_end: true,
        });
      }

      // Actualizar estado local
      const subRepo = AppDataSource.getRepository(LocalSubscription);
      subscription.cancelAtPeriodEnd = !immediate;
      if (immediate) {
        subscription.status = "canceled";
        subscription.cancelledAt = new Date();
      }
      await subRepo.save(subscription);

      res.status(200).json({
        success: true,
        immediate,
        message: immediate
          ? "Suscripción cancelada inmediatamente."
          : "Suscripción cancelada al final del período de facturación.",
        cancelAtPeriodEnd: !immediate,
      });
    } catch (err: any) {
      console.error("❌ Error cancelando suscripción:", err);
      res.status(500).json({ error: err.message || "Error al cancelar la suscripción." });
    }
  }),
);

export default router;
