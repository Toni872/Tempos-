import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const NAME_MAX = 120;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9\s-]{6,20}$/;
const MSG_MAX = 2000;

/**
 * POST /api/v1/contact
 * Recibe solicitudes de contacto desde el formulario público.
 * En esta fase se valida y loguea; cuando haya servicio de email
 * se añadirá el envío real.
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, phone, message } = req.body ?? {};

    const errors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.name = 'El nombre es obligatorio.';
    } else if (name.trim().length > NAME_MAX) {
      errors.name = `Máximo ${NAME_MAX} caracteres.`;
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      errors.email = 'El correo es obligatorio.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Correo no válido.';
    }

    if (phone && typeof phone === 'string' && phone.trim() && !PHONE_REGEX.test(phone.trim())) {
      errors.phone = 'Teléfono no válido.';
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      errors.message = 'El mensaje es obligatorio.';
    } else if (message.trim().length > MSG_MAX) {
      errors.message = `Máximo ${MSG_MAX} caracteres.`;
    }

    if (Object.keys(errors).length > 0) {
      res.status(422).json({ error: 'Validación fallida', fields: errors });
      return;
    }

    // Log estructurado — cuando haya servicio de email se sustituye por envío real
    console.log('[CONTACT]', JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      message: message.trim().slice(0, 200),
      ts: new Date().toISOString(),
    }));

    res.status(200).json({ ok: true, message: 'Solicitud recibida. Te responderemos en breve.' });
  }),
);

export default router;
