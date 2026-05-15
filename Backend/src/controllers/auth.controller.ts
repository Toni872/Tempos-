import { Router, Request, Response } from "express";
import { AppDataSource } from "../database.js";
import { User, type UserRole } from "../entities/User.js";
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
  updateAuthProfileSchema,
} from "../utils/validation.js";
import { randomUUID } from "crypto";
import { EmailService } from "../services/EmailService.js";

const router = Router();

/**
 * POST /api/v1/auth/register
 * Registra nuevo usuario desde Firebase
 */
router.post(
  "/register",
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const userRepository = AppDataSource.getRepository(User);

    // Comprobar si existe por UID (login recurrente)
    let user = await userRepository.findOne({
      where: { uid: firebaseUser.uid },
    });

    // DEBUG: Ver qué recibimos de Firebase
    console.log("DEBUG [AUTH]: Firebase User Data ->", {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.name,
      picture: firebaseUser.picture,
    });

    if (!user && firebaseUser.email) {
      // Comprobar si existe por Email (fue creado por un admin previamente)
      user = await userRepository.findOne({
        where: { email: firebaseUser.email },
      });
      if (user) {
        // Vincular el UID de Firebase al registro existente
        user.uid = firebaseUser.uid;
        user.emailVerified = firebaseUser.email_verified;

        // Mejorar el nombre si venía por defecto o era un email
        if (
          firebaseUser.name &&
          (!user.displayName ||
            user.displayName === "Usuario" ||
            user.displayName.includes("@"))
        ) {
          user.displayName = firebaseUser.name;
        }

        // Sincronizar siempre la foto de perfil más reciente de Google
        if (firebaseUser.picture) {
          user.photoURL = firebaseUser.picture;
        }

        await userRepository.save(user);

        res.status(200).json({
          message: "Usuario vinculado correctamente",
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          },
        });
        return;
      }
    }

    if (user) {
      // Si el usuario existe en la BD pero estamos aquí, es que viene de un registro limpio de Firebase.
      // Vamos a actualizarlo con el nuevo UID para permitir el acceso.
      user.uid = firebaseUser.uid;
      user.emailVerified = firebaseUser.email_verified;
      user.role = requestedRole;
      user.displayName = bodyParams.name || user.displayName;
      user.metadata = {
        ...user.metadata,
        createdAt: new Date().toISOString(),
        phone: bodyParams.phone || user.metadata?.phone || "",
        isTrial: requestedRole === "admin",
        trialExpiresAt: requestedRole === "admin" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : undefined
      };
      
      await userRepository.save(user);
      
      if (requestedRole === "admin") {
        try {
          await EmailService.sendTrialWelcome(user.email, user.displayName || "Usuario");
        } catch (emailErr) {
          console.error("⚠️ Error al enviar email de bienvenida:", emailErr);
        }
      }

      res.status(200).json({
        message: "Usuario reactivado correctamente",
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        },
      });
      return;
    }

    const bodyParams = req.body || {};
    // Prioridad: 1. Role en el body | 2. Role en el token de Firebase | 3. Default a employee
    let requestedRole: UserRole = "employee";

    if (
      bodyParams.role === "admin" ||
      firebaseUser.admin === true ||
      firebaseUser.role === "admin"
    ) {
      requestedRole = "admin";
    }
    let companyId = DEFAULT_COMPANY_ID;

    if (requestedRole === "admin") {
      const companyName =
        typeof bodyParams.companyName === "string"
          ? bodyParams.companyName.trim()
          : "";
      const slug = companyName
        ? companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : "company";
      companyId = `${slug}-${randomUUID().slice(0, 8)}`;
    }

    // Vincular dispositivo si viene en el body (primer login nativo)
    const deviceId =
      typeof bodyParams.deviceId === "string"
        ? bodyParams.deviceId.trim()
        : undefined;
    const finalDisplayName =
      bodyParams.name || firebaseUser.name || firebaseUser.email || "Usuario";

    // Crear nuevo usuario
    user = userRepository.create({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: finalDisplayName,
      photoURL: firebaseUser.picture || undefined,
      emailVerified: firebaseUser.email_verified,
      companyId: companyId,
      role: requestedRole,
      authorizedDeviceId: deviceId,
      metadata: {
        createdAt: new Date().toISOString(),
        companyName: bodyParams.companyName || "",
        phone: bodyParams.phone || "",
        isTrial: requestedRole === "admin",
        trialExpiresAt: requestedRole === "admin" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : undefined
      },
    });

    await userRepository.save(user);

    // Si es un administrador nuevo (Trial), enviar email premium de bienvenida
    if (requestedRole === "admin") {
      try {
        await EmailService.sendTrialWelcome(user.email, user.displayName || "Usuario");
      } catch (emailErr) {
        console.error("⚠️ Error al enviar email de bienvenida:", emailErr);
      }
    }

    res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
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
      status: user.status,
      photoURL: user.photoURL,
      createdAt: user.createdAt,
      hasDeviceBound: !!user.authorizedDeviceId,
      requiresGeolocation: user.requiresGeolocation,
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

export default router;
