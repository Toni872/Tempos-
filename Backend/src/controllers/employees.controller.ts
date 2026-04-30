import { Router, Request, Response } from "express";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";
import { firebaseAuthMiddleware } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { logAction } from "../utils/auditLog.js";
import {
  appUserContextMiddleware,
  getAuthContext,
  requirePermission,
} from "../middleware/request-context.middleware.js";
import {
  buildValidationError,
  createEmployeeSchema,
  updateEmployeeSchema,
} from "../utils/validation.js";
import { randomUUID } from "crypto";

const router = Router();

/**
 * GET /api/v1/employees
 * List all active/suspended employees in the same company.
 * Requires 'view_employees' permission.
 */
router.get(
  "/",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!requirePermission(req, res, "view_employees")) return;

    const auth = getAuthContext(req);
    const userRepository = AppDataSource.getRepository(User);

    const { search, role, status } = req.query;
    console.log(
      `[Employees] Listing for company: ${auth.companyId}, search: ${search}, role: ${role}`,
    );

    const query = userRepository
      .createQueryBuilder("user")
      .where("user.companyId = :companyId", { companyId: auth.companyId });

    if (status && typeof status === "string") {
      query.andWhere("user.status = :status", { status });
    } else {
      query.andWhere("user.status != :status", { status: "deleted" });
    }

    if (role && typeof role === "string") {
      query.andWhere("user.role = :role", { role });
    }

    if (search && typeof search === "string") {
      query.andWhere(
        "(user.displayName ILIKE :search OR user.email ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    const employees = await query.orderBy("user.displayName", "ASC").getMany();

    const employeeUids = employees.map((e) => e.uid);
    let activeUserIds = new Set<string>();

    if (employeeUids.length > 0) {
      const todayIso = new Date().toISOString().split("T")[0];
      const activeFichas = await AppDataSource.getRepository("Ficha")
        .createQueryBuilder("ficha")
        .where("ficha.userId IN (:...uids)", { uids: employeeUids })
        .andWhere("ficha.date = :todayIso", { todayIso })
        .andWhere("ficha.endTime IS NULL")
        .getMany();

      activeUserIds = new Set(activeFichas.map((f: any) => f.userId));
    }

    res.json({
      data: employees.map((e) => ({
        uid: e.uid,
        email: e.email,
        displayName: e.displayName,
        role: e.role,
        status: e.status,
        createdAt: e.createdAt,
        isWorking: activeUserIds.has(e.uid),
        hourlyRate: e.hourlyRate,
        overtimeRate: e.overtimeRate,
        requiresGeolocation: e.requiresGeolocation,
        requiresQR: e.requiresQR,
        kioskPin: e.kioskPin,
      })),
    });
  }),
);

/**
 * POST /api/v1/employees
 * Create a new employee record.
 * Generates a placeholder UID until the user logs in via Firebase.
 */
router.post(
  "/",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!requirePermission(req, res, "create_employee")) return;

    const auth = getAuthContext(req);
    const parsed = createEmployeeSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }

    const userRepository = AppDataSource.getRepository(User);

    // Check if email already taken
    const existing = await userRepository.findOne({
      where: { email: parsed.data.email },
    });
    if (existing) {
      res
        .status(409)
        .json({ error: "Ya existe un usuario con este correo electrónico." });
      return;
    }

    const employee = userRepository.create({
      uid: `temp_${randomUUID()}`, // Placeholder UID
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      role: parsed.data.role,
      companyId: auth.companyId,
      status: "active",
      hourlyRate: parsed.data.hourlyRate ?? 0,
      overtimeRate: parsed.data.overtimeRate ?? 0,
      requiresGeolocation: parsed.data.requiresGeolocation ?? false,
      requiresQR: parsed.data.requiresQR ?? false,
      kioskPin: parsed.data.kioskPin,
      metadata: {
        invitedBy: auth.uid,
        invitedAt: new Date().toISOString(),
      },
    });

    await userRepository.save(employee);

    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: "employee_created",
      metadata: { employeeUid: employee.uid, email: employee.email },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      message:
        "Empleado creado correctamente. El usuario podrá acceder al registrarse con este email.",
      employee: {
        uid: employee.uid,
        email: employee.email,
        displayName: employee.displayName,
        role: employee.role,
      },
    });
  }),
);

/**
 * PUT /api/v1/employees/:id
 * Update employee profile or status.
 */
router.put(
  "/:id",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!requirePermission(req, res, "update_employee")) return;

    const auth = getAuthContext(req);
    const { id: targetUid } = req.params;
    const parsed = updateEmployeeSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const employee = await userRepository.findOne({
      where: { uid: targetUid, companyId: auth.companyId },
    });

    if (!employee) {
      res
        .status(404)
        .json({ error: "Empleado no encontrado en su organización." });
      return;
    }

    // Apply changes
    if (parsed.data.displayName) employee.displayName = parsed.data.displayName;
    if (parsed.data.role) employee.role = parsed.data.role;
    if (parsed.data.status) employee.status = parsed.data.status;

    // RRHH Advanced fields
    if (parsed.data.hourlyRate !== undefined)
      employee.hourlyRate = parsed.data.hourlyRate;
    if (parsed.data.overtimeRate !== undefined)
      employee.overtimeRate = parsed.data.overtimeRate;
    if (parsed.data.requiresGeolocation !== undefined)
      employee.requiresGeolocation = parsed.data.requiresGeolocation;
    if (parsed.data.requiresQR !== undefined)
      employee.requiresQR = parsed.data.requiresQR;
    if (parsed.data.kioskPin !== undefined)
      employee.kioskPin = parsed.data.kioskPin;

    await userRepository.save(employee);

    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: "employee_updated",
      metadata: { employeeUid: targetUid, changes: parsed.data },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      message: "Empleado actualizado",
      employee: {
        uid: employee.uid,
        displayName: employee.displayName,
        role: employee.role,
        status: employee.status,
      },
    });
  }),
);

/**
 * DELETE /api/v1/employees/:id
 * Soft-delete an employee (set status to 'deleted').
 */
router.delete(
  "/:id",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!requirePermission(req, res, "delete_employee")) return;

    const auth = getAuthContext(req);
    const { id: targetUid } = req.params;

    const userRepository = AppDataSource.getRepository(User);
    const employee = await userRepository.findOne({
      where: { uid: targetUid, companyId: auth.companyId },
    });

    if (!employee) {
      res.status(404).json({ error: "Empleado no encontrado." });
      return;
    }

    employee.status = "deleted";
    await userRepository.save(employee);

    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: "employee_deleted",
      metadata: { employeeUid: targetUid },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ message: "Empleado dado de baja (marcado como eliminado)." });
  }),
);

export default router;
