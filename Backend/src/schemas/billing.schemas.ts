import { z } from "zod";

// Feature flag object
export const PlanFeatureSchema = z.object({
  featureKey: z.string(),
  isEnabled: z.boolean(),
});

// Plan response
export const PlanSchema = z.object({
  id: z.string(),
  lookupKey: z.string(),
  name: z.string(),
  description: z.string().optional(),
  priceMonthly: z.number(),
  priceAnnual: z.number(),
  userLimit: z.number(),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean(),
  features: z.record(z.string(), z.boolean()),
});

export type PlanResponse = z.infer<typeof PlanSchema>;
export type PlanFeature = z.infer<typeof PlanFeatureSchema>;

// Subscription status response
export const UsageDetailSchema = z.object({
  used: z.number(),
  limit: z.number().nullable(),
  action: z.string(),
});

export const SubscriptionStatusResponseSchema = z.object({
  subscriptionId: z.string().optional(),
  planId: z.string().optional(),
  planName: z.string().optional(),
  planLookupKey: z.string().optional(),
  status: z.string().optional(),
  billingCycle: z.string().optional(),
  currentPeriodStart: z.date().optional(),
  currentPeriodEnd: z.date().optional(),
  cancelAtPeriodEnd: z.boolean(),
  features: z.record(z.string(), z.boolean()),
  usage: z.record(z.string(), UsageDetailSchema),
  isTrialLike: z.boolean(),
});

export type SubscriptionStatusResponse = z.infer<
  typeof SubscriptionStatusResponseSchema
>;
export type UsageDetail = z.infer<typeof UsageDetailSchema>;

// Cancel subscription request
export const CancelSubscriptionSchema = z.object({
  immediate: z.boolean().optional().default(false),
});

export type CancelSubscriptionRequest = z.infer<
  typeof CancelSubscriptionSchema
>;

// Checkout session create request
export const CreateCheckoutSessionSchema = z.object({
  lookup_key: z.string().min(1, "lookup_key es requerido"),
  billingCycle: z.enum(["monthly", "annual"]).optional().default("monthly"),
});

export type CreateCheckoutSessionRequest = z.infer<
  typeof CreateCheckoutSessionSchema
>;