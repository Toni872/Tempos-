import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";

@Entity("plans")
export class Plan {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50, unique: true })
  lookupKey!: string; // "starter", "professional", "enterprise"

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  priceMonthly!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  priceAnnual!: number;

  @Column({ type: "int", default: 1 })
  userLimit!: number; // max users allowed for this plan

  @Column({ type: "json", nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany("Subscription", "plan")
  subscriptions!: any[];

  @OneToMany("FeatureFlag", "plan")
  featureFlags!: any[];
}