import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string; // Ej: "Jornada Mañana", "Turno Noche"

  @Column({ type: 'varchar', length: 5 })
  startTime!: string; // HH:MM

  @Column({ type: 'varchar', length: 5 })
  endTime!: string; // HH:MM

  @Column({ type: 'json' })
  daysOfWeek!: number[]; // [1, 2, 3, 4, 5] para Lun-Vie (ISO: 1=Mon, 7=Sun)

  @Column({ type: 'integer', default: 0 })
  gracePeriodMinutes!: number; // Margen de cortesía antes de marcar como "tarde"

  @Column({ type: 'varchar', default: 'tempos-demo' })
  companyId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
