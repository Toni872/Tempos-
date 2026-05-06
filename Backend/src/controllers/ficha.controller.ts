import { Router, Request, Response } from "express";
import { AppDataSource } from "../database.js";
import { IsNull } from "typeorm";
import { Ficha } from "../entities/Ficha.js";
import { User } from "../entities/User.js";
import { WorkCenter } from "../entities/WorkCenter.js";
import { firebaseAuthMiddleware } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  appUserContextMiddleware,
  getAuthContext,
} from "../middleware/request-context.middleware.js";
import {
  buildValidationError,
  listFichasQuerySchema,
  clockInSchema,
  clockOutSchema
} from "../utils/validation.js";
import { LocationService } from "../services/LocationService.js";
import { getTimeEntryService } from "../services/TimeEntryService.js";

const router = Router();

// --- HELPERS INTERNOS ---

/**
 * Resuelve la fecha y hora efectiva, permitiendo soporte offline (máx 48h)
 */
function resolveEffectiveNow(offlineTimestamp?: string) {
  let effectiveDate = new Date();
  let isOffline = false;

  if (offlineTimestamp) {
    const parsed = new Date(offlineTimestamp);
    const diffMs = Date.now() - parsed.getTime();
    if (!isNaN(parsed.getTime()) && diffMs >= 0 && diffMs <= 48 * 60 * 60 * 1000) {
      effectiveDate = parsed;
      isOffline = true;
    }
  }
  return { effectiveDate, isOffline };
}

/**
 * Valida las políticas de RRHH (GPS, QR, Dispositivo)
 */
async function validateWorkPolicy(params: {
  user: User;
  companyId: string;
  location?: { lat: number; lng: number };
  qrToken?: string;
  deviceId?: string;
  actionType: "clock-in" | "clock-out" | "break";
}) {
  const { user, companyId, location, qrToken, deviceId, actionType } = params;
  const workCenterRepo = AppDataSource.getRepository(WorkCenter);

  // 1. GPS
  if (user.requiresGeolocation && (actionType === "clock-in" || actionType === "clock-out")) {
    if (!location) throw new Error(`Ubicación GPS obligatoria para ${actionType}`);
    const centers = await workCenterRepo.findBy({ companyId, status: "active" });
    const isInside = centers.some((c: WorkCenter) => 
      c.latitude && c.longitude && LocationService.isWithinRadius(
        location, 
        { lat: Number(c.latitude), lng: Number(c.longitude) }, 
        c.radiusMeters
      )
    );
    if (!isInside) throw new Error("Estás fuera del radio de un centro de trabajo autorizado.");
  }

  // 2. QR
  if (user.requiresQR && (actionType === "clock-in" || actionType === "clock-out")) {
    if (!qrToken) throw new Error("El escaneo de código QR es obligatorio.");
    const wc = await workCenterRepo.findOneBy({ companyId, qrToken, status: "active" });
    if (!wc) throw new Error("El código QR no es válido.");
  }

  // 3. Antifraude Dispositivo (Solo activo en producción)
  if (deviceId && process.env.NODE_ENV === "production") {
    if (!user.authorizedDeviceId && actionType === "clock-in") {
      user.authorizedDeviceId = deviceId;
      await AppDataSource.getRepository(User).save(user);
    } else if (user.authorizedDeviceId && user.authorizedDeviceId !== deviceId) {
      throw new Error("Dispositivo no autorizado.");
    }
  }
}

// --- ENDPOINTS ---

/**
 * Iniciar Jornada (Clock In)
 */
router.post(
  "/clockin",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const parsed = clockInSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }

    const user = await AppDataSource.getRepository(User).findOneBy({ uid: auth.uid });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    try {
      await validateWorkPolicy({
        user,
        companyId: auth.companyId,
        location: parsed.data.location,
        qrToken: parsed.data.qrToken,
        deviceId: parsed.data.deviceId,
        actionType: "clock-in"
      });

      const { effectiveDate } = resolveEffectiveNow(parsed.data.offlineTimestamp);
      
      // Intentamos usar el servicio de entradas
      const teService = getTimeEntryService() as any;
      const ficha = await teService.clockIn({
        userId: auth.uid,
        companyId: auth.companyId,
        timestamp: effectiveDate,
        location: parsed.data.location,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
      });

      res.status(201).json({ message: "Entrada registrada", data: ficha });
    } catch (err: any) {
      console.error("❌ [CLOCK-IN ERROR]:", err.message);
      res.status(403).json({ 
        error: "Error al fichar", 
        detail: err.message,
        code: "POLICY_VIOLATION" 
      });
    }
  })
);

/**
 * Finalizar Jornada (Clock Out)
 */
router.post(
  "/clockout",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const parsed = clockOutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }

    const user = await AppDataSource.getRepository(User).findOneBy({ uid: auth.uid });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    try {
      await validateWorkPolicy({
        user,
        companyId: auth.companyId,
        location: parsed.data.location,
        actionType: "clock-out"
      });

      const { effectiveDate } = resolveEffectiveNow(parsed.data.offlineTimestamp);
      
      const teService = getTimeEntryService() as any;
      const ficha = await teService.clockOut({
        userId: auth.uid,
        timestamp: effectiveDate,
        location: parsed.data.location,
        ip: req.ip
      });

      res.json({ message: "Salida registrada", data: ficha });
    } catch (err: any) {
      console.error("❌ [CLOCK-OUT ERROR]:", err.message);
      res.status(403).json({ error: err.message });
    }
  })
);

/**
 * Iniciar Pausa
 */
router.post(
  "/break-start",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const parsed = clockInSchema.safeParse(req.body); // Reutilizamos esquema de clockIn
    
    try {
      const { effectiveDate } = resolveEffectiveNow(parsed.data?.offlineTimestamp);
      const teService = getTimeEntryService();
      const event = await teService.breakStart({
        userId: auth.uid,
        timestamp: effectiveDate,
        location: parsed.data?.location,
        ip: req.ip
      });

      res.status(201).json({ message: "Pausa iniciada", data: event });
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  })
);

/**
 * Finalizar Pausa
 */
router.post(
  "/break-end",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const parsed = clockInSchema.safeParse(req.body);
    
    try {
      const { effectiveDate } = resolveEffectiveNow(parsed.data?.offlineTimestamp);
      const teService = getTimeEntryService();
      const event = await teService.breakEnd({
        userId: auth.uid,
        timestamp: effectiveDate,
        location: parsed.data?.location,
        ip: req.ip
      });

      res.status(201).json({ message: "Pausa finalizada", data: event });
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  })
);

/**
 * Listar Fichas
 */
router.get(
  "/",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const parsed = listFichasQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }

    const { startDate, endDate, userId, limit = 50, offset = 0 } = parsed.data;

    const qb = AppDataSource.getRepository(Ficha)
      .createQueryBuilder("ficha")
      .innerJoinAndSelect("ficha.user", "user")
      .where("user.companyId = :companyId", { companyId: auth.companyId });

    if (auth.isPrivileged && userId) {
      qb.andWhere("ficha.userId = :userId", { userId });
    } else if (!auth.isPrivileged) {
      qb.andWhere("ficha.userId = :uid", { uid: auth.uid });
    }

    if (startDate && endDate) {
      qb.andWhere("ficha.date BETWEEN :start AND :end", { start: startDate, end: endDate });
    }

    const [items, total] = await qb.orderBy("ficha.date", "DESC").take(limit).skip(offset).getManyAndCount();

    res.json({ 
      data: items, 
      pagination: { total, limit, offset } 
    });
  })
);

/**
 * Obtener Ficha Activa
 */
router.get(
  "/active",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const openFicha = await AppDataSource.getRepository(Ficha).findOne({
      where: { userId: auth.uid, endTime: IsNull() }
    });

    if (!openFicha) {
      res.json({ data: null });
      return;
    }

    const teService = getTimeEntryService() as any;
    const events = await teService.getsFichaEvents(openFicha.id);
    res.json({ data: { ...openFicha, events } });
  })
);

export default router;
