import { Router, Request, Response } from 'express';
import { firebaseAuthMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppDataSource } from '../database.js';
import { Ficha } from '../entities/Ficha.js';
import { logAction } from '../utils/auditLog.js';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

const router = Router();

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
      f.id,
      date,
      f.startTime,
      f.endTime ?? '',
      f.hoursWorked ?? '',
      (f.description ?? '').replace(/,/g, ';'),
      f.projectCode ?? '',
      f.status,
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

/**
 * GET /api/v1/reports/export
 * Export fichas as CSV or PDF
 * Query params: format=csv|pdf, startDate=YYYY-MM-DD, endDate=YYYY-MM-DD
 */
router.get(
  '/export',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const format = (req.query.format as string) || 'csv';
    const startDate = parseDate(req.query.startDate);
    const endDate = parseDate(req.query.endDate);

    const repo = AppDataSource.getRepository(Ficha);
    const where: any = { userId: firebaseUser.uid, status: 'confirmed' };

    if (startDate && endDate) {
      where.date = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.date = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.date = LessThanOrEqual(new Date(endDate));
    }

    const fichas = await repo.find({ where, order: { date: 'ASC', startTime: 'ASC' } });
    const totalHours = fichas.reduce((acc, f) => acc + (Number(f.hoursWorked) || 0), 0);

    await logAction({
      userId: firebaseUser.uid,
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
      // PDF-like plain text (no extra deps; swap for pdfkit in production)
      const pdf = fichasToPDF(fichas, totalHours);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="informe_inspeccion.pdf"');
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const repo = AppDataSource.getRepository(Ficha);

    const fichas = await repo.find({
      where: { userId: firebaseUser.uid, status: 'confirmed' },
    });

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

export default router;
