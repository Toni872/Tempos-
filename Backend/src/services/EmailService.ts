import nodemailer from 'nodemailer';

/**
 * Servicio Premium de Email para Tempos.
 * Diseñado para mantener la estética Dark Mode y Glassmorphism de la plataforma.
 */
export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'info@tempos.es',
      pass: process.env.SMTP_PASS || '',
    },
  });

  /**
   * Envía el email de bienvenida para la prueba de 14 días.
   */
  static async sendTrialWelcome(email: string, name: string) {
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
          <h1>TEMPOS</h1>
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
            <a href="${process.env.FRONTEND_URL || 'https://tempos.es'}/login" class="btn">ACCEDER A GESTIÓN</a>
          </div>

          <p style="margin-top: 40px; font-size: 13px;">Si tienes algún problema o necesitas asistencia técnica, escríbenos a <a href="mailto:info@tempos.es" style="color: #60a5fa; text-decoration: none;">info@tempos.es</a> y te contestaremos lo antes posible.</p>
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
      await this.transporter.sendMail({
        from: '"Tempos B2B" <info@tempos.es>',
        to: email,
        subject: '🚀 Tu prueba gratuita de 14 días en Tempos está lista',
        html: htmlContent,
      });
      console.log(`📧 [EMAIL] Welcome trial sent to ${email}`);
    } catch (error) {
      console.error(`❌ [EMAIL] Error sending welcome trial to ${email}:`, error);
    }
  }
}
