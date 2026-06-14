import { Router, Request, Response } from "express";
import crypto from "crypto";
import admin from "firebase-admin";
import { AppDataSource } from "../database.js";
import { User, type UserRole } from "../entities/User.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getAuthContext } from "../middleware/request-context.middleware.js";
import {
  inviteEmployeeSchema,
  validateTokenSchema,
  activateAccountSchema,
} from "../schemas/employee-invitation.schemas.js";
import { ZodError } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateToken(): { raw: string; hash: string; expiresAt: Date } {
  const raw = crypto.randomBytes(24).toString("hex"); // 48 hex chars
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return { raw, hash, expiresAt };
}

// ─── Routers ───────────────────────────────────────────────────────────────────

export const inviteRouter = Router();
export const activationRouter = Router();

/**
 * POST /invite
 * Create a pending employee and return a one-time activation token.
 * Admin/manager only — auth middleware applied at route level.
 */
inviteRouter.post(
  "/invite",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);

    // Only admin or manager can invite
    if (auth.role !== "admin" && auth.role !== "manager") {
      res.status(403).json({
        error: "Solo administradores y managers pueden invitar empleados.",
        code: "FORBIDDEN",
      });
      return;
    }

    // Validate input
    let parsed;
    try {
      parsed = inviteEmployeeSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: "Datos de entrada inválidos.",
          code: "VALIDATION_ERROR",
          details: err.issues.map((i) => i.message),
        });
        return;
      }
      throw err;
    }

    const { email, displayName, role } = parsed;
    const userRepository = AppDataSource.getRepository(User);

    // Check email uniqueness in DB
    const existingUser = await userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      res.status(409).json({
        error: "Ya existe un usuario con este correo electrónico.",
        code: "EMAIL_EXISTS",
      });
      return;
    }

    // Check email uniqueness in Firebase Auth
    try {
      const firebaseUser = await admin.auth().getUserByEmail(email);
      if (firebaseUser) {
        res.status(409).json({
          error: "Este correo electrónico ya tiene una cuenta.",
          code: "EMAIL_EXISTS",
        });
        return;
      }
    } catch (fbErr: any) {
      // Firebase throws if user not found — that's expected and OK
      if (fbErr.code !== "auth/user-not-found") {
        console.error("[INVITE] Firebase lookup error:", fbErr);
      }
    }

    // Generate token
    const { raw, hash, expiresAt } = generateToken();

    // Create pending user with temp_ UID prefix
    const tempUid = `temp_${crypto.randomUUID()}`;
    const pendingUser = userRepository.create({
      uid: tempUid,
      email,
      displayName,
      role: role as UserRole,
      status: "pending",
      invitationToken: hash,
      invitationExpiresAt: expiresAt,
      companyId: auth.companyId,
      metadata: {
        invitedBy: auth.uid,
        invitedAt: new Date().toISOString(),
        companyName: undefined,
      },
    });

    await userRepository.save(pendingUser);

    res.status(201).json({
      employeeId: pendingUser.uid,
      email: pendingUser.email,
      displayName: pendingUser.displayName,
      token: raw,
      expiresAt: expiresAt.toISOString(),
    });
  }),
);

/**
 * POST /validate-token
 * Validate an activation token and return user info if valid.
 * Public endpoint — rate limited.
 */
activationRouter.post(
  "/validate-token",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    let parsed;
    try {
      parsed = validateTokenSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          valid: false,
          error: "Código inválido. Revisalo e intentá de nuevo.",
          code: "INVALID_TOKEN_FORMAT",
        });
        return;
      }
      throw err;
    }

    const { token } = parsed;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { invitationToken: tokenHash },
    });

    if (!user) {
      res.status(404).json({
        valid: false,
        error: "Código inválido. Revisalo e intentá de nuevo.",
        code: "INVALID_TOKEN_FORMAT",
      });
      return;
    }

    // Check if already activated
    if (user.status !== "pending" || user.activatedAt || !user.invitationToken) {
      res.status(410).json({
        valid: false,
        error: "Este código ya fue usado. Intentá iniciar sesión.",
        code: "TOKEN_ALREADY_USED",
      });
      return;
    }

    // Check if expired
    if (user.invitationExpiresAt && new Date() > user.invitationExpiresAt) {
      res.status(410).json({
        valid: false,
        error: "Este código expiró. Pedile uno nuevo a tu administrador.",
        code: "TOKEN_EXPIRED",
      });
      return;
    }

    res.json({
      valid: true,
      email: user.email,
      displayName: user.displayName,
    });
  }),
);

/**
 * POST /activate
 * Activate a pending employee account: create Firebase Auth account + update user.
 * Public endpoint — register rate limited.
 */
activationRouter.post(
  "/activate",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    let parsed;
    try {
      parsed = activateAccountSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: "Datos de entrada inválidos.",
          code: "VALIDATION_ERROR",
          details: err.issues.map((i) => i.message),
        });
        return;
      }
      throw err;
    }

    const { token, password } = parsed;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { invitationToken: tokenHash },
    });

    if (!user) {
      res.status(404).json({
        error: "Código inválido. Revisalo e intentá de nuevo.",
        code: "INVALID_TOKEN_FORMAT",
      });
      return;
    }

    // Re-validate
    if (user.status !== "pending" || user.activatedAt) {
      res.status(410).json({
        error: "Este código ya fue usado. Intentá iniciar sesión.",
        code: "TOKEN_ALREADY_USED",
      });
      return;
    }

    if (user.invitationExpiresAt && new Date() > user.invitationExpiresAt) {
      res.status(410).json({
        error: "Este código expiró. Pedile uno nuevo a tu administrador.",
        code: "TOKEN_EXPIRED",
      });
      return;
    }

    // Create Firebase Auth account
    let firebaseUser: admin.auth.UserRecord;
    try {
      firebaseUser = await admin.auth().createUser({
        email: user.email,
        password,
        displayName: user.displayName,
        emailVerified: false,
      });
    } catch (fbErr: any) {
      console.error("[ACTIVATE] Firebase createUser error:", fbErr);

      // If email already exists in Firebase, provide a clear error
      if (fbErr.code === "auth/email-already-exists") {
        res.status(409).json({
          error: "Este correo electrónico ya tiene una cuenta. Intentá iniciar sesión.",
          code: "EMAIL_EXISTS",
        });
        return;
      }

      // Generic Firebase failure — user stays pending, token NOT cleared
      res.status(502).json({
        error: "Error al crear la cuenta. Intentá de nuevo más tarde.",
        code: "ACTIVATION_SERVICE_UNAVAILABLE",
      });
      return;
    }

    // Update user record — status=active, clear token, set activatedAt + Firebase UID
    const now = new Date();
    await userRepository.update(
      { uid: user.uid },
      {
        uid: firebaseUser.uid,
        status: "active",
        invitationToken: null as any,
        invitationExpiresAt: null as any,
        activatedAt: now,
        emailVerified: false,
      },
    );

    res.json({
      success: true,
      email: user.email,
    });
  }),
);
