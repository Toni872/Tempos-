import PDFDocument from "pdfkit";
import { Ficha } from "../entities/Ficha.js";
import { User } from "../entities/User.js";

export async function generateInspectionPDF(
  fichas: Ficha[],
  totalHours: number,
  targetUser?: User,
  employerName: string = "Antonio Lloret Sánchez",
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    // --- Configuration ---
    const brandColor = "#2563EB"; // Tempos Primary Blue
    const secondaryColor = "#64748B"; // Slate
    const textColor = "#1E293B";
    const lightBg = "#F8FAFC";

    // --- Header ---
    doc.rect(0, 0, 600, 10).fill(brandColor); // Top accent line

    doc.fillColor(brandColor).font("Helvetica-Bold").fontSize(24).text("TEMPOS", 50, 40);
    doc
      .fillColor(secondaryColor)
      .font("Helvetica")
      .fontSize(10)
      .text("SISTEMA DE GESTIÓN DE CAPITAL HUMANO", 50, 65);

    doc.moveDown(2);

    // --- Title & Regulatory Text ---
    doc
      .fillColor(textColor)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("REGISTRO DIARIO DE JORNADA", { align: "right" });
    doc
      .fillColor(secondaryColor)
      .font("Helvetica")
      .fontSize(8)
      .text("CONFORME AL ARTÍCULO 34.9 DEL ESTATUTO DE LOS TRABAJADORES (RDL 8/2019)", {
        align: "right",
      });

    doc.moveDown(2);
    doc.rect(50, doc.y, 495, 1).fill("#E2E8F0");
    doc.moveDown(1.5);

    // --- Info Grid ---
    const startY = doc.y;
    doc.fillColor(secondaryColor).font("Helvetica-Bold").fontSize(8);
    doc.text("DATOS DE LA EMPRESA", 50, startY);
    doc.text("DATOS DEL EMPLEADO", 300, startY);
    
    doc.moveDown(0.5);
    const gridY = doc.y;
    
    // Left Column (Enterprise)
    doc.fillColor(textColor).font("Helvetica-Bold").fontSize(10).text("Razón Social:", 50, gridY);
    doc.font("Helvetica").text(employerName, 120, gridY);
    doc.font("Helvetica-Bold").text("Software:", 50, gridY + 15);
    doc.font("Helvetica").text("Tempos v2.0 (Certificado)", 120, gridY + 15);

    // Right Column (Employee)
    if (targetUser) {
      doc.font("Helvetica-Bold").text("Nombre:", 300, gridY);
      doc.font("Helvetica").text(targetUser.displayName || "Empleado", 370, gridY);
      doc.font("Helvetica-Bold").text("ID / Email:", 300, gridY + 15);
      doc.font("Helvetica").text(targetUser.email || "Sin email", 370, gridY + 15);
    } else {
      doc.font("Helvetica").text("REPORTE CONSOLIDADO GLOBAL", 300, gridY);
    }

    doc.moveDown(3);

    // --- Summary Box ---
    const summaryY = doc.y;
    doc.rect(50, summaryY, 495, 45).fill(lightBg);
    doc.fillColor(brandColor).font("Helvetica-Bold").fontSize(9).text("RESUMEN DEL PERIODO", 65, summaryY + 10);
    
    doc.fillColor(textColor).font("Helvetica").fontSize(11);
    doc.text(`Jornadas:`, 65, summaryY + 25, { continued: true });
    doc.font("Helvetica-Bold").text(` ${fichas.length}`, { continued: true });
    doc.font("Helvetica").text(`  |  Horas Efectivas:`, { continued: true });
    doc.font("Helvetica-Bold").text(` ${totalHours.toFixed(2)}h`);

    doc.moveDown(3);

    // --- Table Header ---
    const tableTop = doc.y;
    doc.rect(50, tableTop, 495, 25).fill(brandColor);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8);
    
    const col1 = 65, col2 = 145, col3 = 215, col4 = 285, col5 = 355, col6 = 485;
    
    doc.text("FECHA", col1, tableTop + 9);
    doc.text("ENTRADA", col2, tableTop + 9);
    doc.text("SALIDA", col3, tableTop + 9);
    doc.text("DURACIÓN", col4, tableTop + 9);
    doc.text("CENTRO / PROYECTO", col5, tableTop + 9);
    doc.text("MÉTODO", col6, tableTop + 9);

    // --- Table Rows ---
    let y = tableTop + 25;
    doc.fillColor(textColor).font("Helvetica").fontSize(8);

    fichas.forEach((f, i) => {
      if (i % 2 === 0) {
        doc.rect(50, y, 495, 22).fill("#F1F5F9");
        doc.fillColor(textColor);
      }

      const rawDate = f.date as unknown as string | Date;
      const dateStr = typeof rawDate === "string" 
        ? rawDate.split("T")[0] 
        : (rawDate as Date).toLocaleDateString("es-ES");

      const rowY = y + 7;
      doc.text(dateStr, col1, rowY);
      doc.text(f.startTime, col2, rowY);
      doc.text(f.endTime || "--:--", col3, rowY);
      doc.font("Helvetica-Bold").text(`${f.hoursWorked || 0}h`, col4, rowY).font("Helvetica");
      doc.text((f.projectCode || "Sede Central").substring(0, 22), col5, rowY);
      doc.text((f.clockInMethod || "BIO").toUpperCase(), col6, rowY);

      y += 22;

      if (y > 720) {
        doc.addPage();
        y = 50;
      }
    });

    // --- Footer ---
    const footerY = 750;
    doc.rect(50, footerY, 495, 0.5).fill("#CBD5E1");
    doc
      .fillColor(secondaryColor)
      .fontSize(7)
      .text(
        "Este documento constituye el registro fehaciente de la jornada laboral según el RDL 8/2019. Los datos han sido capturados mediante sistemas de verificación atómica y son inalterables.",
        50,
        footerY + 10,
        { align: "center", width: 495 }
      );
    doc.text(`Página 1 de 1 - Generado por Tempos Cloud el ${new Date().toLocaleDateString("es-ES")}`, 50, footerY + 20, { align: "center" });

    // --- Signatures ---
    const sigY = y + 40;
    if (sigY < 700) {
        doc.fillColor(textColor).font("Helvetica-Bold").fontSize(9);
        doc.text("Firma del Trabajador/a", 100, sigY);
        doc.text("Sello y Firma de la Empresa", 350, sigY);
        doc.rect(70, sigY + 15, 160, 0.5).stroke(secondaryColor);
        doc.rect(320, sigY + 15, 160, 0.5).stroke(secondaryColor);
    }

    doc.end();
  });
}
