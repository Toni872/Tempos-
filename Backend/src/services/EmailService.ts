import nodemailer from 'nodemailer';
import { appendFileSync } from 'fs';
import { join } from 'path';

/**
 * Servicio Premium de Email para Tempos.
 * Diseñado para mantener la estética Dark Mode y Glassmorphism de la plataforma.
 */
export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static etherealPreview = false;

  private static async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    if (process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || 'info@tempos.es',
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.etherealPreview = true;
      console.log(`📧 [EMAIL] Using Ethereal test account: ${testAccount.user}`);
    }

    return this.transporter;
  }

  /**
   * Envía el email de bienvenida para la prueba de 14 días.
   */
  static async sendTrialWelcome(email: string, name: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
        body { margin: 0; padding: 0; background-color: #050505; font-family: 'Inter', sans-serif; color: #ffffff; }
        .container { max-width: 600px; margin: 40px auto; background: #0a0a0c; border: 1px solid rgba(255,255,255,0.05); border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
        .header { padding: 40px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #312e81 100%); }
        .content { padding: 40px; }
        .footer { padding: 30px; text-align: center; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: rgba(255,255,255,0.4); }
        h1 { font-weight: 800; letter-spacing: -1px; margin: 0; font-size: 28px; }
        h2 { font-weight: 600; color: #60a5fa; margin-bottom: 24px; font-size: 20px; }
        p { line-height: 1.6; color: rgba(255,255,255,0.7); font-size: 15px; }
        .data-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; margin: 30px 0; }
        .data-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-family: 'Courier New', monospace; }
        .data-label { color: rgba(255,255,255,0.4); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .data-value { color: #ffffff; font-weight: 600; font-size: 14px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px; box-shadow: 0 10px 20px rgba(37,99,235,0.2); }
        .btn:hover { background: #3b82f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="${frontendUrl}/login" style="text-decoration: none; display: inline-flex; align-items: center; gap: 10px;">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogIDxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjUyIiBmaWxsPSJub25lIiBzdHJva2U9IiMyNTYzZWIiIHN0cm9rZS13aWR0aD0iMiIgb3BhY2l0eT0iMC4xNSIvPg0KICA8Y2lyY2xlIGN4PSI2NCIgY3k9IjY0IiByPSI0OCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjU2M2ViIiBzdHJva2Utd2lkdGg9IjMiLz4NCiAgPGNpcmNsZSBjeD0iNjQiIGN5PSIxOCIgcj0iMi41IiBmaWxsPSIjMjU2M2ViIi8+DQogIDxjaXJjbGUgY3g9IjExMCIgY3k9IjY0IiByPSIyLjUiIGZpbGw9IiMyNTYzZWIiLz4NCiAgPGNpcmNsZSBjeD0iNjQiIGN5PSIxMTAiIHI9IjIuNSIgZmlsbD0iIzI1NjNlYiIvPg0KICA8Y2lyY2xlIGN4PSIxOCIgY3k9IjY0IiByPSIyLjUiIGZpbGw9IiMyNTYzZWIiLz4NCiAgPGxpbmUgeDE9IjY0IiB5MT0iNjQiIHgyPSI2NCIgeTI9IjMyIiBzdHJva2U9IiMyNTYzZWIiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBvcGFjaXR5PSIwLjkiLz4NCiAgPGxpbmUgeDE9IjY0IiB5MT0iNjQiIHgyPSI4NyIgeTI9IjU1IiBzdHJva2U9IiM2MGE1ZmEiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIG9wYWNpdHk9IjAuNzUiLz4NCiAgPGNpcmNsZSBjeD0iNjQiIGN5PSI2NCIgcj0iNC41IiBmaWxsPSIjMjU2M2ViIi8+DQo8L3N2Zz4=" alt="Tempos" width="36" height="36" style="vertical-align: middle;">
            <span style="font-weight: 800; font-size: 26px; letter-spacing: -1px; color: #ffffff;">TEM<span style="color: #60a5fa;">POS</span></span>
          </a>
        </div>
        <div class="content">
          <h2>Prueba Tempos de 14 días</h2>
          <p>Hola, <strong>${name}</strong>:</p>
          <p>Ya hemos recibido tu solicitud de la prueba gratuita de 14 días de <strong>Tempos</strong>. Aquí tienes tus credenciales para que puedas empezar a transformar el control horario de tu empresa.</p>
          
          <div class="data-box">
            <div style="margin-bottom: 16px;">
              <span class="data-label">Usuario / Email</span><br/>
              <span class="data-value">${email}</span>
            </div>
            <div>
              <span class="data-label">Estado de la cuenta</span><br/>
              <span class="data-value" style="color: #10b981;">Trial de 14 días (Acceso Total)</span>
            </div>
          </div>

          <p>Nos alegra mucho que hayas decidido confiar en nosotros. Accede ahora al área de gestión profesional para configurar tu empresa y empezar a invitar a tus empleados.</p>
          
          <div style="text-align: center;">
            <a href="${frontendUrl}/login" class="btn">ACCEDER A GESTIÓN</a>
          </div>

          <p style="margin-top: 40px; font-size: 13px;">Si tienes algún problema o necesitas asistencia técnica, escríbenos a <a href="mailto:contact@script-9.com" style="color: #60a5fa; text-decoration: none;">contact@script-9.com</a> y te contestaremos lo antes posible.</p>
        </div>
        <div class="footer">
          &copy; 2026 Tempos Control Horario B2B. Todos los derechos reservados.<br/>
          Este es un email automático, por favor no respondas directamente.
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      const transporter = await EmailService.getTransporter();
      const info = await transporter.sendMail({
        from: `"Tempos B2B" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'info@tempos.es'}>`,
        to: email,
        subject: '🚀 Tu prueba gratuita de 14 días en Tempos está lista',
        html: htmlContent,
      });
      if (EmailService.etherealPreview) {
        console.log(`📧 [EMAIL] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      console.log(`📧 [EMAIL] Welcome trial sent to ${email}`);
    } catch (error) {
      console.error(`❌ [EMAIL] Error sending welcome trial to ${email}:`, error);
    }
  }

  /**
   * Notifica al equipo de Tempos sobre un registro pendiente de aprobación.
   */
  static async sendPendingApproval(email: string, name: string, companyDomain: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
        body { margin: 0; padding: 0; background-color: #050505; font-family: 'Inter', sans-serif; color: #ffffff; }
        .container { max-width: 600px; margin: 40px auto; background: #0a0a0c; border: 1px solid rgba(255,255,255,0.05); border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
        .header { padding: 40px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #312e81 100%); }
        .content { padding: 40px; }
        .footer { padding: 30px; text-align: center; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: rgba(255,255,255,0.4); }
        h1 { font-weight: 800; letter-spacing: -1px; margin: 0; font-size: 28px; }
        h2 { font-weight: 600; color: #60a5fa; margin-bottom: 24px; font-size: 20px; }
        p { line-height: 1.6; color: rgba(255,255,255,0.7); font-size: 15px; }
        .data-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; margin: 30px 0; }
        .data-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-family: 'Courier New', monospace; }
        .data-label { color: rgba(255,255,255,0.4); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .data-value { color: #ffffff; font-weight: 600; font-size: 14px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px; box-shadow: 0 10px 20px rgba(37,99,235,0.2); }
        .btn:hover { background: #3b82f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="${frontendUrl}/login" style="text-decoration: none; display: inline-flex; align-items: center; gap: 10px;">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogIDxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjUyIiBmaWxsPSJub25lIiBzdHJva2U9IiMyNTYzZWIiIHN0cm9rZS13aWR0aD0iMiIgb3BhY2l0eT0iMC4xNSIvPg0KICA8Y2lyY2xlIGN4PSI2NCIgY3k9IjY0IiByPSI0OCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjU2M2ViIiBzdHJva2Utd2lkdGg9IjMiLz4NCiAgPGNpcmNsZSBjeD0iNjQiIGN5PSIxOCIgcj0iMi41IiBmaWxsPSIjMjU2M2ViIi8+DQogIDxjaXJjbGUgY3g9IjExMCIgY3k9IjY0IiByPSIyLjUiIGZpbGw9IiMyNTYzZWIiLz4NCiAgPGNpcmNsZSBjeD0iNjQiIGN5PSIxMTAiIHI9IjIuNSIgZmlsbD0iIzI1NjNlYiIvPg0KICA8Y2lyY2xlIGN4PSIxOCIgY3k9IjY0IiByPSIyLjUiIGZpbGw9IiMyNTYzZWIiLz4NCiAgPGxpbmUgeDE9IjY0IiB5MT0iNjQiIHgyPSI2NCIgeTI9IjMyIiBzdHJva2U9IiMyNTYzZWIiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBvcGFjaXR5PSIwLjkiLz4NCiAgPGxpbmUgeDE9IjY0IiB5MT0iNjQiIHgyPSI4NyIgeTI9IjU1IiBzdHJva2U9IiM2MGE1ZmEiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIG9wYWNpdHk9IjAuNzUiLz4NCiAgPGNpcmNsZSBjeD0iNjQiIGN5PSI2NCIgcj0iNC41IiBmaWxsPSIjMjU2M2ViIi8+DQo8L3N2Zz4=" alt="Tempos" width="36" height="36" style="vertical-align: middle;">
            <span style="font-weight: 800; font-size: 26px; letter-spacing: -1px; color: #ffffff;">TEM<span style="color: #60a5fa;">POS</span></span>
          </a>
        </div>
        <div class="content">
          <h2>Registro pendiente de aprobación</h2>
          <p>Un nuevo administrador se ha registrado y requiere verificación manual.</p>

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

          <p>Revisa los datos y, si todo es correcto, cambia el estado del usuario a <strong>"active"</strong> desde el panel de administración.</p>

          <p style="margin-top: 40px; font-size: 13px;">Este es un email automático generado por el sistema de registro de Tempos.</p>
        </div>
        <div class="footer">
          &copy; 2026 Tempos Control Horario B2B. Todos los derechos reservados.
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      const transporter = await EmailService.getTransporter();
      const info = await transporter.sendMail({
        from: `"Tempos B2B" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'info@tempos.es'}>`,
        to: process.env.ADMIN_NOTIFICATION_EMAIL || 'info@tempos.es',
        subject: '⏳ Nuevo registro pendiente de aprobación',
        html: htmlContent,
      });
      if (EmailService.etherealPreview) {
        console.log(`📧 [EMAIL] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      console.log(`📧 [EMAIL] Pending approval notification sent for ${email}`);
    } catch (error) {
      console.error(`❌ [EMAIL] Error sending pending approval notification for ${email}:`, error);
    }
  }

  /**
   * Envía el email de invitación a un empleado.
   */
  static async sendEmployeeInvite(
    email: string,
    name: string,
    companyName: string,
    adminName: string,
    inviteLink: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
        body { margin: 0; padding: 0; background-color: #050505; font-family: 'Inter', sans-serif; color: #ffffff; }
        .container { max-width: 600px; margin: 40px auto; background: #0a0a0c; border: 1px solid rgba(255,255,255,0.05); border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
        .header { padding: 40px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #312e81 100%); }
        .content { padding: 40px; }
        .footer { padding: 30px; text-align: center; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: rgba(255,255,255,0.4); }
        h1 { font-weight: 800; letter-spacing: -1px; margin: 0; font-size: 28px; }
        h2 { font-weight: 600; color: #60a5fa; margin-bottom: 24px; font-size: 20px; }
        p { line-height: 1.6; color: rgba(255,255,255,0.7); font-size: 15px; }
        .data-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; margin: 30px 0; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px; box-shadow: 0 10px 20px rgba(37,99,235,0.2); }
        .btn:hover { background: #3b82f6; }
        .divider { height: 1px; background: rgba(255,255,255,0.06); margin: 30px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="${frontendUrl}/login" style="text-decoration: none; display: inline-flex; align-items: center; gap: 10px;">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogIDxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjUyIiBmaWxsPSJub25lIiBzdHJva2U9IiMyNTYzZWIiIHN0cm9rZS13aWR0aD0iMiIgb3BhY2l0eT0iMC4xNSIvPg0KICA8Y2lyY2xlIGN4PSI2NCIgY3k9IjY0IiByPSI0OCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjU2M2ViIiBzdHJva2Utd2lkdGg9IjMiLz4NCiAgPGNpcmNsZSBjeD0iNjQiIGN5PSIxOCIgcj0iMi41IiBmaWxsPSIjMjU2M2ViIi8+DQogIDxjaXJjbGUgY3g9IjExMCIgY3k9IjY0IiByPSIyLjUiIGZpbGw9IiMyNTYzZWIiLz4NCiAgPGNpcmNsZSBjeD0iNjQiIGN5PSIxMTAiIHI9IjIuNSIgZmlsbD0iIzI1NjNlYiIvPg0KICA8Y2lyY2xlIGN4PSIxOCIgY3k9IjY0IiByPSIyLjUiIGZpbGw9IiMyNTYzZWIiLz4NCiAgPGxpbmUgeDE9IjY0IiB5MT0iNjQiIHgyPSI2NCIgeTI9IjMyIiBzdHJva2U9IiMyNTYzZWIiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBvcGFjaXR5PSIwLjkiLz4NCiAgPGxpbmUgeDE9IjY0IiB5MT0iNjQiIHgyPSI4NyIgeTI9IjU1IiBzdHJva2U9IiM2MGE1ZmEiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIG9wYWNpdHk9IjAuNzUiLz4NCiAgPGNpcmNsZSBjeD0iNjQiIGN5PSI2NCIgcj0iNC41IiBmaWxsPSIjMjU2M2ViIi8+DQo8L3N2Zz4=" alt="Tempos" width="36" height="36" style="vertical-align: middle;">
            <span style="font-weight: 800; font-size: 26px; letter-spacing: -1px; color: #ffffff;">TEM<span style="color: #60a5fa;">POS</span></span>
          </a>
        </div>
        <div class="content">
          <h2>Has sido invitado a <strong>${companyName}</strong></h2>
          <p>Hola, <strong>${name}</strong>:</p>
          <p><strong>${adminName}</strong> te ha invitado a unirte a <strong>${companyName}</strong> en <strong>Tempos</strong>, la plataforma de control horario de tu empresa.</p>

          <p>Para aceptar la invitación y crear tu cuenta, solo tienes que hacer clic en el siguiente botón:</p>

          <div style="text-align: center;">
            <a href="${inviteLink}" class="btn">ACEPTAR INVITACIÓN</a>
          </div>

          <p style="margin-top: 30px; font-size: 13px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="font-family: 'Courier New', monospace; font-size: 12px; color: rgba(255,255,255,0.4); word-break: break-all;">${inviteLink}</p>

          <div class="divider"></div>

          <p style="font-size: 13px; color: rgba(255,255,255,0.5);">Esta invitación expira en 7 días. Si no esperabas esta invitación, puedes ignorar este email.</p>

          <p style="font-size: 13px; margin-top: 20px;">Si tienes alguna duda, contacta a tu administrador o escríbenos a <a href="mailto:contact@script-9.com" style="color: #60a5fa; text-decoration: none;">contact@script-9.com</a>.</p>
        </div>
        <div class="footer">
          &copy; 2026 Tempos Control Horario B2B. Todos los derechos reservados.<br/>
          Este es un email automático, por favor no respondas directamente.
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      const transporter = await EmailService.getTransporter();
      const info = await transporter.sendMail({
        from: `"Tempos B2B" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'info@tempos.es'}>`,
        to: email,
        subject: `${adminName} te ha invitado a unirte a ${companyName} en Tempos`,
        html: htmlContent,
      });
      if (EmailService.etherealPreview) {
        const url = nodemailer.getTestMessageUrl(info);
        console.log(`📧 [EMAIL] Preview URL: ${url}`);
        try {
          appendFileSync(join(process.cwd(), 'email_preview.txt'), `${url}\n`);
        } catch {}
      }
      console.log(`📧 [EMAIL] Invitation sent to ${email} for ${companyName}`);
    } catch (error) {
      console.error(`❌ [EMAIL] Error sending invitation to ${email}:`, error);
      throw error; // Re-lanzamos para que el controller sepa que falló
    }
  }
}
