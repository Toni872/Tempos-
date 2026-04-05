import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type UserRole = 'admin' | 'manager' | 'employee' | 'auditor';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
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
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'varchar', default: 'active' })
  status!: 'active' | 'suspended' | 'deleted';
}
