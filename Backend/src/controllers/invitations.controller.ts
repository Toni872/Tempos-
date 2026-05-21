import { Router, Request, Response } from "express";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * GET /api/v1/invitations/:token
 * Validate an invitation token and return invitation details.
 * Public endpoint — no auth required (the invited user doesn't have an account yet).
 */
router.get(
  "/:token",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;

    if (!token || typeof token !== "string" || token.length < 8) {
      res.status(404).json({
        valid: false,
        error: "Invitación no encontrada.",
      });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { invitationToken: token },
    });

    if (!user) {
      res.status(404).json({
        valid: false,
        error: "Invitación no encontrada. Verificá que el enlace sea correcto.",
      });
      return;
    }

    // Check if already registered (token already cleared)
    if (!user.invitationToken) {
      res.status(410).json({
        valid: false,
        error: "Esta invitación ya fue utilizada. Podés iniciar sesión con tu cuenta.",
      });
      return;
    }

    // Check if expired
    if (user.invitationExpiresAt && new Date() > user.invitationExpiresAt) {
      res.status(410).json({
        valid: false,
        error: "Esta invitación ha expirado. Solicita una nueva a tu administrador.",
      });
      return;
    }

    // Check if already linked (uid no longer starts with temp_)
    if (!user.uid.startsWith("temp_")) {
      res.status(410).json({
        valid: false,
        error: "Esta invitación ya fue utilizada. Podés iniciar sesión con tu cuenta.",
      });
      return;
    }

    // Obtener nombre de la empresa desde el admin que invitó
    let companyName = "tu empresa";
    if (user.metadata?.invitedBy) {
      try {
        const adminUser = await userRepository.findOne({
          where: { uid: user.metadata.invitedBy },
        });
        if (adminUser?.metadata?.companyName) {
          companyName = adminUser.metadata.companyName;
        }
      } catch {
        // Fallback al valor por defecto
      }
    }

    res.json({
      valid: true,
      displayName: user.displayName,
      email: user.email,
      companyName,
    });
  }),
);

export default router;
