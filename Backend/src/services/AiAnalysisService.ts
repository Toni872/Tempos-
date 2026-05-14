import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppDataSource } from "../database.js";
import { Ficha } from "../entities/Ficha.js";

export interface AiInsight {
  title: string;
  text: string;
  type: "efficiency" | "technical" | "warning";
}

export class AiAnalysisService {
  private static genAI: GoogleGenerativeAI | null = null;

  private static getClient() {
    if (!this.genAI) {
      const apiKey = process.env.GEMINI_API_KEY || "";
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    return this.genAI;
  }

  /**
   * Genera insights personalizados utilizando Gemini basados en los datos reales de la empresa.
   */
  static async generatePredictiveAnalysis(
    companyId: string,
  ): Promise<AiInsight[]> {
    try {
      // 1. Obtener datos históricos de los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const fichas = await AppDataSource.getRepository(Ficha).find({
        where: { user: { companyId } },
        relations: ["user"],
        order: { date: "DESC" },
        take: 200,
      });

      if (fichas.length < 5) {
        return [
          {
            title: "DATOS INSUFICIENTES",
            text: "Aún no hay suficientes registros de jornada para realizar un análisis predictivo fiable. Registra más actividad para activar la IA.",
            type: "warning",
          },
        ];
      }

      // 2. Preparar un resumen anónimo de los datos para el prompt
      const summary = fichas.map((f) => ({
        date: f.date,
        start: f.startTime,
        end: f.endTime,
        hours: f.hoursWorked,
        userId: f.userId.substring(0, 8), // ID truncado por privacidad
      }));

      const prompt = `
        Actúa como un experto en optimización de operaciones y recursos humanos para una plataforma de control horario llamada "Tempos".
        Analiza los siguientes datos de fichajes (últimos 30 días) de una empresa:
        ${JSON.stringify(summary)}

        Genera exactamente 2 insights predictivos o recomendaciones técnicas basadas en estos datos.
        La respuesta debe ser un JSON puro con el siguiente formato:
        {
          "insights": [
            { "title": "TITULO CORTO", "text": "Mensaje corto e impactante en español", "type": "efficiency" },
            { "title": "TITULO CORTO", "text": "Mensaje corto e impactante en español", "type": "technical" }
          ]
        }
        Asegúrate de que sean realistas (ej: detectar si los lunes se llega tarde, si hay muchas horas extra en ciertos días, etc).
        No incluyas markdown, solo el JSON.
      `;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey)
        throw new Error("GEMINI_API_KEY no encontrada en el entorno.");

      const client = this.getClient();
      // Usamos gemini-2.5-flash que es el modelo verificado para esta clave (aunque puede tener picos de alta demanda)
      const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Limpiar posible markdown si Gemini lo incluye a pesar del prompt
      const jsonStr = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(jsonStr);

      return parsed.insights || [];
    } catch (error) {
      console.error("❌ Error en AI Analysis:", error);
      return [
        {
          title: "ERROR DE ANÁLISIS",
          text: "No se pudo conectar con el motor de IA en este momento. Revisa tu API Key o conexión.",
          type: "warning",
        },
      ];
    }
  }
}
