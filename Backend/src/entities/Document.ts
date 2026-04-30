import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User.js";

@Entity("documents")
export class Document {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 128 })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "varchar", nullable: true })
  type?: "nomina" | "contrato" | "anexo" | "prevencion" | "other";

  @Column({
    type: "varchar",
    default: "delivered",
  })
  status!: "delivered" | "signed" | "pending" | "rejected";

  @Column({ type: "text", nullable: true })
  signatureData?: string;

  @Column({ type: "timestamp", nullable: true })
  signedAt?: Date;

  @Column({ type: "jsonb", nullable: true })
  signatureMetadata?: {
    ip?: string;
    location?: { lat: number; lng: number };
    userAgent?: string;
  };

  @Column({ type: "varchar", nullable: true })
  filename?: string;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  // Path inside GCS bucket or local path (dev)
  @Column({ type: "varchar", nullable: true })
  fileUrl?: string;

  @Column({ type: "varchar", nullable: true })
  mimeType?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
