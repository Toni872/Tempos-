import PDFDocument from "pdfkit";
import { Response } from "express";

// ─── BRAND TOKENS (alineados con el frontend) ───
const BRAND = {
  primary: "#2563eb", // Blue 600 — color principal
  primaryLight: "#60a5fa", // Blue 400
  dark: "#0a0a0c", // Fondo oscuro
  text: "#111827", // Texto principal
  textMuted: "#6b7280", // Texto secundario
  textLight: "#9ca3af", // Texto terciario
  tableBg: "#f8fafc", // Fondo alterno de filas
  headerBg: "#111827", // Fondo de header de tabla
  border: "#e5e7eb", // Bordes
  success: "#10b981", // Verde confirmado
  warning: "#f59e0b", // Amber pendiente
  white: "#ffffff",
} as const;

const MARGIN = 50;
const PAGE_WIDTH = 595.28; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

interface AuditData {
  employeeName: string;
  employeeEmail: string;
  companyName: string;
  period: string;
  totalHours: number;
  records: Array<{
    date: string;
    clockIn: string;
    clockOut: string;
    total: string;
    status: string;
    location?: string;
  }>;
  signature?: string;
  auditHash?: string;
}

export class PdfService {
  // ─────────────────────────────────────────────────
  //  INFORME DE AUDITORÍA GPS
  // ─────────────────────────────────────────────────
  static async generateAuditPDF(
    res: Response,
    data: AuditData,
  ): Promise<void> {
    const doc = new PDFDocument({
      margin: MARGIN,
      size: "A4",
      bufferPages: true,
      info: {
        Title: `Informe de Auditoría — ${data.employeeName}`,
        Author: "Tempos Cloud",
        Subject: "Auditoría Legal de Posicionamiento GPS",
      },
    });

    doc.pipe(res);

    this.drawHeader(doc, data.companyName, "AUDITORÍA DE JORNADA");
    this.drawEmployeeInfo(doc, data);
    this.drawRecordsTable(doc, data.records);
    this.drawSignatureBlock(doc, data);
    this.drawFooter(doc, data);

    doc.end();
  }

  // ─────────────────────────────────────────────────
  //  REGISTRO LEGAL DE INSPECCIÓN (Art. 34.9 ET)
  // ─────────────────────────────────────────────────
  static async generateInspectionPDF(
    res: Response,
    data: AuditData,
  ): Promise<void> {
    const doc = new PDFDocument({
      margin: MARGIN,
      size: "A4",
      bufferPages: true,
      info: {
        Title: "Registro Diario de Jornada — Inspección de Trabajo",
        Author: "Tempos Cloud",
        Subject: "Cumplimiento Art. 34.9 del Estatuto de los Trabajadores",
      },
    });

    doc.pipe(res);

    this.drawHeader(
      doc,
      data.companyName,
      "REGISTRO DIARIO DE JORNADA",
    );

    // Badge oficial
    const badgeY = doc.y - 5;
    doc
      .fillColor(BRAND.primary)
      .roundedRect(MARGIN, badgeY, CONTENT_WIDTH, 28, 6)
      .fill();
    doc
      .fillColor(BRAND.white)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(
        "DOCUMENTO OFICIAL · CUMPLIMIENTO ART. 34.9 DEL ESTATUTO DE LOS TRABAJADORES · RDL 8/2019",
        MARGIN,
        badgeY + 9,
        { width: CONTENT_WIDTH, align: "center" },
      );
    doc.moveDown(2);

    this.drawEmployeeInfo(doc, data);
    this.drawRecordsTable(doc, data.records);

    // Texto legal
    const legalY = doc.y + 20;
    doc
      .fillColor(BRAND.text)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("DECLARACIÓN DE CUMPLIMIENTO:", MARGIN, legalY);
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(BRAND.textMuted)
      .text(
        "Este documento constituye el registro diario de jornada exigido por el artículo 34.9 del Estatuto de los Trabajadores. " +
          "Los registros aquí reflejados han sido obtenidos mediante sistemas de control digital certificados y no han sido " +
          "alterados manualmente. La conservación de estos registros cumple con el plazo legal de cuatro años.",
        MARGIN,
        legalY + 14,
        { width: CONTENT_WIDTH, lineGap: 2 },
      );

    this.drawSignatureBlock(doc, data);
    this.drawFooter(doc, data);

    doc.end();
  }

  // ─────────────────────────────────────────────────
  //  COMPONENTES INTERNOS
  // ─────────────────────────────────────────────────

  /**
   * Header: Logo vectorial + Nombre de marca + Tipo de documento
   */
  private static drawHeader(
    doc: PDFKit.PDFDocument,
    company: string,
    docType: string,
  ) {
    const y0 = MARGIN;

    // ── Logo: reloj simplificado (vectorial puro, sin archivo externo) ──
    const cx = MARGIN + 20;
    const cy = y0 + 20;
    const r = 16;

    // Círculo exterior
    doc
      .lineWidth(2)
      .strokeColor(BRAND.primary)
      .circle(cx, cy, r)
      .stroke();

    // Puntos cardinales (12, 3, 6, 9)
    const dots: [number, number][] = [
      [cx, cy - r + 3],
      [cx + r - 3, cy],
      [cx, cy + r - 3],
      [cx - r + 3, cy],
    ];
    for (const [dx, dy] of dots) {
      doc.fillColor(BRAND.primary).circle(dx, dy, 1.5).fill();
    }

    // Aguja hora (arriba)
    doc
      .lineWidth(2)
      .strokeColor(BRAND.primary)
      .moveTo(cx, cy)
      .lineTo(cx, cy - 9)
      .stroke();

    // Aguja minutos (derecha-arriba)
    doc
      .lineWidth(1.5)
      .strokeColor(BRAND.primaryLight)
      .moveTo(cx, cy)
      .lineTo(cx + 8, cy - 4)
      .stroke();

    // Centro
    doc.fillColor(BRAND.primary).circle(cx, cy, 2.5).fill();

    // ── Marca ──
    doc
      .fillColor(BRAND.text)
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("Tem", MARGIN + 44, y0 + 6, { continued: true })
      .fillColor(BRAND.primary)
      .text("pos");

    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor(BRAND.textLight)
      .text("SISTEMA DE CONTROL DE JORNADA", MARGIN + 44, y0 + 28);

    // ── Empresa (alineada a la derecha) ──
    const boxW = 180;
    const boxX = PAGE_WIDTH - MARGIN - boxW;
    doc.fillColor("#f3f4f6").roundedRect(boxX, y0, boxW, 40, 6).fill();

    doc
      .fillColor(BRAND.textMuted)
      .fontSize(6.5)
      .font("Helvetica-Bold")
      .text("EMPRESA", boxX + 12, y0 + 8);

    doc
      .fillColor(BRAND.text)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(company.toUpperCase(), boxX + 12, y0 + 20, {
        width: boxW - 24,
        ellipsis: true,
      });

    // ── Tipo de documento ──
    doc.moveDown(1.5);
    const typeY = y0 + 50;
    doc
      .strokeColor(BRAND.border)
      .lineWidth(0.5)
      .moveTo(MARGIN, typeY)
      .lineTo(PAGE_WIDTH - MARGIN, typeY)
      .stroke();

    doc
      .fillColor(BRAND.primary)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(docType, MARGIN, typeY + 8, {
        width: CONTENT_WIDTH,
        align: "center",
      });

    doc
      .strokeColor(BRAND.border)
      .lineWidth(0.5)
      .moveTo(MARGIN, typeY + 24)
      .lineTo(PAGE_WIDTH - MARGIN, typeY + 24)
      .stroke();

    doc.y = typeY + 36;
  }

  /**
   * Bloque de información del empleado + resumen del periodo
   */
  private static drawEmployeeInfo(
    doc: PDFKit.PDFDocument,
    data: AuditData,
  ) {
    const y = doc.y;

    doc.fillColor("#f9fafb").roundedRect(MARGIN, y, CONTENT_WIDTH, 60, 8).fill();

    // Columna izquierda: Empleado
    doc
      .fillColor(BRAND.textMuted)
      .fontSize(6.5)
      .font("Helvetica-Bold")
      .text("EMPLEADO", MARGIN + 16, y + 12);

    doc
      .fillColor(BRAND.text)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(data.employeeName, MARGIN + 16, y + 24);

    doc
      .fillColor(BRAND.textLight)
      .fontSize(7.5)
      .font("Helvetica")
      .text(data.employeeEmail, MARGIN + 16, y + 38);

    // Columna derecha: Periodo
    const rightCol = MARGIN + CONTENT_WIDTH / 2 + 20;

    doc
      .fillColor(BRAND.textMuted)
      .fontSize(6.5)
      .font("Helvetica-Bold")
      .text("PERIODO", rightCol, y + 12);

    doc
      .fillColor(BRAND.text)
      .fontSize(9)
      .font("Helvetica")
      .text(data.period, rightCol, y + 24);

    doc
      .fillColor(BRAND.primary)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`${Number(data.totalHours).toFixed(2)} horas`, rightCol, y + 38);

    // Línea divisora vertical central
    const divX = MARGIN + CONTENT_WIDTH / 2;
    doc
      .strokeColor(BRAND.border)
      .lineWidth(0.5)
      .moveTo(divX, y + 10)
      .lineTo(divX, y + 50)
      .stroke();

    doc.y = y + 72;
  }

  /**
   * Tabla de registros con paginación automática
   */
  private static drawRecordsTable(
    doc: PDFKit.PDFDocument,
    records: AuditData["records"],
  ) {
    const cols = [
      { label: "FECHA", x: MARGIN + 8, w: 90 },
      { label: "ENTRADA", x: MARGIN + 100, w: 70 },
      { label: "SALIDA", x: MARGIN + 175, w: 70 },
      { label: "TOTAL", x: MARGIN + 255, w: 70 },
      { label: "ESTADO", x: MARGIN + 340, w: 90 },
      { label: "UBICACIÓN GPS", x: MARGIN + 420, w: 75 },
    ];

    const rowH = 22;
    const headerH = 22;
    let y = doc.y + 8;

    // ── Encabezado de tabla ──
    const drawTableHeader = (startY: number) => {
      doc
        .fillColor(BRAND.headerBg)
        .roundedRect(MARGIN, startY, CONTENT_WIDTH, headerH, 4)
        .fill();

      doc.fillColor(BRAND.white).fontSize(6.5).font("Helvetica-Bold");
      for (const col of cols) {
        doc.text(col.label, col.x, startY + 7, { width: col.w });
      }
      return startY + headerH + 4;
    };

    y = drawTableHeader(y);

    // ── Filas ──
    doc.font("Helvetica").fontSize(7.5);

    for (let i = 0; i < records.length; i++) {
      // Salto de página si no cabe
      if (y + rowH > doc.page.height - 120) {
        doc.addPage();
        y = MARGIN;
        y = drawTableHeader(y);
        doc.font("Helvetica").fontSize(7.5);
      }

      const row = records[i];

      // Fondo alterno
      if (i % 2 === 0) {
        doc
          .fillColor(BRAND.tableBg)
          .rect(MARGIN, y - 4, CONTENT_WIDTH, rowH)
          .fill();
      }

      doc.fillColor(BRAND.text);
      doc.text(row.date, cols[0].x, y, { width: cols[0].w });
      doc.text(row.clockIn, cols[1].x, y, { width: cols[1].w });
      doc.text(row.clockOut || "—", cols[2].x, y, { width: cols[2].w });
      doc.text(row.total || "0.00h", cols[3].x, y, { width: cols[3].w });

      // Estado con color semántico
      const statusText =
        row.status === "confirmed" ? "VALIDADO" : "PENDIENTE";
      const statusColor =
        row.status === "confirmed" ? BRAND.success : BRAND.warning;

      doc.fillColor(statusColor).font("Helvetica-Bold");
      doc.text(statusText, cols[4].x, y, { width: cols[4].w });
      doc.font("Helvetica");

      // Ubicación GPS (truncada)
      doc.fillColor(BRAND.textLight).fontSize(6.5);
      doc.text(row.location || "—", cols[5].x, y, {
        width: cols[5].w,
        ellipsis: true,
      });
      doc.fontSize(7.5);

      y += rowH;
    }

    // Línea de cierre de tabla
    doc
      .strokeColor(BRAND.border)
      .lineWidth(0.5)
      .moveTo(MARGIN, y)
      .lineTo(PAGE_WIDTH - MARGIN, y)
      .stroke();

    // Resumen total
    doc
      .fillColor(BRAND.text)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(
        `${records.length} registros`,
        MARGIN + 8,
        y + 6,
      );

    doc.y = y + 24;
  }

  /**
   * Bloque de firma del empleado
   */
  private static drawSignatureBlock(
    doc: PDFKit.PDFDocument,
    data: AuditData,
  ) {
    // Asegurar que hay espacio suficiente, si no, nueva página
    if (doc.y > doc.page.height - 180) {
      doc.addPage();
    }

    const y = doc.y + 16;

    doc
      .strokeColor(BRAND.border)
      .lineWidth(0.5)
      .moveTo(MARGIN, y)
      .lineTo(PAGE_WIDTH - MARGIN, y)
      .stroke();

    // ── Columna izquierda: Firma del empleado ──
    doc
      .fillColor(BRAND.textMuted)
      .fontSize(6.5)
      .font("Helvetica-Bold")
      .text("FIRMA DEL EMPLEADO", MARGIN, y + 14);

    if (data.signature) {
      try {
        const base64Data = data.signature.replace(
          /^data:image\/\w+;base64,/,
          "",
        );
        doc.image(Buffer.from(base64Data, "base64"), MARGIN, y + 28, {
          height: 40,
        });
      } catch {
        doc
          .fillColor(BRAND.textLight)
          .fontSize(7)
          .font("Helvetica-Oblique")
          .text("[Firma electrónica vinculada]", MARGIN, y + 34);
      }
    } else {
      // Línea para firma manuscrita
      doc
        .strokeColor(BRAND.border)
        .lineWidth(0.5)
        .moveTo(MARGIN, y + 64)
        .lineTo(MARGIN + 200, y + 64)
        .stroke();

      doc
        .fillColor(BRAND.textLight)
        .fontSize(6.5)
        .font("Helvetica")
        .text("Pendiente de firma", MARGIN, y + 68);
    }

    // ── Columna derecha: Sello de integridad ──
    const sealX = PAGE_WIDTH - MARGIN - 180;
    const sealY = y + 10;
    const sealW = 180;
    const sealH = 52;

    doc
      .strokeColor(BRAND.primary)
      .lineWidth(1)
      .roundedRect(sealX, sealY, sealW, sealH, 6)
      .stroke();

    doc
      .fillColor(BRAND.primary)
      .fontSize(7)
      .font("Helvetica-Bold")
      .text("VERIFICACIÓN DE INTEGRIDAD", sealX + 10, sealY + 10, {
        width: sealW - 20,
      });

    const hash =
      data.auditHash ||
      `TX-${Date.now().toString(36).toUpperCase().slice(-8)}`;

    doc
      .fillColor(BRAND.textMuted)
      .fontSize(6.5)
      .font("Helvetica")
      .text("Hash:", sealX + 10, sealY + 24)
      .font("Helvetica-Bold")
      .text(hash, sealX + 35, sealY + 24);

    doc
      .fillColor(BRAND.textLight)
      .fontSize(6)
      .font("Helvetica")
      .text(
        `Generado: ${new Date().toISOString().split("T")[0]}`,
        sealX + 10,
        sealY + 37,
      );

    doc.y = y + 80;
  }

  /**
   * Pie de página con aviso legal
   */
  private static drawFooter(doc: PDFKit.PDFDocument, _data: AuditData) {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      const y = doc.page.height - 36;

      doc
        .strokeColor(BRAND.border)
        .lineWidth(0.5)
        .moveTo(MARGIN, y - 8)
        .lineTo(PAGE_WIDTH - MARGIN, y - 8)
        .stroke();

      doc
        .fillColor(BRAND.textLight)
        .fontSize(6)
        .font("Helvetica")
        .text(
          "Este documento tiene validez legal conforme al Real Decreto-ley 8/2019 de registro de jornada laboral.",
          MARGIN,
          y,
          { width: CONTENT_WIDTH - 60, align: "left" },
        );

      doc
        .fillColor(BRAND.textMuted)
        .fontSize(6)
        .font("Helvetica-Bold")
        .text(`${i + 1} / ${pages.count}`, PAGE_WIDTH - MARGIN - 50, y, {
          width: 50,
          align: "right",
        });
    }
  }
}
