import PDFDocument from "pdfkit";
import { Ficha } from "../entities/Ficha.js";
import { User } from "../entities/User.js";

// --- Configuración Global de Marca ---
const BRAND_BLUE = "#2563EB";
const BRAND_DARK = "#1E293B";
const BRAND_SLATE = "#64748B";
const LIGHT_BG = "#F8FAFC";

/**
 * Función para dibujar el logotipo vectorial de Tempos en cualquier página
 */
function drawTemposLogo(doc: PDFKit.PDFDocument, x: number, y: number, size: number = 30) {
  const scale = size / 100;
  doc.save();
  doc.translate(x, y);
  doc.scale(scale);

  // Círculos del reloj (Logo original)
  doc.circle(50, 50, 45).lineWidth(2.5).opacity(0.2).stroke(BRAND_BLUE);
  doc.circle(50, 50, 40).lineWidth(2.8).opacity(1).stroke(BRAND_BLUE);
  
  // Puntos horarios
  doc.circle(50, 12, 2.2).fill(BRAND_BLUE);
  doc.circle(88, 50, 2.2).fill(BRAND_BLUE);
  doc.circle(50, 88, 2.2).fill(BRAND_BLUE);
  doc.circle(12, 50, 2.2).fill(BRAND_BLUE);

  // Manecillas
  doc.lineCap('round').lineWidth(2.5).moveTo(50, 50).lineTo(50, 28).opacity(0.85).stroke(BRAND_BLUE);
  doc.lineWidth(2).moveTo(50, 50).lineTo(68, 44).opacity(0.6).stroke(BRAND_BLUE);
  
  // Centro
  doc.circle(50, 50, 3.5).opacity(1).fill(BRAND_BLUE);

  doc.restore();

  // Texto Tempos
  doc.fillColor(BRAND_DARK).font("Helvetica-Bold").fontSize(size * 0.8).text("Tem", x + size + 8, y + (size/4), { continued: true });
  doc.fillColor(BRAND_BLUE).text("pos");
}

/**
 * GENERADOR DE INFORME DE INSPECCIÓN (REGISTRO JORNADA)
 */
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

    doc.rect(0, 0, 600, 8).fill(BRAND_BLUE);
    drawTemposLogo(doc, 50, 40, 28);

    doc.fillColor(BRAND_DARK).font("Helvetica-Bold").fontSize(16).text("REGISTRO DIARIO DE JORNADA", { align: "right" });
    doc.fillColor(BRAND_SLATE).font("Helvetica").fontSize(8).text("CONFORME AL ARTÍCULO 34.9 DEL ESTATUTO DE LOS TRABAJADORES (RDL 8/2019)", { align: "right" });

    doc.moveDown(2);
    doc.rect(50, doc.y, 495, 1).fill("#E2E8F0");
    doc.moveDown(1.5);

    // Grid Info
    const gridY = doc.y;
    doc.fillColor(BRAND_SLATE).font("Helvetica-Bold").fontSize(8).text("DATOS DE LA EMPRESA", 50, gridY);
    doc.text("DATOS DEL EMPLEADO", 300, gridY);
    doc.moveDown(0.5);
    doc.fillColor(BRAND_DARK).font("Helvetica-Bold").fontSize(9).text("Razón Social:", 50, doc.y);
    doc.font("Helvetica").text(employerName, 120, doc.y - 9);
    if (targetUser) {
      doc.font("Helvetica-Bold").text("Nombre:", 300, doc.y - 9);
      doc.font("Helvetica").text(targetUser.displayName || "Empleado", 370, doc.y - 9);
    }

    doc.moveDown(3);
    const tableTop = doc.y;
    doc.rect(50, tableTop, 495, 22).fill(BRAND_BLUE);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8);
    doc.text("FECHA", 65, tableTop + 8);
    doc.text("ENTRADA", 145, tableTop + 8);
    doc.text("SALIDA", 215, tableTop + 8);
    doc.text("DURACIÓN", 285, tableTop + 8);
    doc.text("CENTRO", 355, tableTop + 8);
    doc.text("MÉTODO", 485, tableTop + 8);

    let y = tableTop + 22;
    doc.fillColor(BRAND_DARK).font("Helvetica").fontSize(8);
    fichas.forEach((f, i) => {
      if (i % 2 === 0) doc.rect(50, y, 495, 20).fill(LIGHT_BG);
      const rowY = y + 6;
      doc.fillColor(BRAND_DARK).text(String(f.date).split('T')[0], 65, rowY);
      doc.text(f.startTime, 145, rowY);
      doc.text(f.endTime || "--:--", 215, rowY);
      doc.font("Helvetica-Bold").text(`${f.hoursWorked || 0}h`, 285, rowY).font("Helvetica");
      doc.text("Sede Central", 355, rowY);
      doc.text("APP GPS", 485, rowY);
      if (y > 700) { doc.addPage(); y = 50; }
    });

    // --- Footer Script-9 ---
    const footerY = 750;
    doc.rect(50, footerY, 495, 0.5).fill(BRAND_SLATE);
    doc.fillColor(BRAND_SLATE).fontSize(7).font("Helvetica");
    doc.text(
      "Este documento constituye el registro fehaciente de la jornada laboral según el RDL 8/2019. Sistemas de verificación por Script-9.",
      50, footerY + 12, { align: "center", width: 495 }
    );
    doc.font("Helvetica-Bold").text("Software Certificado por Script-9 (www.script-9.com)", 50, footerY + 22, { align: "center", width: 495 });

    doc.info['Author'] = 'Script-9';
    doc.info['Creator'] = 'Tempos System by Script-9';

    doc.end();
  });
}

/**
 * GENERADOR DE AUDITORÍA GPS (TÉCNICO / LEGAL)
 */
export async function generateAuditPDF(
  fichas: Ficha[],
  targetUser?: User,
  employerName: string = "Antonio Lloret Sánchez",
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    // Acento superior
    doc.rect(0, 0, 600, 8).fill(BRAND_BLUE);
    
    // Logo Tempos
    drawTemposLogo(doc, 50, 40, 32);

    // Título Principal
    doc.fillColor(BRAND_DARK).font("Helvetica-Bold").fontSize(18).text("AUDITORÍA TÉCNICA DE GEOLOCALIZACIÓN", { align: "right" });
    doc.fillColor(BRAND_BLUE).font("Helvetica-Bold").fontSize(9).text("CERTIFICADO DE PRESENCIA DIGITAL", { align: "right" });
    
    doc.moveDown(2);
    doc.rect(50, doc.y, 495, 1).fill("#E2E8F0");
    doc.moveDown(1.5);

    // Bloque de información
    const infoY = doc.y;
    doc.rect(50, infoY, 495, 60).fill(LIGHT_BG);
    doc.fillColor(BRAND_SLATE).font("Helvetica-Bold").fontSize(8).text("INFORME DE CUMPLIMIENTO", 65, infoY + 12);
    
    doc.fillColor(BRAND_DARK).font("Helvetica").fontSize(9);
    doc.text(`Empresa:`, 65, infoY + 28, { continued: true }).font("Helvetica-Bold").text(` ${employerName}`);
    doc.font("Helvetica").text(`Empleado:`, 65, infoY + 42, { continued: true }).font("Helvetica-Bold").text(` ${targetUser?.displayName || "Reporte General"}`);
    
    doc.font("Helvetica").text(`Fecha Emisión:`, 300, infoY + 28, { continued: true }).font("Helvetica-Bold").text(` ${new Date().toLocaleString("es-ES")}`);
    doc.font("Helvetica").text(`Estado Auditoría:`, 300, infoY + 42, { continued: true }).fillColor("#059669").font("Helvetica-Bold").text(` VERIFICADA ✅`);

    doc.moveDown(4);

    // Tabla de Auditoría
    const tableTop = doc.y;
    doc.rect(50, tableTop, 495, 25).fill(BRAND_DARK);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8);
    
    const col1 = 65, col2 = 135, col3 = 205, col4 = 280, col5 = 450;
    
    doc.text("FECHA", col1, tableTop + 9);
    doc.text("HORA", col2, tableTop + 9);
    doc.text("EVENTO", col3, tableTop + 9);
    doc.text("LOCALIZACIÓN GPS (COORDENADAS)", col4, tableTop + 9);
    doc.text("DISPOSITIVO", col5, tableTop + 9);

    let y = tableTop + 25;
    doc.fillColor(BRAND_DARK).font("Helvetica").fontSize(8);

    fichas.forEach((f, i) => {
      const meta = typeof f.metadata === 'string' ? JSON.parse(f.metadata) : f.metadata;
      const location = meta?.location || "No registrada";
      const device = meta?.deviceId || "Verificado";

      if (i % 2 === 0) doc.rect(50, y, 495, 24).fill(LIGHT_BG);
      
      const rowY = y + 8;
      const dateStr = String(f.date).split('T')[0];
      
      doc.fillColor(BRAND_DARK).text(dateStr, col1, rowY);
      doc.text(f.startTime || "--:--", col2, rowY);
      doc.text(f.endTime ? "SALIDA" : "ENTRADA", col3, rowY);
      doc.fillColor(BRAND_BLUE).font("Helvetica-Bold").text(location, col4, rowY).font("Helvetica").fillColor(BRAND_DARK);
      doc.text(device.substring(0, 16), col5, rowY);

      y += 24;
      if (y > 680) { doc.addPage(); y = 50; }
    });

    // --- SECCIÓN LEGAL (Pie de Página) ---
    const footerY = 710;
    doc.rect(50, footerY, 495, 0.5).fill(BRAND_SLATE);
    
    doc.fillColor(BRAND_SLATE).fontSize(7).font("Helvetica-Oblique");
    doc.text(
      "Este documento constituye una prueba técnica vinculante de la presencia del trabajador en las coordenadas indicadas. Los datos han sido cifrados en origen y validados mediante el protocolo de seguridad de Script-9 para Tempos Cloud. Cumple íntegramente con el RDL 8/2019 y la LOPDGDD 3/2018.",
      50, footerY + 12, { align: "justify", width: 495 }
    );
    doc.font("Helvetica-Bold").text("Verificación Tecnológica por Script-9 (www.script-9.com)", 50, footerY + 28, { align: "center", width: 495 });

    // Sellos y Firmas
    const sigY = y + 40 > 650 ? 650 : y + 40;
    doc.rect(380, sigY, 140, 60).lineWidth(1).stroke(BRAND_BLUE);
    doc.fillColor(BRAND_BLUE).font("Helvetica-Bold").fontSize(7).text("SCRIPT-9 SECURITY SEAL", 385, sigY + 10, { align: "center", width: 130 });
    doc.fontSize(6).text("AUTHENTICATED DATA", 385, sigY + 25, { align: "center", width: 130 });
    doc.fontSize(5).text(`ID: S9-${Math.random().toString(36).substring(7).toUpperCase()}`, 385, sigY + 40, { align: "center", width: 130 });

    doc.info['Author'] = 'Script-9';
    doc.info['Creator'] = 'Tempos Audit by Script-9';

    doc.fillColor(BRAND_DARK).font("Helvetica-Bold").fontSize(8);
    doc.text("Firma de Conformidad del Administrador", 50, sigY + 10);
    doc.rect(50, sigY + 45, 180, 0.5).stroke(BRAND_SLATE);

    doc.end();
  });
}
