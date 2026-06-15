import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Plan } from "./Plan.js";

@Entity("feature_flags")
@Unique(["planId", "featureKey"])
export class FeatureFlag {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  planId!: string;

  @Column({ type: "varchar", length: 100 })
  featureKey!: string; // "canUseGeofencing", "canExportPDF", "canUseInvoicing", etc.

  @Column({ type: "boolean", default: true })
  isEnabled!: boolean;

  @ManyToOne("Plan", "featureFlags")
  @JoinColumn({ name: "planId" })
  plan!: Plan;
}