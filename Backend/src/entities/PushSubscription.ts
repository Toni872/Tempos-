import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User.js";

@Entity("push_subscriptions")
export class PushSubscription {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 128 })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "text" })
  endpoint!: string;

  @Column({ type: "varchar", nullable: true })
  expirationTime?: string;

  @Column({ type: "json" })
  keys!: {
    p256dh: string;
    auth: string;
  };

  @CreateDateColumn()
  createdAt!: Date;
}
