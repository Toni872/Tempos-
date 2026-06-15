import { AppDataSource } from "../database.js";
import { Plan } from "../entities/Plan.js";
import { Subscription } from "../entities/Subscription.js";
import { FeatureFlag } from "../entities/FeatureFlag.js";
import { UsageRecord } from "../entities/UsageRecord.js";
import { SubscriptionInvoice } from "../entities/SubscriptionInvoice.js";
import { Request, Response } from "express";

export interface SubscriptionContext {
  subscription: Subscription | null;
  plan: Plan | null;
  features: Record<string, boolean>;
  usage: Record<
    string,
    { used: number; limit: number | null; action: string }
  >;
  isTrialLike: boolean;
}

/**
 * Get the full subscription context for a user:
 * subscription + plan + feature flags + current usage summary.
 * Returns null if no active subscription found.
 */
export async function getSubscriptionContext(
  userId: string,
): Promise<SubscriptionContext | null> {
  const subRepo = AppDataSource.getRepository(Subscription);
  const flagRepo = AppDataSource.getRepository(FeatureFlag);
  const usageRepo = AppDataSource.getRepository(UsageRecord);

  const subscription = await subRepo.findOne({
    where: { userId },
    order: { createdAt: "DESC" },
    relations: ["plan"],
  });

  if (!subscription) return null;

  const plan = subscription.plan;
  const featureFlags = await flagRepo.find({ where: { planId: plan.id } });

  const features: Record<string, boolean> = {};
  for (const flag of featureFlags) {
    features[flag.featureKey] = flag.isEnabled;
  }

  // Get current period usage
  const periodStart = subscription.currentPeriodStart ?? new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const periodEnd = subscription.currentPeriodEnd ?? new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  );

  const usageRecords = await usageRepo
    .createQueryBuilder("ur")
    .where("ur.subscriptionId = :subscriptionId", {
      subscriptionId: subscription.id,
    })
    .andWhere("ur.periodStart >= :periodStart", { periodStart })
    .andWhere("ur.periodEnd <= :periodEnd", { periodEnd })
    .getMany();

  const usage: SubscriptionContext["usage"] = {};
  for (const record of usageRecords) {
    if (!usage[record.module]) {
      usage[record.module] = { used: 0, limit: record.limit ?? null, action: record.action };
    }
    usage[record.module].used += record.count;
  }

  // Trial-like: no active paid subscription
  const isTrialLike =
    !subscription ||
    !["active", "trialing"].includes(subscription.status);

  return { subscription, plan, features, usage, isTrialLike };
}

/**
 * Check if the user's subscription plan has the given feature.
 * Throws a 402 error with error body if not allowed.
 */
export function requireFeature(
  req: Request,
  res: Response,
  featureKey: string,
): void {
  const features = (req as any).auth?.features;
  if (!features) {
    res.status(500).json({ error: "Auth context not loaded" });
    return;
  }
  if (features[featureKey] !== true) {
    res.status(402).json({
      error: "feature_not_allowed",
      required: featureKey,
    });
    return;
  }
}

/**
 * Check if the user's subscription allows the given module+action.
 * Throws a 402 error with error body if limit exceeded.
 */
export async function checkLimit(
  req: Request,
  res: Response,
  module: string,
  action: string,
): Promise<void> {
  const subCtx = (req as any).auth?.subscriptionContext;
  if (!subCtx) {
    // No subscription context means trial/trial-like — use default limits
    // For now, allow through
    return;
  }

  const { usage, plan } = subCtx;

  // Get the limit for this module from the plan metadata if exists
  const planLimits = (plan?.metadata as Record<string, unknown> | undefined)?.limits as Record<string, Record<string, number | null>> | undefined;
  if (planLimits && planLimits[module]) {
    const moduleLimits = planLimits[module];
    const limit = moduleLimits?.[action] ?? null;
    if (limit !== null) {
      const current = usage[module]?.used ?? 0;
      if (current >= limit) {
        res.status(402).json({
          error: "limit_exceeded",
          module,
          action,
          limit,
        });
        return;
      }
    }
  }
}

/**
 * Increment usage count for a module+action within the current period.
 * Creates the UsageRecord if it doesn't exist, updates count if it does.
 */
export async function incrementUsage(
  subscriptionId: string,
  module: string,
  action: string,
): Promise<void> {
  const usageRepo = AppDataSource.getRepository(UsageRecord);
  const subRepo = AppDataSource.getRepository(Subscription);

  const subscription = await subRepo.findOne({
    where: { id: subscriptionId },
    relations: ["plan"],
  });
  if (!subscription) return;

  const plan = subscription.plan;

  // Determine period from subscription dates
  const periodStart =
    subscription.currentPeriodStart ??
    new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const periodEnd =
    subscription.currentPeriodEnd ??
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  // Get plan limits for this module
  const planLimits = (plan?.metadata as Record<string, Record<string, number | null>> | undefined)?.limits;
  const limit = (planLimits?.[module] as Record<string, number | null> | undefined)?.[action] ?? null;

  // Try to find existing record
  let record = await usageRepo.findOne({
    where: { subscriptionId, module, action, periodStart },
  });

  if (record) {
    record.count += 1;
    await usageRepo.save(record);
  } else {
    await usageRepo.save(
      usageRepo.create({
        subscriptionId,
        module,
        action,
        count: 1,
        limit: limit ?? undefined,
        periodStart,
        periodEnd,
      }),
    );
  }
}

/**
 * Get the default trial plan for new users.
 */
export async function getTrialPlan(): Promise<Plan | null> {
  const planRepo = AppDataSource.getRepository(Plan);
  return planRepo.findOne({ where: { lookupKey: "starter" } });
}

/**
 * Create a subscription record after checkout.session.completed.
 */
export async function createSubscriptionFromCheckout(
  userId: string,
  stripeSubscriptionId: string,
  stripeCustomerId: string,
  planLookupKey: string,
  billingCycle: "monthly" | "annual" = "monthly",
): Promise<Subscription | null> {
  const subRepo = AppDataSource.getRepository(Subscription);
  const planRepo = AppDataSource.getRepository(Plan);

  const plan = await planRepo.findOne({ where: { lookupKey: planLookupKey } });
  if (!plan) return null;

  const now = new Date();
  const periodEnd = new Date(now);
  if (billingCycle === "monthly") {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  const subscription = subRepo.create({
    userId,
    planId: plan.id,
    stripeSubscriptionId,
    stripeCustomerId,
    status: "active",
    billingCycle,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
  });

  return subRepo.save(subscription);
}

/**
 * Create a subscription invoice record after invoice.paid.
 */
export async function createSubscriptionInvoiceFromStripe(
  subscriptionId: string,
  stripeInvoiceId: string,
  amount: number,
  currency: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<SubscriptionInvoice> {
  const invRepo = AppDataSource.getRepository(SubscriptionInvoice);
  const invoice = invRepo.create({
    subscriptionId,
    stripeInvoiceId,
    amount,
    currency,
    status: "paid",
    periodStart,
    periodEnd,
    paidAt: new Date(),
  });
  return invRepo.save(invoice);
}