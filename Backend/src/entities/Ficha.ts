import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User.js";

type FichaCorrectionChanges = {
  startTime?: string;
  endTime?: string;
  description?: string;
  projectCode?: string;
};

type FichaCorrectionRequest = {
  status: "pending" | "approved" | "rejected";
  reason: string;
  requestedAt: string;
  requestedBy: string;
  proposedChanges: FichaCorrectionChanges;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
};

@Entity("fichas")
@Index(["userId", "date"])
@Index(["userId", "status"])
export class Ficha {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 128 })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "date" })
  date!: Date;

  @Column({ type: "time" })
  startTime!: string; // HH:MM

  @Column({ type: "time", nullable: true })
  endTime?: string; // HH:MM

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  hoursWorked?: number; // Calculado: (end - start) / 60

  @Column({ type: "varchar", nullable: true })
  description?: string;

  @Column({ type: "varchar", nullable: true })
  projectCode?: string;

  @Column({ type: "json", nullable: true })
  metadata?: {
    tags?: string[];
    location?: string;
    deviceId?: string;
    correctionRequest?: FichaCorrectionRequest;
    [key: string]: unknown;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "varchar", default: "confirmed" })
  status!: "draft" | "confirmed" | "disputed" | "archived";

  @Column({ type: "varchar", default: "password" })
  clockInMethod!: "password" | "pin" | "qr" | "biometric";

  @Column({ type: "varchar", nullable: true })
  clockOutMethod?: "password" | "pin" | "qr" | "biometric";
}
