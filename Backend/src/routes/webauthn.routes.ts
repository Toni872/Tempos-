import { Router } from "express";
import { firebaseAuthMiddleware as requireAuth } from "../middleware/auth.middleware.js";
import {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
} from "../controllers/webauthn.controller.js";

const router = Router();

// Endpoint para obtener opciones de registro (requiere que el usuario esté logueado)
router.get(
  "/generate-registration-options",
  requireAuth,
  getRegistrationOptions,
);

// Endpoint para verificar el registro de un nuevo dispositivo (requiere auth)
router.post("/verify-registration", requireAuth, verifyRegistration);

// Endpoints para autenticarse (No requieren auth, sirven para hacer el login / fichar)
router.get("/generate-authentication-options", getAuthenticationOptions);
router.post("/verify-authentication", verifyAuthentication);

export default router;
