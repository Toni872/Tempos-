import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type UserRole = 'admin' | 'manager' | 'employee' | 'auditor';

@Entity('users')
export class User {
  @PrimaryColumn('varchar', { length: 128 })
  uid!: string; // Firebase UID

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  displayName?: string;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', default: 'tempos-demo' })
  companyId!: string;

  @Column({ type: 'varchar', default: 'employee' })
  role!: UserRole;

  @Column({ type: 'json', nullable: true })
  metadata?: {
    createdAt?: string;
    lastSignInTime?: string;
    invitedAt?: string;
    invitedBy?: string;
    companyName?: string;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'varchar', default: 'active' })
  status!: 'active' | 'suspended' | 'deleted';

  @Column({ type: 'boolean', default: false })
  hasAcceptedTerms!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  acceptedTermsAt?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hourlyRate!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  overtimeRate!: number;

  @Column({ type: 'boolean', default: false })
  requiresGeolocation!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresQR!: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  kioskPin?: string;
}
