import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";

@Entity("usage_records")
@Index(["subscriptionId", "module"])
@Unique(["subscriptionId", "module", "action", "periodStart"])
export class UsageRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  subscriptionId!: string;

  @Column({ type: "varchar", length: 50 })
  module!: string; // "fichas", "documents", "reports", "billing"

  @Column({ type: "varchar", length: 50 })
  action!: string; // "create", "read", "export", "payment_failed"

  @Column({ type: "int", default: 0 })
  count!: number;

  @Column({ type: "int", nullable: true })
  limit?: number; // null = unlimited

  @Column({ type: "timestamp" })
  periodStart!: Date;

  @Column({ type: "timestamp" })
  periodEnd!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne("Subscription", "usageRecords")
  @JoinColumn({ name: "subscriptionId" })
  subscription!: any;
}