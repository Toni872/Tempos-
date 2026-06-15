import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

export type InvoiceStatus = "paid" | "open" | "void" | "uncollectible";

@Entity("subscription_invoices")
@Index(["subscriptionId"])
export class SubscriptionInvoice {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  subscriptionId!: string;

  @Column({ type: "varchar", nullable: true })
  stripeInvoiceId?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  amount!: number;

  @Column({ type: "varchar", length: 3, default: "eur" })
  currency!: string;

  @Column({ type: "varchar", length: 50, default: "paid" })
  status!: InvoiceStatus;

  @Column({ type: "timestamp", nullable: true })
  periodStart?: Date;

  @Column({ type: "timestamp", nullable: true })
  periodEnd?: Date;

  @Column({ type: "timestamp", nullable: true })
  paidAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne("Subscription", "invoices")
  @JoinColumn({ name: "subscriptionId" })
  subscription!: any;
}