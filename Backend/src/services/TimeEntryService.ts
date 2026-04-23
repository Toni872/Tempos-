import { Repository } from 'typeorm';
import { TimeEntry, TimeEntryType, TimeEntrySource } from '../entities/TimeEntry.js';
import { TimeEntryChangeLog, ChangeAction } from '../entities/TimeEntryChangeLog.js';
import { AppDataSource } from '../database.js';

export interface RecordClockEventParams {
  userId: string;
  fichaId: string;
  type: TimeEntryType;
  source: TimeEntrySource;
  timestampUtc: Date;
  localDateTime?: string;
  ip?: string;
  userAgent?: string;
  latitude?: number;
  longitude?: number;
}

export interface LogChangeParams {
  timeEntryId: string;
  changedBy: string;
  action: ChangeAction;
  changeSet: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  reason?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * TimeEntryService
 * Centraliza la lógica de creación y auditoría de eventos de fichaje atómicos.
 * Responsable de:
 * - Registrar eventos CLOCK_IN, CLOCK_OUT, BREAK_START, BREAK_END
 * - Mantener log de cambios (correcciones, sincronización, etc.)
 * - Proveer trazabilidad completa para cumplimiento legal (art. 34.9 ET, RGPD)
 */
export class TimeEntryService {
  private timeEntryRepo: Repository<TimeEntry>;
  private changeLogRepo: Repository<TimeEntryChangeLog>;

  constructor(
    timeEntryRepo?: Repository<TimeEntry>,
    changeLogRepo?: Repository<TimeEntryChangeLog>
  ) {
    this.timeEntryRepo = timeEntryRepo || AppDataSource.getRepository(TimeEntry);
    this.changeLogRepo = changeLogRepo || AppDataSource.getRepository(TimeEntryChangeLog);
  }

  /**
   * Registra un evento atómico de fichaje (entrada, salida, pausa inicio/fin)
   * @param params datos del evento
   * @returns TimeEntry creado
   */
  async recordClockEvent(params: RecordClockEventParams): Promise<TimeEntry> {
    const timeEntry = this.timeEntryRepo.create({
      fichaId: params.fichaId,
      userId: params.userId,
      type: params.type,
      timestampUtc: params.timestampUtc,
      localDateTime: params.localDateTime,
      source: params.source,
      ip: params.ip,
      userAgent: params.userAgent,
      latitude: params.latitude,
      longitude: params.longitude,
      metadata: {
        deviceId: undefined, // puede extraerse de userAgent si es necesario
      },
    });

    return this.timeEntryRepo.save(timeEntry);
  }

  /**
   * Registra un cambio en un evento de fichaje (corrección, sincronización, etc.)
   * @param params datos del cambio
   * @returns TimeEntryChangeLog creado
   */
  async logChange(params: LogChangeParams): Promise<TimeEntryChangeLog> {
    const changeLog = this.changeLogRepo.create({
      timeEntryId: params.timeEntryId,
      changedBy: params.changedBy,
      action: params.action,
      changeSet: params.changeSet,
      reason: params.reason,
      ip: params.ip,
      userAgent: params.userAgent,
      metadata: {
        approvalStatus: 'pending', // por defecto pendiente de aprobación
      },
    });

    return this.changeLogRepo.save(changeLog);
  }

  /**
   * Obtiene el historial de cambios de un TimeEntry
   * @param timeEntryId ID del evento
   * @returns array de cambios ordenados por fecha
   */
  async getChangeHistory(timeEntryId: string): Promise<TimeEntryChangeLog[]> {
    return this.changeLogRepo
      .createQueryBuilder('log')
      .where('log.timeEntryId = :timeEntryId', { timeEntryId })
      .orderBy('log.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Obtiene todos los eventos de una ficha en orden cronológico
   * @param fichaId ID de la ficha
   * @returns array de TimeEntry
   */
  async getsFichaEvents(fichaId: string): Promise<TimeEntry[]> {
    return this.timeEntryRepo
      .createQueryBuilder('entry')
      .where('entry.fichaId = :fichaId', { fichaId })
      .orderBy('entry.timestampUtc', 'ASC')
      .getMany();
  }

  /**
   * Obtiene eventos de un usuario en un rango de fechas
   * Usado para auditoría y reportes
   * @param userId UID del usuario
   * @param startDate fecha inicio (ISO)
   * @param endDate fecha fin (ISO)
   * @returns array de TimeEntry
   */
  async getUserEventsByDateRange(userId: string, startDate: string, endDate: string): Promise<TimeEntry[]> {
    return this.timeEntryRepo
      .createQueryBuilder('entry')
      .where('entry.userId = :userId', { userId })
      .andWhere('DATE(entry.timestampUtc AT TIME ZONE \'UTC\') >= :startDate', { startDate })
      .andWhere('DATE(entry.timestampUtc AT TIME ZONE \'UTC\') <= :endDate', { endDate })
      .orderBy('entry.timestampUtc', 'ASC')
      .getMany();
  }

  /**
   * Obtiene el último evento de un usuario (para validaciones)
   * @param userId UID del usuario
   * @returns último TimeEntry o null
   */
  async getLastEventForUser(userId: string): Promise<TimeEntry | null> {
    return this.timeEntryRepo
      .createQueryBuilder('entry')
      .where('entry.userId = :userId', { userId })
      .orderBy('entry.timestampUtc', 'DESC')
      .limit(1)
      .getOne();
  }

  /**
   * Registra la solicitud de correcciones para todos los eventos de una ficha
   * @param params datos de la solicitud
   */
  async requestCorrections(params: {
    fichaId: string;
    requestedBy: string;
    reason: string;
    beforeState: Record<string, unknown>;
    afterState: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    const timeEntries = await this.getsFichaEvents(params.fichaId);

    for (const entry of timeEntries) {
      await this.logChange({
        timeEntryId: entry.id,
        changedBy: params.requestedBy,
        action: ChangeAction.CORRECTED,
        changeSet: {
          before: params.beforeState,
          after: params.afterState,
        },
        reason: params.reason,
        ip: params.ip,
        userAgent: params.userAgent,
      });

      // El método logChange ya establece approvalStatus: 'pending' por defecto en el constructor/creación
    }
  }

  /**
   * Revisa y cierra el ciclo de vida de las correcciones pendientes de una ficha
   * @param params datos de la revisión
   */
  async reviewCorrections(params: {
    fichaId: string;
    reviewedBy: string;
    decision: 'approved' | 'rejected';
    comment?: string;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    const timeEntries = await this.getsFichaEvents(params.fichaId);

    for (const entry of timeEntries) {
      // Buscamos por historial y filtramos en memoria para mayor compatibilidad de queries JSON
      const history = await this.getChangeHistory(entry.id);
      const pendingLog = history.reverse().find(log => 
        (log.metadata as any)?.approvalStatus === 'pending'
      );

      if (pendingLog) {
        pendingLog.metadata = {
          ...(pendingLog.metadata || {}),
          approvalStatus: params.decision,
          reviewedBy: params.reviewedBy,
          reviewedAt: new Date().toISOString(),
          reviewComment: params.comment,
          reviewIp: params.ip,
          reviewUserAgent: params.userAgent,
        };
        await this.changeLogRepo.save(pendingLog);
      }
    }
  }
}

// Singleton para uso desde controllers
let instance: TimeEntryService | null = null;

export function getTimeEntryService(): TimeEntryService {
  if (!instance) {
    instance = new TimeEntryService();
  }
  return instance;
}
