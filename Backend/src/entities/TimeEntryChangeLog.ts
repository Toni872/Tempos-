import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { TimeEntry } from "./TimeEntry.js";
import { User } from "./User.js";

export enum ChangeAction {
  CREATED = "CREATED",
  MODIFIED = "MODIFIED",
  DELETED = "DELETED",
  CORRECTED = "CORRECTED",
}

@Entity("time_entry_change_logs")
@Index(["timeEntryId", "createdAt"])
@Index(["changedBy", "createdAt"])
@Index(["action", "createdAt"])
export class TimeEntryChangeLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  timeEntryId!: string;

  @ManyToOne(() => TimeEntry, { onDelete: "CASCADE" })
  @JoinColumn({ name: "timeEntryId" })
  timeEntry!: TimeEntry;

  @Column({ type: "varchar", length: 128 })
  changedBy!: string; // UID del usuario que hizo el cambio

  @ManyToOne(() => User)
  @JoinColumn({ name: "changedBy" })
  changedByUser!: User;

  @Column({ type: "enum", enum: ChangeAction })
  action!: ChangeAction;

  @Column({ type: "json" })
  changeSet!: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };

  @Column({ type: "varchar", nullable: true })
  reason?: string; // Motivo de la corrección (e.g., "Corrección de zona horaria", "Sincronización servidor")

  @Column({ type: "varchar", nullable: true })
  ip?: string;

  @Column({ type: "varchar", nullable: true })
  userAgent?: string;

  @Column({ type: "json", nullable: true })
  metadata?: {
    approvalStatus?: "pending" | "approved" | "rejected";
    approvedBy?: string;
    approvalComment?: string;
    [key: string]: unknown;
  };

  @CreateDateColumn()
  createdAt!: Date;
}
