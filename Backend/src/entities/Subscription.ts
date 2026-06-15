import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Plan } from "./Plan.js";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export type BillingCycle = "monthly" | "annual";

@Entity("subscriptions")
@Index(["userId"])
@Index(["stripeSubscriptionId"])
@Index(["stripeCustomerId"])
export class Subscription {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 128 })
  userId!: string;

  @Column({ type: "uuid" })
  planId!: string;

  @Column({ type: "varchar", nullable: true })
  stripeSubscriptionId?: string;

  @Column({ type: "varchar", nullable: true })
  stripeCustomerId?: string;

  @Column({ type: "varchar", length: 50, default: "active" })
  status!: SubscriptionStatus;

  @Column({ type: "varchar", length: 20, default: "monthly" })
  billingCycle!: BillingCycle;

  @Column({ type: "timestamp", nullable: true })
  currentPeriodStart?: Date;

  @Column({ type: "timestamp", nullable: true })
  currentPeriodEnd?: Date;

  @Column({ type: "boolean", default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ type: "timestamp", nullable: true })
  cancelledAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne("User", "subscriptions")
  @JoinColumn({ name: "userId" })
  user!: any;

  @ManyToOne("Plan", "subscriptions")
  @JoinColumn({ name: "planId" })
  plan!: Plan;
}