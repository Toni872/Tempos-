import { z } from "zod";

/**
 * Schema for POST /api/v1/employees/invite
 */
export const inviteEmployeeSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Formato de email inválido"),
  displayName: z
    .string()
    .min(1, "El nombre es requerido")
    .trim(),
  role: z
    .enum(["admin", "manager", "employee", "auditor"]),
});

/**
 * Schema for POST /api/v1/auth/validate-token
 * Token is a 48-char hex string (24 bytes → hex)
 */
export const validateTokenSchema = z.object({
  token: z
    .string()
    .min(1, "El código de activación es requerido")
    .regex(/^[0-9a-f]{48}$/, "El código de activación no tiene el formato correcto"),
});

/**
 * Schema for POST /api/v1/auth/activate
 * Token: 48-char hex. Password: min 8 chars, ≥1 uppercase, ≥1 number.
 */
export const activateAccountSchema = z.object({
  token: z
    .string()
    .min(1, "El código de activación es requerido")
    .regex(/^[0-9a-f]{48}$/, "El código de activación no tiene el formato correcto"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
});

export type InviteEmployeeInput = z.infer<typeof inviteEmployeeSchema>;
export type ValidateTokenInput = z.infer<typeof validateTokenSchema>;
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;
