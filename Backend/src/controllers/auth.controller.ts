import { Router, Request, Response } from "express";
import { z } from "zod";
import admin from "firebase-admin";
import { AppDataSource } from "../database.js";
import { User, type UserRole } from "../entities/User.js";
import { EmailVerification } from "../entities/EmailVerification.js";
import {
  firebaseAuthMiddleware,
  DEFAULT_COMPANY_ID,
} from "../middleware/auth.middleware.js";
import {
  appUserContextMiddleware,
  getAuthContext,
} from "../middleware/request-context.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  buildValidationError,
  isFreeEmail,
  registerSchema,
  updateAuthProfileSchema,
} from "../utils/validation.js";
import { Like, MoreThanOrEqual } from "typeorm";
import { randomBytes, randomUUID } from "crypto";
import { EmailService } from "../services/EmailService.js";
import { registerRateLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

/**
 * POST /api/v1/auth/register
 * Registra nuevo usuario desde Firebase
 */
router.post(
  "/register",
  registerRateLimiter,
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const userRepository = AppDataSource.getRepository(User);

    // Comprobar si existe por UID (login recurrente)
    let user = await userRepository.findOne({
      where: { uid: firebaseUser.uid },
    });

    if (user) {
      res.status(409).json({ message: "El usuario ya está registrado", data: { uid: user.uid } });
      return;
    }

    // DEBUG: Ver qué recibimos de Firebase
    console.log("DEBUG [AUTH]: Firebase User Data ->", {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.name,
      picture: firebaseUser.picture,
    });

    if (!user && firebaseUser.email) {
      const normalizedEmail = firebaseUser.email.toLowerCase();
      // Comprobar si existe por Email (fue creado por un admin previamente)
      user = await userRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (user) {
        const oldUid = user.uid;

        // Si mismo UID, actualizar metadata y devolver
        if (oldUid === firebaseUser.uid) {
          user.emailVerified = firebaseUser.email_verified ?? user.emailVerified;
          if (
            firebaseUser.name &&
            (!user.displayName ||
              user.displayName === "Usuario" ||
              user.displayName.includes("@"))
          ) {
            user.displayName = firebaseUser.name;
          }
          if (firebaseUser.picture) {
            user.photoURL = firebaseUser.picture;
          }
          await userRepository.save(user);
          res.status(200).json({
            message: "Usuario ya registrado",
            data: {
              uid: user.uid,
              email: user.email,
              role: user.role,
              companyId: user.companyId,
              isTrial: user.isTrial,
              status: user.status,
            },
          });
          return;
        }

        // UID DISTINTO: marcamos para re-link (no borramos todavía).
        // Haremos la eliminación y creación del nuevo usuario dentro de
        // una transacción más abajo para asegurar atomicidad.
        console.log(
          `🔄 [AUTH] Re-link requested ${user.email}: ${oldUid} → ${firebaseUser.uid}`,
        );
        // Guardamos el UID antiguo para procesarlo tras construir el nuevo usuario
        (req as any).relinkOldUid = oldUid;
        user = null as any; // Cae al flujo de creación de usuario nuevo
      }
    }

    // Parse request body with Zod schema
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }
    const body = parsed.data;

    // Si no existe en BD ni por UID ni por email, solo admins pueden auto-registrarse.
    // Si es employee, verificar si fue creado por un admin (temp_ UID + status pending)
    if (!user && firebaseUser.email) {
      const isAdmin = body.role === "admin" || (firebaseUser as any).admin === true;

      if (!isAdmin) {
        const tempPendingUser = await userRepository.findOne({
          where: {
            email: firebaseUser.email.toLowerCase(),
            status: "pending",
            uid: Like("temp_%"),
          },
        });

        if (tempPendingUser) {
          (req as any).relinkOldUid = tempPendingUser.uid;
          user = null as any;
        } else {
          res.status(404).json({ error: "No tienes una cuenta registrada. Contactá a tu administrador." });
          return;
        }
      }
    }

    // Prioridad: 1. Role en el body | 2. Role en el token de Firebase | 3. Default a employee
    let requestedRole: UserRole = "employee";

    if (
      body.role === "admin" ||
      firebaseUser.admin === true ||
      firebaseUser.role === "admin"
    ) {
      requestedRole = "admin";
    }

    // ── Domain validation for admin registration ──────────────
    const DEV_BYPASS_UIDS = ["dev-admin-uid", "dev-employee-uid"];
    const skipDomainCheck =
      process.env.NODE_ENV === "development" ||
      firebaseUser.uid.startsWith("temp_") ||
      DEV_BYPASS_UIDS.includes(firebaseUser.uid);

    let registrationStatus: "active" | "pending" = "active";
    const companyDomain =
      typeof body.companyDomain === "string"
        ? body.companyDomain.trim()
        : "";
    if (requestedRole === "admin" && !skipDomainCheck) {
      // Free email domains are not allowed for admin registration
      const email = firebaseUser.email ?? "";
      if (isFreeEmail(email)) {
        res.status(400).json({
          error: "free_email_not_allowed",
          message: "No puedes registrarte con un email gratuito. Usá un email corporativo.",
        });
        return;
      }

      const emailDomain = email.split("@")[1]?.toLowerCase();
      if (!companyDomain || (emailDomain && emailDomain !== companyDomain.toLowerCase())) {
        registrationStatus = "pending";
      }
    }

    let companyId = DEFAULT_COMPANY_ID;

    if (requestedRole === "admin") {
      const companyName =
        typeof body.companyName === "string"
          ? body.companyName.trim()
          : "";
      const slug = companyName
        ? companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : "company";
      companyId = `${slug}-${randomUUID().slice(0, 8)}`;
    }

    // Vincular dispositivo si viene en el body (primer login nativo)
    const deviceId =
      typeof body.deviceId === "string"
        ? body.deviceId.trim()
        : undefined;
    const finalDisplayName =
      body.name || firebaseUser.name || firebaseUser.email || "Usuario";

    // Crear nuevo usuario
    const relinkOldUid = (req as any).relinkOldUid as string | undefined;

    user = userRepository.create({
      uid: firebaseUser.uid,
      email: firebaseUser.email?.toLowerCase() ?? '',
      displayName: finalDisplayName,
      photoURL: firebaseUser.picture || undefined,
      emailVerified: firebaseUser.email_verified,
      companyId: companyId,
      role: requestedRole,
      status: registrationStatus,
      authorizedDeviceId: deviceId,
      companyDomain: companyDomain || undefined,
      isTrial: requestedRole === "admin",
      trialExpiresAt: requestedRole === "admin" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : undefined,
      metadata: {
        createdAt: new Date().toISOString(),
        linkedFromUid: relinkOldUid ?? undefined,
        companyName: body.companyName || "",
        phone: body.phone || "",
      },
    });

    // Si es re-link, preservar propiedades del usuario antiguo (no crear desde cero)
    if (relinkOldUid) {
      const oldUser = await userRepository.findOne({ where: { uid: relinkOldUid } });
      if (oldUser) {
        user.companyId = oldUser.companyId;
        user.role = oldUser.role;
        user.status = "active"; // Re-link: el usuario ya pasó el registro, forzar activo
        user.isTrial = oldUser.isTrial;
        user.isTrial = oldUser.isTrial;
        user.trialExpiresAt = oldUser.trialExpiresAt;
        user.stripeCustomerId = oldUser.stripeCustomerId;
        user.stripeSubscriptionId = oldUser.stripeSubscriptionId;
        user.subscriptionPlan = oldUser.subscriptionPlan;
        user.subscriptionStatus = oldUser.subscriptionStatus;
        user.hasAcceptedTerms = oldUser.hasAcceptedTerms;
        user.acceptedTermsAt = oldUser.acceptedTermsAt;
        user.hasAutoClock = oldUser.hasAutoClock;
        user.isAutoClockEnabled = oldUser.isAutoClockEnabled;
        user.hourlyRate = oldUser.hourlyRate;
        user.overtimeRate = oldUser.overtimeRate;
        user.requiresGeolocation = oldUser.requiresGeolocation;
        user.requiresQR = oldUser.requiresQR;
        user.kioskPin = oldUser.kioskPin;
        user.authorizedDeviceId = oldUser.authorizedDeviceId;
        user.metadata = {
          ...(oldUser.metadata || {}),
          createdAt: oldUser.metadata?.createdAt ?? new Date().toISOString(),
          linkedFromUid: relinkOldUid,
          companyName: body.companyName || oldUser.metadata?.companyName || "",
          phone: body.phone || oldUser.metadata?.phone || "",
        };
      }
    }

    // --- RE-LINK: UPDATE-based en lugar de DELETE + re-create ---
    // Descubre FKs dinámicamente via information_schema y re-apunta TODAS
    // las referencias al nuevo UID. NO depende de ON DELETE CASCADE en la BD.
    if (relinkOldUid) {
      try {
        await AppDataSource.manager.transaction(async (manager) => {
          // 1. Descubrir TODAS las FK → users(uid) dinámicamente
          const fks: Array<{ table_name: string; column_name: string }> = await manager.query(
            `SELECT tc.table_name::text AS table_name,
                    kcu.column_name::text AS column_name
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu
               ON tc.constraint_name = kcu.constraint_name
               AND tc.table_catalog = kcu.table_catalog
               AND tc.table_schema = kcu.table_schema
             JOIN information_schema.constraint_column_usage ccu
               ON tc.constraint_name = ccu.constraint_name
               AND tc.table_catalog = ccu.table_catalog
               AND tc.table_schema = ccu.table_schema
             WHERE tc.constraint_type = 'FOREIGN KEY'
               AND ccu.table_name = 'users'
               AND ccu.column_name = 'uid'`
          );

          // ORDEN: 1) liberar email UNIQUE  2) INSERT new user  3) UPDATE children  4) DELETE old user
          // El viejo user tiene el mismo email → hay que liberarlo ANTES del INSERT.
          const txRepo = manager.getRepository(User);
          if (!user) throw new Error("Estado inválido: user es null durante re-link");
          const tempEmail = `relinked_${user.email.replace(/[@.]/g, '_')}_${randomUUID().slice(0, 8)}`;

          // 2. Liberar el email del usuario antiguo (temp único → no choca UNIQUE)
          await manager.query(
            `UPDATE "users" SET "email" = $1 WHERE "uid" = $2`,
            [tempEmail, relinkOldUid]
          );

          // 3. INSERTAR el nuevo usuario (el email original ya está libre → UNIQUE ok)
          await txRepo.save(user);

          // 4. Re-apuntar TODAS las referencias hijas al nuevo UID
          for (const fk of fks) {
            const tbl = `"${fk.table_name.replace(/"/g, '""')}"`;
            const col = `"${fk.column_name.replace(/"/g, '""')}"`;
            await manager.query(
              `UPDATE ${tbl} SET ${col} = $1 WHERE ${col} = $2`,
              [firebaseUser.uid, relinkOldUid]
            );
          }

          // 5. Eliminar el usuario antiguo (ya nadie lo referencia, email liberado)
          await txRepo.delete({ uid: relinkOldUid });
        });

        // Recargar el usuario actualizado desde la BD para el resto del flujo
        user = await userRepository.findOne({ where: { uid: firebaseUser.uid } });
        if (!user) {
          res.status(500).json({ error: "Error al re-linkear usuario. Contactá a soporte." });
          return;
        }
      } catch (saveErr: unknown) {
        console.error("❌ [AUTH ERROR] Error crítico al re-linkear usuario:", saveErr);
        const err = saveErr as any;
        if (err?.code === "ER_DUP_ENTRY" || err?.code === "23505") {
          res.status(409).json({ error: "Este usuario ya está registrado." });
          return;
        }
        throw saveErr;
      }
    } else {
      try {
        await userRepository.save(user);
      } catch (saveErr: unknown) {
        console.error("❌ [AUTH ERROR] Error crítico al guardar usuario:", saveErr);
        const err = saveErr as any;
        if (err?.code === "ER_DUP_ENTRY" || err?.code === "23505") {
          res.status(409).json({ error: "Este usuario ya está registrado." });
          return;
        }
        throw saveErr;
      }
    }

    // Si el registro quedó pendiente, notificar al equipo de Tempos
    if (registrationStatus === "pending") {
      try {
        await EmailService.sendPendingApproval(
          user.email,
          user.displayName || "Usuario",
          companyDomain || "No proporcionado",
        );
      } catch (emailErr) {
        console.error("⚠️ Error al enviar notificación de registro pendiente:", emailErr);
      }
    }

    // Si es un administrador nuevo (Trial), enviar email premium de bienvenida
    if (requestedRole === "admin") {
      try {
        await EmailService.sendTrialWelcome(user.email, user.displayName || "Usuario");
      } catch (emailErr) {
        console.error("⚠️ Error al enviar email de bienvenida:", emailErr);
      }
    }

    res.status(201).json({
      message: "Registro exitoso",
      data: {
        uid: user.uid,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        isTrial: user.isTrial,
        status: user.status,
      },
    });
  }),
);

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get(
  "/me",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    
    if (!auth?.uid) {
      res.status(503).json({ error: "Servicio temporalmente no disponible. Inténtalo de nuevo." });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { uid: auth.uid },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // --- AUTO-SYNC GOOGLE METADATA ---
    // Si el usuario tiene el nombre genérico o no tiene foto, y el token de Firebase nos da mejores datos, actualizamos.
    const firebaseUser = (req as any).firebaseUser;
    let needsUpdate = false;

    if (
      firebaseUser?.name &&
      (!user.displayName ||
        user.displayName === "Usuario" ||
        user.displayName.includes("@"))
    ) {
      user.displayName = firebaseUser.name;
      needsUpdate = true;
    }

    if (
      firebaseUser?.picture &&
      (!user.photoURL || user.photoURL.includes("default-avatar"))
    ) {
      user.photoURL = firebaseUser.picture;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await userRepository.save(user);
      console.log(
        `✅ [AUTH] Perfil sincronizado para ${user.email} (${user.displayName})`,
      );
    }
    // ---------------------------------

    res.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      role: user.role,
      companyId: user.companyId,
      companyName: user.metadata?.companyName || user.companyId,
      status: user.status,
      photoURL: user.photoURL,
      createdAt: user.createdAt,
      hasDeviceBound: !!user.authorizedDeviceId,
      requiresGeolocation: user.requiresGeolocation,
      isTrial: user.isTrial,
      trialExpiresAt: user.trialExpiresAt,
      isTrialExpired: user.trialExpiresAt ? new Date() > user.trialExpiresAt : false,
      features: auth.features,
    });
  }),
);

/**
 * PUT /api/v1/auth/profile
 * Update user profile
 */
router.put(
  "/profile",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const parsedBody = updateAuthProfileSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json(buildValidationError(parsedBody.error));
      return;
    }

    const { displayName } = parsedBody.data;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { uid: auth.uid },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    if (displayName) user.displayName = displayName;
    if (req.body.photoURL !== undefined) user.photoURL = req.body.photoURL;

    await userRepository.save(user);

    res.json({
      message: "Perfil actualizado",
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
    });
  }),
);

/**
 * POST /api/v1/auth/accept-terms
 * Marca al usuario como que ha aceptado los términos legales
 */
router.post(
  "/accept-terms",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { uid: auth.uid },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    user.hasAcceptedTerms = true;
    user.acceptedTermsAt = new Date();

    await userRepository.save(user);

    res.json({
      success: true,
      message: "Términos legales aceptados correctamente",
      acceptedAt: user.acceptedTermsAt,
    });
  }),
);

/**
 * POST /api/v1/auth/bind-device
 * Vincula un dispositivo físico al usuario (una sola vez).
 * Si ya tiene uno vinculado, verifica que coincida.
 */
router.post(
  "/bind-device",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { deviceId } = req.body;

    if (
      !deviceId ||
      typeof deviceId !== "string" ||
      deviceId.trim().length < 8
    ) {
      res.status(400).json({ error: "ID de dispositivo inválido." });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { uid: auth.uid } });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // Si ya tiene un dispositivo vinculado
    if (user.authorizedDeviceId) {
      if (user.authorizedDeviceId === deviceId.trim()) {
        res.json({
          status: "already_bound",
          message: "Este dispositivo ya está vinculado.",
        });
      } else {
        res.status(403).json({
          error: "DEVICE_MISMATCH",
          message:
            "Tu cuenta ya está vinculada a otro dispositivo. Contacta con tu administrador.",
        });
      }
      return;
    }

    // Primer vínculo
    user.authorizedDeviceId = deviceId.trim();
    await userRepository.save(user);

    res.json({
      status: "bound",
      message:
        "Dispositivo vinculado correctamente. Solo podrás fichar desde este móvil.",
    });
  }),
);

/**
 * POST /api/v1/auth/unbind-device
 * Solo administradores pueden desvincular el dispositivo de un empleado.
 */
router.post(
  "/unbind-device",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);

    if (!auth.isPrivileged) {
      res
        .status(403)
        .json({
          error: "Solo administradores pueden desvincular dispositivos.",
        });
      return;
    }

    const { targetUid } = req.body;
    if (!targetUid) {
      res
        .status(400)
        .json({ error: "Debes especificar el UID del empleado (targetUid)." });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const targetUser = await userRepository.findOne({
      where: { uid: targetUid, companyId: auth.companyId },
    });

    if (!targetUser) {
      res.status(404).json({ error: "Empleado no encontrado en tu empresa." });
      return;
    }

    targetUser.authorizedDeviceId = undefined;
    await userRepository.save(targetUser);

    res.json({
      message: `Dispositivo desvinculado para ${targetUser.displayName || targetUser.email}.`,
    });
  }),
);

/**
 * POST /api/v1/auth/dev-upgrade
 * Simula la actualización a un plan (Solo para desarrollo)
 */
router.post(
  "/dev-upgrade",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { planId } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { uid: auth.uid },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    user.subscriptionPlan = planId || "business";
    user.subscriptionStatus = "active";
    await userRepository.save(user);

    res.json({
      message: `Plan simulado actualizado a ${user.subscriptionPlan}`,
      user: {
        uid: user.uid,
        subscriptionPlan: user.subscriptionPlan,
      },
    });
  }),
);

/**
 * POST /api/v1/auth/validate-registration
 * Valida los datos de registro ANTES de crear el usuario en Firebase.
 * No crea nada, solo valida. Previene Firebase users huérfanos.
 */
const validateRegistrationSchema = z.object({
  email: z.string().email("Introduce un email profesional válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  companyName: z.string().min(2, "Nombre de empresa demasiado corto").max(200, "Nombre de empresa demasiado largo"),
  phone: z.string().min(6, "Introduce un teléfono válido."),
  firstName: z.string().min(1, "El nombre es obligatorio."),
  lastName: z.string().min(1, "Los apellidos son obligatorios."),
});

router.post(
  "/validate-registration",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parseResult = validateRegistrationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "validation_error",
        details: parseResult.error.issues.map(i => i.message),
      });
      return;
    }

    // Check free email
    if (isFreeEmail(parseResult.data.email)) {
      res.status(400).json({
        error: "free_email_not_allowed",
        details: ["No puedes registrarte con un email gratuito. Usá un email corporativo."],
      });
      return;
    }

    // All validations passed
    res.json({ valid: true });
  }),
);

/**
 * POST /api/v1/auth/request-verification
 * Genera un token propio de verificación y envía email desde nuestro dominio (Resend).
 * No usa Firebase para el link de verificación — todo es nuestro.
 */
router.post(
  "/request-verification",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email requerido." });
      return;
    }

    const apiUrl = process.env.API_URL || "http://localhost:8081";
    const emailVerificationRepo = AppDataSource.getRepository(EmailVerification);

    // Obtener el UID de Firebase del usuario ya existente (creado por TrialPage antes de llamar a este endpoint)
    let firebaseUid: string;
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      firebaseUid = userRecord.uid;
    } catch (err: any) {
      console.error("❌ [AUTH] No se encontró usuario de Firebase para:", email, err.message);
      res.status(400).json({ error: "No se encontró un usuario de Firebase para este email. Regístrate primero." });
      return;
    }

    // Invalidar tokens anteriores no usados para este email
    await emailVerificationRepo.update(
      { email, used: false },
      { used: true }
    );

    // Generar token seguro
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Guardar token en BD
    const verification = emailVerificationRepo.create({
      uid: firebaseUid,
      email,
      token,
      expiresAt,
      used: false,
    });
    await emailVerificationRepo.save(verification);

    // Generar enlace de verificación apuntando a nuestro backend
    const verificationLink = `${apiUrl}/api/v1/auth/verify?token=${token}`;

    // Enviar email vía Resend con nuestro template
    await EmailService.sendVerificationEmail(email, verificationLink);

    res.json({ ok: true });
  }),
);

/**
 * GET /api/v1/auth/verify?token=xxx
 * Valida el token propio, marca email como verificado en Firebase,
 * y redirige al login. Todo sin depender de Firebase para el flujo de email.
 */
router.get(
  "/verify",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (!token || typeof token !== "string") {
      res.redirect(`${frontendUrl}/verify-email?error=invalid`);
      return;
    }

    const emailVerificationRepo = AppDataSource.getRepository(EmailVerification);

    // Buscar token válido
    const verification = await emailVerificationRepo.findOne({
      where: {
        token,
        used: false,
        expiresAt: MoreThanOrEqual(new Date()),
      },
    });

    if (!verification) {
      console.error("❌ [AUTH] Token de verificación inválido o expirado:", token);
      res.redirect(`${frontendUrl}/verify-email?error=expired`);
      return;
    }

    try {
      // Marcar email como verificado en Firebase usando Admin SDK (sin restricciones de referer)
      await admin.auth().updateUser(verification.uid, { emailVerified: true });

      // Marcar token como usado
      verification.used = true;
      await emailVerificationRepo.save(verification);

      console.log(`✅ [AUTH] Email verificado para uid=${verification.uid}, email=${verification.email}`);
      res.redirect(`${frontendUrl}/login?verified=1`);
    } catch (err: any) {
      console.error("❌ [AUTH] Error actualizando usuario en Firebase:", err);
      res.redirect(`${frontendUrl}/verify-email?error=invalid`);
    }
  }),
);

export default router;
