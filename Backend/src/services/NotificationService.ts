
/**
 * Servicio Senior para notificaciones externas.
 */
export class NotificationService {

  /**
   * Envía un reporte de error formateado a Slack.
   */
  static async sendErrorToSlack(errorData: any) {
    const url = process.env.SLACK_WEBHOOK_URL || '';
    if (!url) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ [NOTIF] SLACK_WEBHOOK_URL no configurada.');
      } else {
        console.log('📡 [DEBUG] Notificaciones Slack desactivadas (URL vacía).');
      }
      return;
    }

    const payload = {
      text: `🚨 *NUEVO ERROR EN TEMPOS*`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🚨 *NUEVO ERROR DETECTADO*\n*Mensaje:* ${errorData.message}\n*Error:* ${errorData.errorMessage || 'N/A'}`
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*URL:* \n${errorData.url || 'N/A'}` },
            { type: "mrkdwn", text: `*Usuario:* \n${errorData.userId || 'Anónimo'}` }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `\`\`\`${(errorData.stack || '').substring(0, 500)}...\`\`\``
          }
        },
        {
          type: "context",
          elements: [
            { type: "mrkdwn", text: `🕒 ${errorData.timestamp}` }
          ]
        }
      ]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log('✅ [NOTIF] Error enviado a Slack correctamente.');
      } else {
        const errorText = await response.text();
        console.error('❌ [NOTIF] Slack respondió con error:', response.status, errorText);
      }
    } catch (err) {
      console.error('❌ [NOTIF] Error de red al enviar a Slack:', err);
    }
  }
}
