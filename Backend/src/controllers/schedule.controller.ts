import { Router } from "express";
import { AppDataSource } from "../database.js";
import { Schedule } from "../entities/Schedule.js";
import { Shift } from "../entities/Shift.js";
import { User } from "../entities/User.js";
import {
  scheduleSchema,
  assignShiftSchema,
  buildValidationError,
} from "../utils/validation.js";
import { firebaseAuthMiddleware } from "../middleware/auth.middleware.js";
import {
  appUserContextMiddleware,
  getAuthContext,
} from "../middleware/request-context.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

// --- SCHEDULES (HORARIOS BASE) ---

// Listar horarios de la empresa
router.get(
  "/",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const repo = AppDataSource.getRepository(Schedule);
    const schedules = await repo.findBy({ companyId: auth.companyId });
    res.json({ data: schedules });
  }),
);

// Crear horario
router.post(
  "/",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    if (auth.role !== "admin" && auth.role !== "manager") {
      res
        .status(403)
        .json({ error: "No tienes permisos para crear horarios." });
      return;
    }

    const parse = scheduleSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json(buildValidationError(parse.error));
      return;
    }

    const repo = AppDataSource.getRepository(Schedule);
    const schedule = repo.create({
      ...parse.data,
      companyId: auth.companyId,
    });

    await repo.save(schedule);
    res.json(schedule);
  }),
);

// --- SHIFTS (ASIGNACIONES) ---

// Listar turnos asignados
router.get(
  "/assignments",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const repo = AppDataSource.getRepository(Shift);
    const assignments = await repo.find({
      where: { companyId: auth.companyId },
      relations: ["user", "schedule"],
    });
    res.json({ data: assignments });
  }),
);

// Asignar turno a empleado
router.post(
  "/assign",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    if (auth.role !== "admin" && auth.role !== "manager") {
      res
        .status(403)
        .json({ error: "No tienes permisos para asignar turnos." });
      return;
    }

    const parse = assignShiftSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json(buildValidationError(parse.error));
      return;
    }

    const { userId, scheduleId, startDate, endDate } = parse.data;

    // Verificar que el usuario y el horario existan y pertenezcan a la empresa
    const userRepo = AppDataSource.getRepository(User);
    const scheduleRepo = AppDataSource.getRepository(Schedule);

    const [user, schedule] = await Promise.all([
      userRepo.findOneBy({ uid: userId, companyId: auth.companyId }),
      scheduleRepo.findOneBy({ id: scheduleId, companyId: auth.companyId }),
    ]);

    if (!user || !schedule) {
      res.status(404).json({ error: "Usuario o horario no encontrado." });
      return;
    }

    const shiftRepo = AppDataSource.getRepository(Shift);
    const shift = shiftRepo.create({
      userId,
      scheduleId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      companyId: auth.companyId,
    });

    await shiftRepo.save(shift);
    res.status(201).json(shift);
  }),
);

export default router;
