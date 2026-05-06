import PDFDocument from 'pdfkit';
import { Response } from 'express';

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
  signature?: string; // Base64 de la firma
  auditHash?: string;
}

export class PdfService {
  /**
   * Genera un informe de auditoría legal en PDF
   */
  static async generateAuditPDF(res: Response, data: AuditData): Promise<void> {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: `Informe de Auditoría - ${data.employeeName}`,
        Author: 'Tempos Cloud',
      }
    });

    // Pipe del documento a la respuesta Express
    doc.pipe(res);

    // --- HEADER ---
    this.generateHeader(doc, data.companyName);

    // --- INFO BOX ---
    this.generateInfoBox(doc, data);

    // --- RECORDS TABLE ---
    this.generateTable(doc, data.records);

    // --- SIGNATURE & FOOTER ---
    this.generateFooter(doc, data);

    doc.end();
  }

  private static generateHeader(doc: PDFKit.PDFDocument, company: string) {
    // Dibujamos un logo minimalista (un círculo con la T de Tempos)
    doc.fillColor('#6366f1')
       .circle(70, 70, 25)
       .fill();
    
    doc.fillColor('#ffffff')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('T', 61, 58);

    doc.fillColor('#111827')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('TEMPOS', 110, 55);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Registro Legal de Jornada', 110, 75);

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#111827')
       .text(company.toUpperCase(), 400, 55, { align: 'right' });

    doc.moveDown(4);
    doc.strokeColor('#e5e7eb')
       .lineWidth(1)
       .moveTo(50, 110)
       .lineTo(550, 110)
       .stroke();
  }

  private static generateInfoBox(doc: PDFKit.PDFDocument, data: AuditData) {
    doc.fillColor('#f9fafb')
       .rect(50, 130, 500, 80)
       .fill();

    doc.fillColor('#111827')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('EMPLEADO:', 70, 145)
       .font('Helvetica')
       .text(data.employeeName, 150, 145)
       .font('Helvetica-Bold')
       .text('EMAIL:', 70, 160)
       .font('Helvetica')
       .text(data.employeeEmail, 150, 160);

    doc.font('Helvetica-Bold')
       .text('PERIODO:', 320, 145)
       .font('Helvetica')
       .text(data.period, 400, 145)
       .font('Helvetica-Bold')
       .text('TOTAL HORAS:', 320, 160)
       .font('Helvetica')
       .text(`${data.totalHours.toFixed(2)}h`, 400, 160);

    doc.moveDown(6);
  }

  private static generateTable(doc: PDFKit.PDFDocument, records: AuditData['records']) {
    const tableTop = 230;
    const itemHeight = 25;

    // Table Header
    doc.fillColor('#f3f4f6')
       .rect(50, tableTop, 500, 20)
       .fill();

    doc.fillColor('#374151')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('FECHA', 60, tableTop + 6)
       .text('ENTRADA', 160, tableTop + 6)
       .text('SALIDA', 260, tableTop + 6)
       .text('DURACIÓN', 360, tableTop + 6)
       .text('ESTADO', 460, tableTop + 6);

    // Rows
    let y = tableTop + 25;
    doc.font('Helvetica');

    records.forEach((row, index) => {
      // Color de fondo alterno
      if (index % 2 === 0) {
        doc.fillColor('#fdfdfd').rect(50, y - 5, 500, itemHeight).fill();
      }

      doc.fillColor('#4b5563')
         .text(row.date, 60, y)
         .text(row.clockIn, 160, y)
         .text(row.clockOut || '--:--', 260, y)
         .text(row.total || '0h', 360, y)
         .text(row.status === 'valid' ? 'VALIDADO' : 'PENDIENTE', 460, y);

      y += itemHeight;

      // Salto de página si llegamos al final
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });
  }

  private static generateFooter(doc: PDFKit.PDFDocument, data: AuditData) {
    const footerTop = doc.page.height - 150;

    doc.strokeColor('#e5e7eb')
       .moveTo(50, footerTop)
       .lineTo(550, footerTop)
       .stroke();

    if (data.signature) {
      doc.fontSize(10).font('Helvetica-Bold').text('FIRMA DEL EMPLEADO:', 50, footerTop + 20);
      try {
        // Asumiendo que signature es un dataURI base64 de PNG/JPG
        const base64Data = data.signature.replace(/^data:image\/\w+;base64,/, "");
        doc.image(Buffer.from(base64Data, 'base64'), 50, footerTop + 35, { height: 60 });
      } catch {
        doc.fontSize(8).text('[Firma Digital Registrada]', 50, footerTop + 40);
      }
    } else {
      doc.fontSize(10).font('Helvetica-Oblique').text('Pendiente de firma digital', 50, footerTop + 20);
    }

    doc.fontSize(8)
       .fillColor('#9ca3af')
       .text(`ID de Auditoría: ${data.auditHash || 'TS-' + Math.random().toString(36).substring(7).toUpperCase()}`, 50, footerTop + 100, { align: 'left' })
       .text('Documento generado electrónicamente por Tempos Cloud. Validez legal según Ley de Registro de Jornada.', 50, footerTop + 115, { align: 'center' });
  }
}
