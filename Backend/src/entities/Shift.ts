import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.js';
import { Schedule } from './Schedule.js';

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 128 })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  scheduleId!: string;

  @ManyToOne(() => Schedule)
  @JoinColumn({ name: 'scheduleId' })
  schedule!: Schedule;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date; // Si es null, es un turno indefinido

  @Column({ type: 'varchar', default: 'tempos-demo' })
  companyId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
