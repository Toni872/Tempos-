import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Ficha } from "./Ficha.js";
import { User } from "./User.js";

export enum TimeEntryType {
  CLOCK_IN = "CLOCK_IN",
  CLOCK_OUT = "CLOCK_OUT",
  BREAK_START = "BREAK_START",
  BREAK_END = "BREAK_END",
}

export enum TimeEntrySource {
  WEB = "WEB",
  MOBILE = "MOBILE",
  KIOSK = "KIOSK",
}

@Entity("time_entries")
@Index(["fichaId", "type"])
@Index(["userId", "timestampUtc"])
@Index(["userId", "createdAt"])
export class TimeEntry {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  fichaId!: string;

  @ManyToOne(() => Ficha, { onDelete: "CASCADE" })
  @JoinColumn({ name: "fichaId" })
  ficha!: Ficha;

  @Column({ type: "varchar", length: 128 })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "enum", enum: TimeEntryType })
  type!: TimeEntryType;

  @Column({ type: "timestamp with time zone" })
  timestampUtc!: Date;

  @Column({ type: "varchar", nullable: true })
  localDateTime?: string; // ISO 8601 con zona horaria (2026-04-07T15:30:45+02:00)

  @Column({ type: "enum", enum: TimeEntrySource })
  source!: TimeEntrySource;

  @Column({ type: "varchar", nullable: true })
  ip?: string;

  @Column({ type: "varchar", nullable: true })
  userAgent?: string;

  @Column({ type: "varchar", nullable: true })
  deviceId?: string; // Fingerprint del dispositivo usado

  @Column({ type: "decimal", precision: 10, scale: 6, nullable: true })
  latitude?: number;

  @Column({ type: "decimal", precision: 10, scale: 6, nullable: true })
  longitude?: number;

  @Column({ type: "json", nullable: true })
  metadata?: {
    deviceId?: string;
    source_app_version?: string;
    duration_seconds?: number; // Para pausas: duración en segundos
    [key: string]: unknown;
  };

  @CreateDateColumn()
  createdAt!: Date;
}
