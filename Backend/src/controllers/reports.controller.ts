import { Router, Request, Response } from 'express';
import { firebaseAuthMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppDataSource } from '../database.js';
import { Ficha } from '../entities/Ficha.js';
import { User } from '../entities/User.js';
import { AuditLog } from '../entities/AuditLog.js';
import { logAction } from '../utils/auditLog.js';
import { appUserContextMiddleware, getAuthContext } from '../middleware/request-context.middleware.js';
import { hasPermission } from '../security/authorization.js';

const router = Router();

/** Escape a value for RFC 4180 CSV: wrap in quotes if it contains comma, quote, or newline */
function csvField(val: string | number | null | undefined): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function parseDate(val: unknown): string | undefined {
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  return undefined;
}

function fichasToCSV(fichas: Ficha[]): string {
  const header = 'id,fecha,hora_inicio,hora_fin,horas_trabajadas,descripcion,codigo_proyecto,estado';
  const rows = fichas.map((f) => {
    const raw = f.date as unknown as string | Date;
    const date = typeof raw === 'string' ? raw.split('T')[0] : (raw as Date).toISOString().split('T')[0];
    return [
      csvField(f.id),
      csvField(date),
      csvField(f.startTime),
      csvField(f.endTime),
      csvField(f.hoursWorked),
      csvField(f.description),
      csvField(f.projectCode),
      csvField(f.status),
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

function fichasToPDF(fichas: Ficha[], totalHours: number): string {
  const now = new Date().toLocaleString('es-ES');
  const lines = [
    `INFORME DE INSPECCIÓN DE TRABAJO · ${now}`,
    '='.repeat(60),
    '',
    `Total registros: ${fichas.length}`,
    `Total horas confirmadas: ${totalHours.toFixed(2)}h`,
    '',
    '-'.repeat(60),
    'FECHA        INICIO   FIN      HORAS  PROYECTO       ESTADO',
    '-'.repeat(60),
    ...fichas.map((f) => {
      const raw = f.date as unknown as string | Date;
      const date = typeof raw === 'string' ? raw.split('T')[0] : (raw as Date).toISOString().split('T')[0];
      const h = String(f.hoursWorked ?? '').padStart(5);
      const proj = (f.projectCode ?? '').substring(0, 12).padEnd(14);
      return `${date}  ${f.startTime}  ${(f.endTime ?? '-----').padEnd(5)}  ${h}  ${proj}  ${f.status}`;
    }),
    '-'.repeat(60),
    '',
    'Este informe ha sido generado automáticamente por Tempos.',
    'Es válido como registro de control horario según el art. 34.9 ET.',
  ];
  return lines.join('\n');
}

type AuditLogFilters = {
  startDate?: string;
  endDate?: string;
  action?: string;
  userId?: string;
  limit: number;
  offset: number;
};

function parseAuditLogFilters(req: Request): AuditLogFilters {
  const startDate = parseDate(req.query.startDate);
  const endDate = parseDate(req.query.endDate);
  const action = typeof req.query.action === 'string' && req.query.action.trim().length > 0
    ? req.query.action.trim()
    : undefined;
  const userId = typeof req.query.userId === 'string' && req.query.userId.trim().length > 0
    ? req.query.userId.trim()
    : undefined;

  return {
    startDate,
    endDate,
    action,
    userId,
    limit: Math.min(Math.max(Number(req.query.limit) || 50, 1), 200),
    offset: Math.max(Number(req.query.offset) || 0, 0),
  };
}

function buildAuditLogQuery(auth: ReturnType<typeof getAuthContext>, canViewCompanyLogs: boolean, filters: AuditLogFilters) {
  const qb = AppDataSource.getRepository(AuditLog)
    .createQueryBuilder('audit')
    .where('audit.companyId = :companyId', { companyId: auth.companyId })
    .orderBy('audit.createdAt', 'DESC')
    .take(filters.limit)
    .skip(filters.offset);

  if (!canViewCompanyLogs) {
    qb.andWhere('audit.userId = :uid', { uid: auth.uid });
  }

  if (filters.userId) {
    qb.andWhere('audit.userId = :userId', { userId: filters.userId });
  }

  if (filters.action) {
    qb.andWhere('audit.action = :action', { action: filters.action });
  }

  if (filters.startDate && filters.endDate) {
    qb.andWhere('audit.createdAt BETWEEN :startDate AND :endDate', {
      startDate: `${filters.startDate}T00:00:00.000Z`,
      endDate: `${filters.endDate}T23:59:59.999Z`,
    });
  } else if (filters.startDate) {
    qb.andWhere('audit.createdAt >= :startDate', { startDate: `${filters.startDate}T00:00:00.000Z` });
  } else if (filters.endDate) {
    qb.andWhere('audit.createdAt <= :endDate', { endDate: `${filters.endDate}T23:59:59.999Z` });
  }

  return qb;
}

function auditLogsToCSV(rows: AuditLog[]): string {
  const header = 'id,createdAt,userId,companyId,action,ip,userAgent,metadata';
  const lines = rows.map((row) => {
    const metadata = row.metadata ? JSON.stringify(row.metadata) : '';
    return [
      csvField(row.id),
      csvField(row.createdAt.toISOString()),
      csvField(row.userId),
      csvField(row.companyId),
      csvField(row.action),
      csvField(row.ip),
      csvField(row.userAgent),
      csvField(metadata),
    ].join(',');
  });

  return [header, ...lines].join('\n');
}

function auditLogsToPDF(rows: AuditLog[]): string {
  const now = new Date().toLocaleString('es-ES');
  const lines = [
    `INFORME DE AUDITORIA · ${now}`,
    '='.repeat(80),
    '',
    `Total eventos: ${rows.length}`,
    '',
    '-'.repeat(80),
    'FECHA/HORA           USUARIO                               ACCION',
    '-'.repeat(80),
    ...rows.map((row) => {
      const date = row.createdAt.toISOString().replace('T', ' ').slice(0, 19);
      const user = (row.userId ?? '-').slice(0, 35).padEnd(35);
      return `${date}  ${user}  ${row.action}`;
    }),
    '-'.repeat(80),
    '',
    'Este informe ha sido generado automáticamente por Tempos.',
  ];

  return lines.join('\n');
}

/**
 * GET /api/v1/reports/export
 * Export fichas as CSV or PDF
 * Query params: format=csv|pdf, startDate=YYYY-MM-DD, endDate=YYYY-MM-DD
 */
router.get(
  '/export',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const format = (req.query.format as string) || 'csv';
    const startDate = parseDate(req.query.startDate);
    const endDate = parseDate(req.query.endDate);

    const qb = AppDataSource.getRepository(Ficha)
      .createQueryBuilder('ficha')
      .innerJoin(User, 'user', 'user.uid = ficha.userId')
      .where('ficha.userId = :uid', { uid: auth.uid })
      .andWhere('user.companyId = :companyId', { companyId: auth.companyId })
      .andWhere('ficha.status = :status', { status: 'confirmed' })
      .orderBy('ficha.date', 'ASC')
      .addOrderBy('ficha.startTime', 'ASC');

    if (startDate && endDate) {
      qb.andWhere('ficha.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    } else if (startDate) {
      qb.andWhere('ficha.date >= :startDate', { startDate });
    } else if (endDate) {
      qb.andWhere('ficha.date <= :endDate', { endDate });
    }

    const fichas = await qb.getMany();
    const totalHours = fichas.reduce((acc, f) => acc + (Number(f.hoursWorked) || 0), 0);

    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: 'report_export',
      metadata: { format, startDate, endDate, recordCount: fichas.length },
      ip: req.ip,
    });

    if (format === 'csv') {
      const csv = fichasToCSV(fichas);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="informe_tempos.csv"');
      res.send('\uFEFF' + csv); // BOM for Excel compatibility
    } else {
      // Plain text report (swap for pdfkit when real PDF generation is needed)
      const pdf = fichasToPDF(fichas, totalHours);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="informe_inspeccion.txt"');
      res.send(Buffer.from(pdf, 'utf-8'));
    }
  })
);

/**
 * GET /api/v1/reports/summary
 * JSON summary: total hours, avg per day, absenteeism days
 */
router.get(
  '/summary',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);

    const fichas = await AppDataSource.getRepository(Ficha)
      .createQueryBuilder('ficha')
      .innerJoin(User, 'user', 'user.uid = ficha.userId')
      .where('ficha.userId = :uid', { uid: auth.uid })
      .andWhere('user.companyId = :companyId', { companyId: auth.companyId })
      .andWhere('ficha.status = :status', { status: 'confirmed' })
      .getMany();

    const totalHours = fichas.reduce((acc, f) => acc + (Number(f.hoursWorked) || 0), 0);
    const uniqueDays = new Set(
      fichas.map((f) => {
        const raw = f.date as unknown as string | Date;
        return typeof raw === 'string' ? raw.split('T')[0] : (raw as Date).toISOString().split('T')[0];
      })
    ).size;

    res.json({
      totalEntries: fichas.length,
      totalHours: parseFloat(totalHours.toFixed(2)),
      uniqueDays,
      avgHoursPerDay: uniqueDays > 0 ? parseFloat((totalHours / uniqueDays).toFixed(2)) : 0,
    });
  })
);

/**
 * GET /api/v1/reports/audit-log
 * Historial de cambios y accesos (audit trail)
 */
router.get(
  '/audit-log',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const canViewCompanyLogs = hasPermission(auth, 'view_company_audit_logs');

    const filters = parseAuditLogFilters(req);

    if (filters.userId && !canViewCompanyLogs && filters.userId !== auth.uid) {
      res.status(403).json({ error: 'No puedes consultar auditoría de otros usuarios.' });
      return;
    }

    const qb = buildAuditLogQuery(auth, canViewCompanyLogs, filters);

    const [rows, total] = await qb.getManyAndCount();

    res.json({
      data: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        companyId: row.companyId,
        action: row.action,
        metadata: row.metadata,
        ip: row.ip,
        userAgent: row.userAgent,
        createdAt: row.createdAt,
      })),
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  })
);

/**
 * GET /api/v1/reports/audit-log/export
 * Exporta el historial de auditoría en CSV o PDF.
 */
router.get(
  '/audit-log/export',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const canViewCompanyLogs = hasPermission(auth, 'view_company_audit_logs');
    const format = (req.query.format as string) || 'csv';
    const filters = parseAuditLogFilters(req);

    // Para exportar, ignoramos paginación de UI y traemos hasta 2000 eventos.
    filters.limit = Math.min(Math.max(Number(req.query.limit) || 1000, 1), 2000);
    filters.offset = Math.max(Number(req.query.offset) || 0, 0);

    if (filters.userId && !canViewCompanyLogs && filters.userId !== auth.uid) {
      res.status(403).json({ error: 'No puedes exportar auditoría de otros usuarios.' });
      return;
    }

    const rows = await buildAuditLogQuery(auth, canViewCompanyLogs, filters).getMany();

    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: 'report_audit_export',
      metadata: {
        format,
        actionFilter: filters.action,
        userIdFilter: filters.userId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        recordCount: rows.length,
      },
      ip: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });

    if (format === 'csv') {
      const csv = auditLogsToCSV(rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="auditoria_tempos.csv"');
      res.send('\uFEFF' + csv);
      return;
    }

    const pdf = auditLogsToPDF(rows);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="auditoria_tempos.txt"');
    res.send(Buffer.from(pdf, 'utf-8'));
  })
);

export default router;
