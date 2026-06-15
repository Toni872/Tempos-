import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { appendFileSync } from 'fs';
import { join } from 'path';

/**
 * Servicio de Email para Tempos by Script9.
 *
 * Estrategia de envío (por orden de preferencia):
 *   1. Resend API   → si RESEND_API_KEY está configurada
 *   2. Nodemailer   → si SMTP_PASS está configurado
 *   3. Ethereal     → fallback de desarrollo (los emails NO llegan reales)
 */
export class EmailService {
  private static resendClient: Resend | null = null;
  private static nodemailerTransporter: nodemailer.Transporter | null = null;
  private static etherealPreview = false;

  private static getSenderEmail(): string {
    return process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'contact@script-9.com';
  }

  private static getFromAddress(): string {
    return `"Tempos by Script9" <${EmailService.getSenderEmail()}>`;
  }

  // ── Transportes ─────────────────────────────────────────────────

  private static getResend(): Resend | null {
    if (EmailService.resendClient) return EmailService.resendClient;
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      EmailService.resendClient = new Resend(apiKey);
      return EmailService.resendClient;
    }
    return null;
  }

  private static async getNodemailer(): Promise<nodemailer.Transporter | null> {
    if (EmailService.nodemailerTransporter) return EmailService.nodemailerTransporter;

    if (process.env.SMTP_PASS) {
      EmailService.nodemailerTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || EmailService.getSenderEmail(),
          pass: process.env.SMTP_PASS,
        },
      });
      // No ethereal — SMTP real configurado
      return EmailService.nodemailerTransporter;
    }

    // Sin SMTP ni Resend → Ethereal (dev only)
    if (process.env.NODE_ENV !== 'development') {
      console.warn('⚠️ [EMAIL] Sin RESEND_API_KEY ni SMTP — los emails NO se envían en producción.');
    }
    try {
      const testAccount = await nodemailer.createTestAccount();
      EmailService.nodemailerTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      EmailService.etherealPreview = true;
      console.log(`📧 [EMAIL] Usando Ethereal (dev): ${testAccount.user}`);
    } catch {
      console.warn('⚠️ [EMAIL] No se pudo crear cuenta Ethereal — los emails no se enviarán.');
      return null;
    }
    return EmailService.nodemailerTransporter;
  }

  // ── Envío unificado ──────────────────────────────────────────────

  private static async trySend(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ ok: boolean; previewUrl?: string }> {
    // 1. Resend
    const resend = EmailService.getResend();
    if (resend) {
      try {
        const { error } = await resend.emails.send({
          from: EmailService.getFromAddress(),
          to: [to],
          subject,
          html,
        });
        if (error) {
          console.error(`❌ [EMAIL] Resend error:`, error);
        } else {
          return { ok: true };
        }
      } catch (err) {
        console.error(`❌ [EMAIL] Resend exception:`, err);
      }
    }

    // 2. Nodemailer / Ethereal
    const transporter = await EmailService.getNodemailer();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: EmailService.getFromAddress(),
          to,
          subject,
          html,
        });
        if (EmailService.etherealPreview) {
          const url = nodemailer.getTestMessageUrl(info);
          return { ok: true, previewUrl: url || undefined };
        }
        return { ok: true };
      } catch (err) {
        console.error(`❌ [EMAIL] Nodemailer error:`, err);
        return { ok: false };
      }
    }

    console.error(`❌ [EMAIL] No hay transporte disponible para enviar a ${to}`);
    return { ok: false };
  }

  // ── Emails públicos ──────────────────────────────────────────────

  /**
   * Bienvenida al administrador tras registrarse en la prueba gratuita.
   */
  static async sendTrialWelcome(email: string, name: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const html = EmailService.trialWelcomeHtml(email, name, frontendUrl);
    const { ok, previewUrl } = await EmailService.trySend(
      email,
      'Bienvenido a Tempos — Tu prueba gratuita de 14 días ha comenzado',
      html,
    );
    if (ok) {
      console.log(`📧 [EMAIL] Welcome trial enviado a ${email}`);
      if (previewUrl) {
        console.log(`📧 [EMAIL] Preview URL: ${previewUrl}`);
        try {
          appendFileSync(join(process.cwd(), 'email_preview.txt'), `${previewUrl}\n`);
        } catch { /* ignore */ }
      }
    }
  }

  /**
   * Email de verificación de email (custom, vía Resend).
   * Usa el link generado por Firebase Admin SDK.
   */
  static async sendVerificationEmail(email: string, verificationLink: string) {
    const html = EmailService.verificationRequestHtml(verificationLink);
    const { ok, previewUrl } = await EmailService.trySend(
      email,
      'Verifica tu email — Tempos',
      html,
    );
    if (ok) {
      console.log(`📧 [EMAIL] Verification email enviado a ${email}`);
      if (previewUrl) {
        try { appendFileSync(join(process.cwd(), 'email_preview.txt'), `${previewUrl}\n`); } catch { /* ignore */ }
      }
    }
  }

  /**
   * Notifica al equipo de Script9 sobre un registro pendiente de aprobación.
   */
  static async sendPendingApproval(pendingEmail: string, name: string, companyDomain: string) {
    const html = EmailService.pendingApprovalHtml(name, pendingEmail, companyDomain);
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'contact@script-9.com';
    const { ok } = await EmailService.trySend(
      adminEmail,
      '⏳ Nuevo registro pendiente de aprobación en Tempos',
      html,
    );
    if (ok) {
      console.log(`📧 [EMAIL] Notificación de pendiente enviada para ${pendingEmail}`);
    }
  }

  /**
   * Invitación a un empleado para unirse a la empresa.
   */
  static async sendEmployeeInvite(
    email: string,
    name: string,
    companyName: string,
    adminName: string,
    inviteLink: string,
  ) {
    const html = EmailService.employeeInviteHtml(name, companyName, adminName, inviteLink);
    const { ok, previewUrl } = await EmailService.trySend(
      email,
      `${adminName} te ha invitado a unirte a ${companyName} en Tempos`,
      html,
    );
    if (ok) {
      console.log(`📧 [EMAIL] Invitación enviada a ${email} para ${companyName}`);
      if (previewUrl) {
        console.log(`📧 [EMAIL] Preview URL: ${previewUrl}`);
        try {
          appendFileSync(join(process.cwd(), 'email_preview.txt'), `${previewUrl}\n`);
        } catch { /* ignore */ }
      }
    } else {
      // La re-lanzamos para que el controller pueda reaccionar
      throw new Error(`Error al enviar invitación a ${email}`);
    }
  }

  // ── Templates HTML ──────────────────────────────────────────────

  private static temposLogoSvg(): string {
    return `<svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.2"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="2.8"/>
      <circle cx="50" cy="12" r="2.2" fill="currentColor"/>
      <circle cx="88" cy="50" r="2.2" fill="currentColor"/>
      <circle cx="50" cy="88" r="2.2" fill="currentColor"/>
      <circle cx="12" cy="50" r="2.2" fill="currentColor"/>
      <line x1="50" y1="50" x2="50" y2="28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
      <line x1="50" y1="50" x2="68" y2="44" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
      <circle cx="50" cy="50" r="3.5" fill="currentColor"/>
    </svg>`;
  }

  private static htmlBoilerplate(content: string, frontendUrl: string): string {
    const logoSvg = EmailService.temposLogoSvg();
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Space+Grotesk:wght@700&display=swap');
        body { margin: 0; padding: 0; background-color: #050505; font-family: 'Inter', -apple-system, sans-serif; color: #ffffff; }
        .container { max-width: 560px; margin: 40px auto; background: #0c0c0e; border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; overflow: hidden; }
        .header { padding: 48px 40px; text-align: center; }
        .content { padding: 36px 40px; }
        .footer { padding: 28px 40px; text-align: center; background: rgba(255,255,255,0.015); border-top: 1px solid rgba(255,255,255,0.05); line-height: 1.8; }
        h1 { font-weight: 800; letter-spacing: -0.5px; margin: 0 0 4px 0; font-size: 26px; color: #ffffff; }
        p { line-height: 1.7; color: #e0e0e0; font-size: 15px; margin: 0 0 16px 0; }
        .subtitle { color: rgba(255,255,255,0.55); font-size: 14px; margin: 0; }
        .data-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 22px 24px; margin: 28px 0; }
        .data-label { color: rgba(255,255,255,0.35); font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 2px; display: block; }
        .data-value { color: #ffffff; font-weight: 600; font-size: 15px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 15px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.2px; margin-top: 8px; }
        .btn:hover { background: #3b82f6; }
        .divider { height: 1px; background: rgba(255,255,255,0.06); margin: 28px 0; border: 0; }
        a { color: #60a5fa; text-decoration: none; }
        .s9-link { color: #10B981; text-decoration: underline; }
        .footer-text { font-size: 12px; color: rgba(255,255,255,0.35); margin: 0; }
        .footer-text a { color: rgba(255,255,255,0.35); text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="${frontendUrl}/login" style="text-decoration: none; display: inline-flex; align-items: center; gap: 10px; color: #ffffff;">
            ${logoSvg}
            <span style="font-weight: 700; font-size: 24px; letter-spacing: 0.1em; color: #ffffff; font-family: 'Space Grotesk', 'Inter', sans-serif;">Tem<span style="color: #60a5fa;">pos</span></span>
          </a>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p class="footer-text">
            <span style="color: rgba(255,255,255,0.5);">Script</span><span style="color: #10B981;">9</span>
            &nbsp;&middot;&nbsp;
            <a href="https://www.script-9.com" style="color: rgba(255,255,255,0.35);">www.script-9.com</a>
          </p>
          <p class="footer-text" style="margin-top: 6px;">
            &copy; 2026 Script9 Agency &mdash; Todos los derechos reservados.
          </p>
          <p class="footer-text" style="margin-top: 10px; font-size: 11px;">
            Este es un mensaje autom&aacute;tico, no respondas directamente a este correo.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  private static trialWelcomeHtml(email: string, name: string, frontendUrl: string): string {
    return EmailService.htmlBoilerplate(`
      <h1 style="font-size: 24px; text-align: center; margin-bottom: 2px;">Bienvenido a Tempos</h1>
      <p class="subtitle" style="text-align: center; margin-bottom: 28px;">Tu per&iacute;odo de prueba ya est&aacute; activo</p>

      <p>Hola, <strong style="color:#ffffff;">${name}</strong>:</p>
      <p>Gracias por confiar en Tempos. Tu prueba gratuita de 14 d&iacute;as ya est&aacute; activa y puedes empezar a gestionar el control horario de tu empresa desde ahora mismo.</p>
      <p>Durante los pr&oacute;ximos 14 d&iacute;as tendr&aacute;s acceso completo a todas las funcionalidades de la plataforma, sin limitaciones.</p>

      <div class="data-box">
        <div style="margin-bottom: 14px;">
          <span class="data-label">Email registrado</span>
          <span class="data-value">${email}</span>
        </div>
        <div style="margin-bottom: 14px;">
          <span class="data-label">Plan</span>
          <span class="data-value">Professional &mdash; Prueba gratuita</span>
        </div>
        <div>
          <span class="data-label">Per&iacute;odo</span>
          <span class="data-value">14 d&iacute;as desde hoy</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${frontendUrl}/login" class="btn">ACCEDER AL PANEL DE CONTROL</a>
      </div>

      <hr class="divider" />

      <p style="font-size: 14px;">Si tienes cualquier duda, nuestro equipo est&aacute; aqu&iacute; para ayudarte. Escr&iacute;benos a <a href="mailto:contact@script-9.com">contact@script-9.com</a></p>

      <p style="margin-top: 4px; font-size: 14px;">El equipo de <strong style="color:#ffffff;">Tempos</strong></p>
    `, frontendUrl);
  }

  private static pendingApprovalHtml(name: string, email: string, companyDomain: string): string {
    return EmailService.htmlBoilerplate(`
      <h2>Registro pendiente de aprobaci&oacute;n</h2>
      <p>Un nuevo administrador se ha registrado y requiere verificaci&oacute;n manual.</p>

      <div class="data-box">
        <div style="margin-bottom: 16px;">
          <span class="data-label">Nombre</span><br/>
          <span class="data-value">${name}</span>
        </div>
        <div style="margin-bottom: 16px;">
          <span class="data-label">Email</span><br/>
          <span class="data-value">${email}</span>
        </div>
        <div>
          <span class="data-label">Dominio declarado</span><br/>
          <span class="data-value" style="color: #f59e0b;">${companyDomain}</span>
        </div>
      </div>

      <p>Revisa los datos y, si todo es correcto, cambia el estado del usuario a <strong>&ldquo;active&rdquo;</strong> desde el panel de administraci&oacute;n.</p>

      <p style="margin-top: 40px; font-size: 13px;">Este es un email autom&aacute;tico generado por el sistema de registro de Tempos.</p>
    `, process.env.FRONTEND_URL || 'http://localhost:5173');
  }

  private static verificationRequestHtml(verificationLink: string): string {
    return EmailService.htmlBoilerplate(`
      <h1 style="font-size: 24px; text-align: center; margin-bottom: 8px;">Verifica tu email</h1>
      <p class="subtitle" style="text-align: center; margin-bottom: 32px;">Haz clic en el botón para confirmar tu dirección de correo electrónico.</p>

      <div style="text-align: center; margin: 36px 0;">
        <a href="${verificationLink}" class="btn">CONFIRMAR MI EMAIL</a>
      </div>

      <p style="text-align: center; font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 8px;">
        Si no solicitaste verificar esta dirección, puedes ignorar este correo electrónico.
      </p>

      <hr class="divider" />

      <p style="font-size: 14px; text-align: center; color: rgba(255,255,255,0.5);">
        El equipo de <strong style="color:#ffffff;">Tempos</strong> — Script9
      </p>
    `, process.env.FRONTEND_URL || 'http://localhost:5173');
  }

  private static employeeInviteHtml(
    name: string,
    companyName: string,
    adminName: string,
    inviteLink: string,
  ): string {
    return EmailService.htmlBoilerplate(`
      <h2>Has sido invitado a <strong>${companyName}</strong></h2>
      <p>Hola, <strong>${name}</strong>:</p>
      <p><strong>${adminName}</strong> te ha invitado a unirte a <strong>${companyName}</strong> en <strong>Tempos</strong>, la plataforma de control horario de tu empresa.</p>

      <p>Para aceptar la invitaci&oacute;n y crear tu cuenta, solo tienes que hacer clic en el siguiente bot&oacute;n:</p>

      <div style="text-align: center;">
        <a href="${inviteLink}" class="btn">ACEPTAR INVITACIÓN</a>
      </div>

      <p style="margin-top: 30px; font-size: 13px;">Si el bot&oacute;n no funciona, copia y pega este enlace en tu navegador:</p>
      <p style="font-family: 'Courier New', monospace; font-size: 12px; color: rgba(255,255,255,0.4); word-break: break-all;">${inviteLink}</p>

      <div class="divider"></div>

      <p style="font-size: 13px; color: rgba(255,255,255,0.5);">Esta invitaci&oacute;n expira en 7 d&iacute;as. Si no esperabas esta invitaci&oacute;n, puedes ignorar este email.</p>

      <p style="font-size: 13px; margin-top: 20px;">Si tienes alguna duda, contacta a tu administrador o escr&iacute;benos a <a href="mailto:contact@script-9.com">contact@script-9.com</a>.</p>
    `, process.env.FRONTEND_URL || 'http://localhost:5173');
  }
}
