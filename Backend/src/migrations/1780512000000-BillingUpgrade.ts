import { MigrationInterface, QueryRunner } from "typeorm";

export class BillingUpgrade1780512000000 implements MigrationInterface {
  name = "BillingUpgrade1780512000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Plans table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "lookupKey" character varying(50) NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "priceMonthly" decimal(10,2) NOT NULL DEFAULT 0,
        "priceAnnual" decimal(10,2) NOT NULL DEFAULT 0,
        "userLimit" integer NOT NULL DEFAULT 1,
        "metadata" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_plans_lookupKey" UNIQUE ("lookupKey"),
        CONSTRAINT "PK_plans" PRIMARY KEY ("id")
      )
    `);

    // Subscriptions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" character varying(128) NOT NULL,
        "planId" uuid NOT NULL,
        "stripeSubscriptionId" character varying,
        "stripeCustomerId" character varying,
        "status" character varying(50) NOT NULL DEFAULT 'active',
        "billingCycle" character varying(20) NOT NULL DEFAULT 'monthly',
        "currentPeriodStart" TIMESTAMP,
        "currentPeriodEnd" TIMESTAMP,
        "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false,
        "cancelledAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_user" FOREIGN KEY ("userId") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_subscriptions_plan" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscriptions_userId" ON "subscriptions" ("userId") `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscriptions_stripeSubscriptionId" ON "subscriptions" ("stripeSubscriptionId") `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscriptions_stripeCustomerId" ON "subscriptions" ("stripeCustomerId") `);

    // UsageRecords table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "usage_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscriptionId" uuid NOT NULL,
        "module" character varying(50) NOT NULL,
        "action" character varying(50) NOT NULL,
        "count" integer NOT NULL DEFAULT 0,
        "limit" integer,
        "periodStart" TIMESTAMP NOT NULL,
        "periodEnd" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_usage_records" PRIMARY KEY ("id"),
        CONSTRAINT "FK_usage_records_subscription" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "UQ_usage_records_unique" UNIQUE ("subscriptionId", "module", "action", "periodStart")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_usage_records_subscriptionId_module" ON "usage_records" ("subscriptionId", "module") `);

    // SubscriptionInvoices table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscription_invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscriptionId" uuid NOT NULL,
        "stripeInvoiceId" character varying,
        "amount" decimal(10,2) NOT NULL DEFAULT 0,
        "currency" character varying(3) NOT NULL DEFAULT 'eur',
        "status" character varying(50) NOT NULL DEFAULT 'paid',
        "periodStart" TIMESTAMP,
        "periodEnd" TIMESTAMP,
        "paidAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscription_invoices_subscription" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscription_invoices_subscriptionId" ON "subscription_invoices" ("subscriptionId") `);

    // FeatureFlags table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "feature_flags" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "planId" uuid NOT NULL,
        "featureKey" character varying(100) NOT NULL,
        "isEnabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_feature_flags" PRIMARY KEY ("id"),
        CONSTRAINT "FK_feature_flags_plan" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "UQ_feature_flags_plan_feature" UNIQUE ("planId", "featureKey")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_feature_flags_planId" ON "feature_flags" ("planId") `);

    // Seed Plans
    const starterPlanId = await this.seedPlan(queryRunner, {
      lookupKey: "starter",
      name: "Starter",
      description: "Plan básico para autónomos y micro-pymes. Ideal para comenzar.",
      priceMonthly: 0,
      priceAnnual: 0,
      userLimit: 1,
      isActive: true,
    });
    const professionalPlanId = await this.seedPlan(queryRunner, {
      lookupKey: "professional",
      name: "Professional",
      description: "Plan completo para empresas en crecimiento. Sin límites.",
      priceMonthly: 19.99,
      priceAnnual: 199.9,
      userLimit: 999,
      isActive: true,
    });
    const enterprisePlanId = await this.seedPlan(queryRunner, {
      lookupKey: "enterprise",
      name: "Enterprise",
      description: "Solución personalizada para grandes organizaciones.",
      priceMonthly: 0, // custom
      priceAnnual: 0,
      userLimit: 9999,
      isActive: true,
      metadata: { custom: true },
    });

    // Seed Feature Flags
    const starterFlags = [
      { featureKey: "canUseGeofencing", isEnabled: false },
      { featureKey: "canUseQRClock", isEnabled: false },
      { featureKey: "canExportPDF", isEnabled: false },
      { featureKey: "canUseInvoicing", isEnabled: false },
      { featureKey: "canManageLeaves", isEnabled: false },
      { featureKey: "canUseAPI", isEnabled: false },
      { featureKey: "canUseWebhooks", isEnabled: false },
    ];
    const professionalFlags = [
      { featureKey: "canUseGeofencing", isEnabled: true },
      { featureKey: "canUseQRClock", isEnabled: true },
      { featureKey: "canExportPDF", isEnabled: true },
      { featureKey: "canUseInvoicing", isEnabled: true },
      { featureKey: "canManageLeaves", isEnabled: true },
      { featureKey: "canUseAPI", isEnabled: true },
      { featureKey: "canUseWebhooks", isEnabled: true },
    ];
    const enterpriseFlags = [
      { featureKey: "canUseGeofencing", isEnabled: true },
      { featureKey: "canUseQRClock", isEnabled: true },
      { featureKey: "canExportPDF", isEnabled: true },
      { featureKey: "canUseInvoicing", isEnabled: true },
      { featureKey: "canManageLeaves", isEnabled: true },
      { featureKey: "canUseAPI", isEnabled: true },
      { featureKey: "canUseWebhooks", isEnabled: true },
    ];

    for (const flag of starterFlags) {
      await queryRunner.query(
        `INSERT INTO "feature_flags" ("planId", "featureKey", "isEnabled") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [starterPlanId, flag.featureKey, flag.isEnabled],
      );
    }
    for (const flag of professionalFlags) {
      await queryRunner.query(
        `INSERT INTO "feature_flags" ("planId", "featureKey", "isEnabled") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [professionalPlanId, flag.featureKey, flag.isEnabled],
      );
    }
    for (const flag of enterpriseFlags) {
      await queryRunner.query(
        `INSERT INTO "feature_flags" ("planId", "featureKey", "isEnabled") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [enterprisePlanId, flag.featureKey, flag.isEnabled],
      );
    }
  }

  private async seedPlan(
    queryRunner: QueryRunner,
    plan: {
      lookupKey: string;
      name: string;
      description?: string;
      priceMonthly: number;
      priceAnnual: number;
      userLimit: number;
      isActive: boolean;
      metadata?: Record<string, any>;
    },
  ): Promise<string> {
    const id = await queryRunner.query(
      `INSERT INTO "plans" ("lookupKey", "name", "description", "priceMonthly", "priceAnnual", "userLimit", "isActive", "metadata")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT ("lookupKey") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "priceMonthly" = EXCLUDED."priceMonthly", "priceAnnual" = EXCLUDED."priceAnnual", "userLimit" = EXCLUDED."userLimit", "isActive" = EXCLUDED."isActive", "metadata" = EXCLUDED."metadata"
       RETURNING "id"`,
      [
        plan.lookupKey,
        plan.name,
        plan.description ?? null,
        plan.priceMonthly,
        plan.priceAnnual,
        plan.userLimit,
        plan.isActive,
        plan.metadata ? JSON.stringify(plan.metadata) : null,
      ],
    );
    return id[0]?.id ?? "";
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "feature_flags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_invoices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usage_records"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_stripeSubscriptionId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_stripeCustomerId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plans"`);
  }
}