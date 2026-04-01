import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.js';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar', nullable: true })
  type?: 'nomina' | 'contrato' | 'anexo' | 'other';

  @Column({
    type: 'varchar',
    default: 'delivered',
  })
  status!: 'delivered' | 'signed' | 'pending';

  @Column({ type: 'varchar', nullable: true })
  filename?: string;

  // Path inside GCS bucket or local path (dev)
  @Column({ type: 'varchar', nullable: true })
  fileUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  mimeType?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
