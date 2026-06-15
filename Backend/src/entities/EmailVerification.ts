import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('email_verifications')
@Index(['token', 'used'])
@Index(['uid', 'email'])
export class EmailVerification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 128 })
  uid!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  token!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  used!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}