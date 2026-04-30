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

    // --- Header ---
    doc
      .fillColor("#444444")
      .fontSize(20)
      .text("REGISTRO DIARIO DE JORNADA", { align: "center" });
    doc
      .fontSize(10)
      .text("CUMPLIMIENTO ARTÍCULO 34.9 DEL ESTATUTO DE LOS TRABAJADORES", {
        align: "center",
      });
    doc.moveDown();

    doc.rect(50, doc.y, 495, 1).fill("#EEEEEE");
    doc.moveDown();

    // --- Enterprise & Employee Info ---
    doc.fillColor("#333333").fontSize(10).font("Helvetica-Bold");
    doc
      .text(`EMPRESA:`, 50, doc.y, { continued: true })
      .font("Helvetica")
      .text(` ${employerName}`);
    doc
      .font("Helvetica-Bold")
      .text(`SOFTWARE:`, { continued: true })
      .font("Helvetica")
      .text(` Tempos (Control Horario)`);

    if (targetUser) {
      doc
        .font("Helvetica-Bold")
        .text(`EMPLEADO:`, { continued: true })
        .font("Helvetica")
        .text(` ${targetUser.displayName} (${targetUser.email})`);
      doc
        .font("Helvetica-Bold")
        .text(`UID:`, { continued: true })
        .font("Helvetica")
        .text(` ${targetUser.uid}`);
    } else {
      doc
        .font("Helvetica-Bold")
        .text(`REPORTE:`, { continued: true })
        .font("Helvetica")
        .text(` Global de Empresa`);
    }

    doc
      .font("Helvetica-Bold")
      .text(`FECHA INFORME:`, { continued: true })
      .font("Helvetica")
      .text(` ${new Date().toLocaleString("es-ES")}`);
    doc.moveDown();

    doc.rect(50, doc.y, 495, 20).fill("#F8F9FA");
    doc
      .fillColor("#333333")
      .font("Helvetica-Bold")
      .text("RESUMEN DEL PERIODO", 60, doc.y - 15);
    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Total Jornadas: ${fichas.length}`, 60);
    doc.text(`Horas Efectivas Confirmadas: ${totalHours.toFixed(2)}h`, 60);
    doc.moveDown();

    // --- Table Header ---
    const tableTop = doc.y + 10;
    doc.rect(50, tableTop, 495, 20).fill("#3B82F6");
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
    doc.text("FECHA", 60, tableTop + 6);
    doc.text("INICIO", 160, tableTop + 6);
    doc.text("FIN", 230, tableTop + 6);
    doc.text("HORAS", 300, tableTop + 6);
    doc.text("PROYECTO", 370, tableTop + 6);
    doc.text("ESTADO", 470, tableTop + 6);

    // --- Table Rows ---
    let y = tableTop + 25;
    doc.fillColor("#333333").font("Helvetica").fontSize(9);

    fichas.forEach((f, i) => {
      // Background for zebra effect
      if (i % 2 === 0) {
        doc.rect(50, y - 5, 495, 20).fill("#F3F4F6");
        doc.fillColor("#333333");
      }

      const rawDate = f.date as unknown as string | Date;
      const dateStr =
        typeof rawDate === "string"
          ? rawDate.split("T")[0]
          : (rawDate as Date).toISOString().split("T")[0];

      doc.text(dateStr, 60, y);
      doc.text(f.startTime, 160, y);
      doc.text(f.endTime || "--:--", 230, y);
      doc.text(`${f.hoursWorked || 0}h`, 300, y);
      doc.text((f.projectCode || "N/A").substring(0, 15), 370, y);
      doc.text(f.status.toUpperCase(), 470, y);

      y += 20;

      // New page if needed
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    // --- Footer & Signatures ---
    if (y > 600) doc.addPage();

    const footerY = 650;
    doc.rect(50, footerY - 40, 495, 1).fill("#EEEEEE");

    doc
      .fillColor("#777777")
      .fontSize(8)
      .text(
        "DECLARACIÓN: Los datos aquí contenidos son un fiel reflejo de la jornada laboral registrada. Este informe ha sido generado digitalmente mediante firma electrónica de eventos atómicos y es íntegro e inalterable en su origen conforme al RDL 8/2019.",
        50,
        footerY - 30,
        { align: "justify", width: 495 },
      );

    doc.moveDown(4);
    const sigY = doc.y;
    doc.fillColor("#333333").fontSize(10);
    doc.text("Firma del Trabajador/a", 100, sigY);
    doc.text("Firma de la Empresa / Sello", 350, sigY);

    doc.rect(80, sigY + 20, 150, 0.5).stroke();
    doc.rect(330, sigY + 20, 150, 0.5).stroke();

    doc.end();
  });
}
