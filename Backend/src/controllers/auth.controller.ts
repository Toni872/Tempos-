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

    if (!user && firebaseUser.email) {
      // Comprobar si existe por Email (fue creado por un admin previamente)
      user = await userRepository.findOne({
        where: { email: firebaseUser.email },
      });
      if (user) {
        // Vincular el UID de Firebase al registro existente
        user.uid = firebaseUser.uid;
        user.emailVerified = firebaseUser.email_verified;
        await userRepository.save(user);

        res.status(200).json({
          message: "Usuario vinculado correctamente",
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          },
        });
        return;
      }
    }

    if (user) {
      res.status(409).json({ error: "Usuario ya registrado o vinculado" });
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

    // Crear nuevo usuario
    user = userRepository.create({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.name || firebaseUser.email,
      emailVerified: firebaseUser.email_verified,
      companyId: companyId,
      role: requestedRole,
      metadata: {
        createdAt: new Date().toISOString(),
        companyName: bodyParams.companyName || "",
      },
    });

    await userRepository.save(user);

    res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
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

    res.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      role: user.role,
      companyId: user.companyId,
      status: user.status,
      createdAt: user.createdAt,
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

    user.displayName = displayName;

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

export default router;
