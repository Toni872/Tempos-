import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('work_centers')
export class WorkCenter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column({ type: 'integer', default: 100 })
  radiusMeters!: number; // Radio de la geocerca para permitir fichaje

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  qrToken?: string; // Token único para fichaje por QR físico en el centro

  @Column({ type: 'varchar', default: 'active' })
  status!: 'active' | 'inactive';

  @Column({ type: 'varchar', default: 'tempos-demo' })
  companyId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
