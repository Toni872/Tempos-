import { Router, Request, Response } from "express";
import { In } from "typeorm";
import { firebaseAuthMiddleware } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { AppDataSource } from "../database.js";
import { Ficha } from "../entities/Ficha.js";
import { User } from "../entities/User.js";
import { Absence } from "../entities/Absence.js";
import { TimeEntry, TimeEntryType } from "../entities/TimeEntry.js";
import { AuditLog } from "../entities/AuditLog.js";
import {
  appUserContextMiddleware,
  getAuthContext,
} from "../middleware/request-context.middleware.js";
import { hasPermission } from "../security/authorization.js";
import { PdfService } from "../services/pdf.service.js";
import { AiAnalysisService } from "../services/AiAnalysisService.js";
import { AnomalyService } from "../services/AnomalyService.js";

const router = Router();

// --- HELPERS PARA EXPORTACIÓN ---

function sanitizeCSVField(val: any) {
  const str = String(val);
  if (
    str.startsWith("=") ||
    str.startsWith("+") ||
    str.startsWith("-") ||
    str.startsWith("@")
  ) {
    return `'${str}`;
  }
  return str;
}

function auditLogsToCSV(rows: any[]): string {
  const header = "Fecha,Usuario,Acción,Metadatos\n";
  const body = rows
    .map((r) => {
      const fields = [
        r.createdAt,
        r.userName,
        r.action,
        JSON.stringify(r.metadata).replace(/"/g, '""'),
      ]
        .map((f) => `"${sanitizeCSVField(f)}"`)
        .join(",");
      return fields;
    })
    .join("\n");
  return header + body;
}

// --- ENDPOINTS ---

/**
 * GET /api/v1/reports/ai-predictive-analysis
 * Obtiene insights generados por IA basados en los datos reales de la empresa.
 */
router.get(
  "/ai-predictive-analysis",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    if (!hasPermission(auth, "view_employees")) {
      res.status(403).json({ error: "Acceso denegado." });
      return;
    }

    const insights = await AiAnalysisService.generatePredictiveAnalysis(
      auth.companyId,
    );
    res.json({ insights });
  }),
);

/**
 * GET /api/v1/reports/anomalies
 * Obtiene anomalías detectadas en tiempo real (fichajes fuera de rango, faltas, etc.)
 */
router.get(
  "/anomalies",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    if (!hasPermission(auth, "view_employees")) {
      res.status(403).json({ error: "Acceso denegado." });
      return;
    }

    const anomalies = await AnomalyService.getDailyAnomalies(auth.companyId);
    res.json({ data: anomalies });
  }),
);

/**
 * GET /api/v1/reports/audit-logs
 * Listado de logs de auditoría para administradores
 */
router.get(
  "/audit-logs",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    if (!hasPermission(auth, "view_company_audit_logs")) {
      res.status(403).json({ error: "Acceso denegado." });
      return;
    }

    const { startDate, endDate, format } = req.query;

    const qb = AppDataSource.getRepository(AuditLog)
      .createQueryBuilder("audit")
      .leftJoinAndSelect("audit.user", "user")
      .where("audit.companyId = :companyId", { companyId: auth.companyId });

    if (startDate && endDate) {
      qb.andWhere("audit.createdAt BETWEEN :start AND :end", {
        start: startDate,
        end: endDate,
      });
    }

    const logs = await qb
      .orderBy("audit.createdAt", "DESC")
      .take(100)
      .getMany();
    const rows = logs.map((l) => ({
      action: l.action,
      userName: (l as any).user?.displayName || l.userId,
      createdAt: l.createdAt,
      metadata: l.metadata,
    }));

    if (format === "csv") {
      const csv = auditLogsToCSV(rows);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="auditoria.csv"',
      );
      res.send("\uFEFF" + csv);
      return;
    }

    res.json({ data: rows });
  }),
);

/**
 * GET /api/v1/reports/dashboard-stats
 * Resumen de indicadores clave para el gerente
 */
router.get(
  "/dashboard-stats",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    if (!hasPermission(auth, "view_employees")) {
      res.status(403).json({ error: "Acceso denegado." });
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const employees = await AppDataSource.getRepository(User).find({
      where: { companyId: auth.companyId, status: "active" },
    });

    const employeeUids = employees.map((e) => e.uid);

    const [latestEntries, pendingAbsences] = await Promise.all([
      AppDataSource.getRepository(TimeEntry)
        .createQueryBuilder("te")
        .innerJoin(User, "u", "u.uid = te.userId")
        .where("u.companyId = :companyId", { companyId: auth.companyId })
        .andWhere("te.timestampUtc >= :startOfToday", { startOfToday })
        .orderBy("te.timestampUtc", "DESC")
        .getMany(),
      employeeUids.length > 0
        ? AppDataSource.getRepository(Absence).count({
            where: { status: "pending", userId: In(employeeUids) },
          })
        : Promise.resolve(0),
    ]);

    const userStatusMap = new Map();
    latestEntries.forEach((e) => {
      if (!userStatusMap.has(e.userId)) userStatusMap.set(e.userId, e.type);
    });

    let working = 0,
      onBreak = 0;
    const employeeStatusList = employees.map((e) => {
      const type = userStatusMap.get(e.uid);
      let status = "Fuera de jornada",
        color = "zinc";
      if (type === TimeEntryType.CLOCK_IN || type === TimeEntryType.BREAK_END) {
        status = "Trabajando";
        color = "blue";
        working++;
      } else if (type === TimeEntryType.BREAK_START) {
        status = "En pausa";
        color = "orange";
        onBreak++;
      }
      return { uid: e.uid, name: e.displayName || e.email, status, color };
    });

    res.json({
      metrics: {
        working,
        onBreak,
        outside: employees.length - working - onBreak,
        registered: employees.length,
        pendingAbsences,
      },
      employeeStatusList,
    });
  }),
);

/**
 * GET /api/v1/reports/export
 * Exporta el registro de jornada consolidado en formato CSV
 */
router.get(
  "/export",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    if (!hasPermission(auth, "view_employees")) {
      res.status(403).json({ error: "Acceso denegado." });
      return;
    }

    const { startDate, endDate, userId } = req.query;

    const qb = AppDataSource.getRepository(Ficha)
      .createQueryBuilder("ficha")
      .innerJoinAndSelect("ficha.user", "user")
      .where("user.companyId = :companyId", { companyId: auth.companyId });

    if (startDate && endDate) {
      qb.andWhere("ficha.date BETWEEN :start AND :end", {
        start: startDate,
        end: endDate,
      });
    }

    if (userId) {
      qb.andWhere("ficha.userId = :userId", { userId });
    }

    const fichas = await qb.orderBy("ficha.date", "DESC").getMany();

    // Generar CSV
    let csv = "Fecha,Empleado,Email,Entrada,Salida,Horas Totales,Estado\n";
    fichas.forEach((f) => {
      const row = [
        f.date,
        (f as any).user?.displayName || "N/A",
        (f as any).user?.email || "N/A",
        f.startTime,
        f.endTime || "--:--",
        f.hoursWorked?.toFixed(2) || "0.00",
        f.status,
      ]
        .map((field) => `"${sanitizeCSVField(field)}"`)
        .join(",");
      csv += row + "\n";
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="registro_jornada.csv"',
    );
    res.send("\uFEFF" + csv); // BOM para que Excel detecte UTF-8
  }),
);

/**
 * GET /api/v1/reports/audit-pdf
 */
router.get(
  "/audit-pdf",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    if (!hasPermission(auth, "view_employees")) {
      res.status(403).json({ error: "Acceso denegado." });
      return;
    }

    const fichas = await AppDataSource.getRepository(Ficha).find({
      where: { user: { companyId: auth.companyId } },
      relations: ["user"],
      order: { date: "DESC" },
      take: 100,
    });

    const firstUser = fichas[0]?.user;
    const pdfData = {
      employeeName: firstUser?.displayName || `Empresa ${auth.companyId}`,
      employeeEmail: firstUser?.email || "admin@tempos.es",
      companyName: auth.companyId,
      period: new Date().toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      }),
      totalHours: fichas.reduce(
        (acc, f) => acc + Number(f.hoursWorked || 0),
        0,
      ),
      records: fichas.map((f) => ({
        date: f.date.toString(),
        clockIn: f.startTime,
        clockOut: f.endTime || "--:--",
        total: `${Number(f.hoursWorked || 0).toFixed(2)}h`,
        status: f.status,
        location: f.metadata?.location || undefined,
      })),
    };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="auditoria_gps.pdf"',
    );
    await PdfService.generateAuditPDF(res, pdfData);
  }),
);

/**
 * GET /api/v1/reports/inspection-pdf
 * Genera el informe legal para la Inspección de Trabajo
 */
router.get(
  "/inspection-pdf",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    if (!hasPermission(auth, "view_employees")) {
      res.status(403).json({ error: "Acceso denegado." });
      return;
    }

    const { startDate, endDate, userId } = req.query;

    const qb = AppDataSource.getRepository(Ficha)
      .createQueryBuilder("ficha")
      .innerJoinAndSelect("ficha.user", "user")
      .where("user.companyId = :companyId", { companyId: auth.companyId });

    if (startDate && endDate) {
      qb.andWhere("ficha.date BETWEEN :start AND :end", {
        start: startDate,
        end: endDate,
      });
    }

    if (userId) {
      qb.andWhere("ficha.userId = :userId", { userId });
    }

    const fichas = await qb.orderBy("ficha.date", "DESC").getMany();

    const pdfData = {
      employeeName: userId
        ? (fichas[0] as any)?.user?.displayName || "Empleado"
        : "Reporte Agregado",
      employeeEmail: userId
        ? (fichas[0] as any)?.user?.email || "—"
        : "multi-usuario",
      companyName: auth.companyId,
      period:
        startDate && endDate ? `${startDate} a ${endDate}` : "Periodo Actual",
      totalHours: fichas.reduce(
        (acc, f) => acc + Number(f.hoursWorked || 0),
        0,
      ),
      records: fichas.map((f) => ({
        date: f.date.toString(),
        clockIn: f.startTime,
        clockOut: f.endTime || "--:--",
        total: `${Number(f.hoursWorked || 0).toFixed(2)}h`,
        status: f.status,
        location: (f as any).metadata?.location || undefined,
      })),
    };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="registro_legal_jornada.pdf"',
    );
    await PdfService.generateInspectionPDF(res, pdfData);
  }),
);

export default router;
