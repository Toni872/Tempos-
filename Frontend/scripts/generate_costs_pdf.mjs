import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const outDir = path.resolve('..');
const outputFile = path.join(outDir, 'Costes_Lanzamiento_Produccion_Tempos.pdf');

const doc = new PDFDocument({
  size: 'A4',
  margin: 48,
  info: {
    Title: 'Costes de Lanzamiento a Produccion - Tempos',
    Author: 'Tempos',
    Subject: 'Control de costes de lanzamiento en produccion — Stack Google Cloud',
    Keywords: 'costes, produccion, app, pwa, capacitor, android, google cloud',
  },
});

doc.pipe(fs.createWriteStream(outputFile));

const colors = {
  title: '#0b0f19',
  text: '#1f2937',
  muted: '#6b7280',
  accent: '#1d4ed8',
  line: '#d1d5db',
};

const euro = (n) => `${n.toLocaleString('es-ES')} EUR`;

const assumptions = [
  'Plataforma objetivo: Android (Google Play) + Web/PWA. Sin iOS ni Apple Developer.',
  'Stack 100% Google Cloud: Firebase Hosting, Cloud Run, Cloud SQL, Firebase Auth, GCS.',
  'Region principal: europe-west1 (Belgica) — la mas economica; europe-southwest1 (Madrid) ~10% mas cara.',
  'Equipo pequeno (fundador + soporte externo puntual). Sin oficina fisica.',
  'Comision Google Play: 15% para los primeros 1M USD/ano de ingresos en suscripciones.',
  'Pasarela de pago: Stripe — 1,5% + 0,25 EUR (tarjetas EU) | no incluida en costes fijos.',
  'Esc. MVP = solo lo imprescindible para lanzar | Esc. Max = plan de crecimiento con margen.',
  'Precios GCP en EUR segun tarifa publica Google Cloud (marzo 2026).',
];

// ── ONE-SHOT ─────────────────────────────────────
// [Concepto + proveedor, min EUR, max EUR]
const oneTimeCosts = [
  ['Google Play Developer Account (pago unico — Google)', 25, 25],
  ['Dominio .es o .com 1 ano (Google Domains / Namecheap)', 10, 25],
  ['Diseno: branding, icono app, capturas Play Store (freelance)', 200, 1500],
  ['Legal: politica privacidad, terminos, cookies, RGPD (gestor)', 400, 1500],
  ['QA pre-lanzamiento en dispositivos Android reales (opcional)', 0, 1000],
  ['Dispositivo Android fisico de prueba (si no disponible)', 0, 400],
  ['Configuracion inicial Google Cloud (proyecto, IAM, billing alerts)', 0, 300],
];

// ── MENSUAL ──────────────────────────────────────
// [Concepto + proveedor (GCP o SaaS complementario), min EUR/mes, max EUR/mes]
const monthlyCosts = [
  // ─ Google Cloud — Infraestructura
  ['Firebase Hosting (CDN global — Spark free/Blaze pay-as-you-go)', 0, 10],
  ['Cloud Run backend/API (2M req gratis; ~€0,40 por M req extra)', 0, 40],
  ['Cloud SQL PostgreSQL db-g1-small europe-west1 (minimo facturado)', 15, 80],
  ['Cloud Storage (backups, ficheros — 5GB gratis, luego €0,020/GB)', 0, 15],
  ['Firebase Authentication (gratis hasta 50K MAU activos/mes)', 0, 0],
  ['Firebase Crashlytics — seguimiento errores app Android (gratis)', 0, 0],
  ['Google Cloud Logging + Monitoring (incluido en nivel gratuito)', 0, 20],
  ['Secret Manager (secretos y variables de entorno — ~€0,06/10K ops)', 0, 5],
  ['Cloud CDN / Load Balancer (si se activa para la API)', 0, 18],
  // ─ Comunicaciones (fuera de GCP)
  ['Email transaccional (Resend — Free 3K/mes, Pro desde €18/mes)', 0, 18],
  ['Email marketing (Brevo — Free 300/dia, Starter €8/mes)', 0, 8],
  ['SMS alertas de fichaje (Twilio — ~€0,055/SMS)', 0, 100],
  // ─ Producto / herramientas
  ['GitHub (Free para repos privados; Team €3,5/user si se necesita)', 0, 8],
  ['Figma (Free 3 ficheros; Professional €12/editor/mes)', 0, 12],
  ['Soporte usuarios (Crisp — Free widget, Pro €25/mes)', 0, 25],
  ['Error tracking web (Sentry — Free 5K errores/mes, Team €23/mes)', 0, 23],
  // ─ Finanzas / legal
  ['Contabilidad / gestoria autonomo/SL (Declarando / Quipu)', 50, 100],
  // ─ Marketing
  ['Google Ads (busqueda de marca + palabras clave sector)', 100, 2000],
];

// ── ANUAL FIJO ───────────────────────────────────
// [Concepto + proveedor, min EUR/ano, max EUR/ano]
const annualFixed = [
  ['Play Store: sin renovacion (pago unico ya contabilizado)', 0, 0],
  ['Dominio(s) y renovacion (Google Domains / Namecheap)', 10, 50],
  ['Seguro RC digital autonomo (AXA / Zurich)', 150, 600],
  ['Servicios/licencias anuales varios (herramientas, fonts, etc.)', 0, 400],
];

const riskBufferPct = [10, 25];

function drawHeader() {
  doc
    .fillColor(colors.title)
    .font('Helvetica-Bold')
    .fontSize(20)
    .text('Control de Costes - Lanzamiento a Produccion', { align: 'left' });

  doc
    .moveDown(0.2)
    .fillColor(colors.accent)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text('Proyecto: Tempos  |  Stack: Google Cloud + Android');

  doc
    .fillColor(colors.muted)
    .font('Helvetica')
    .fontSize(10)
    .text(`Fecha de generacion: ${new Date().toLocaleDateString('es-ES')}`);

  doc.moveDown(0.8);
  const y = doc.y;
  doc
    .moveTo(48, y)
    .lineTo(547, y)
    .lineWidth(1)
    .strokeColor(colors.line)
    .stroke();
  doc.moveDown(0.8);
}

function sectionTitle(title) {
  ensurePageSpace(70);
  doc
    .fillColor(colors.title)
    .font('Helvetica-Bold')
    .fontSize(13)
    .text(title);
  doc.moveDown(0.35);
}

function ensurePageSpace(heightNeeded) {
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + heightNeeded > bottomLimit) {
    doc.addPage();
  }
}

function bulletList(items) {
  doc.font('Helvetica').fontSize(10.5).fillColor(colors.text);
  for (const item of items) {
    ensurePageSpace(24);
    doc.text(`- ${item}`, { indent: 8 });
  }
  doc.moveDown(0.4);
}

function table(rows, options = {}) {
  const xLabel = 52;
  const xMin = options.xMin ?? 360;
  const xMax = options.xMax ?? 455;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.muted);
  ensurePageSpace(22);
  doc.text(options.headerLabel ?? 'Concepto', xLabel, doc.y);
  doc.text(options.headerMin ?? 'Min', xMin, doc.y, { width: 80, align: 'right' });
  doc.text(options.headerMax ?? 'Max', xMax, doc.y, { width: 80, align: 'right' });
  doc.moveDown(0.25);

  const y = doc.y;
  doc
    .moveTo(48, y)
    .lineTo(547, y)
    .lineWidth(0.7)
    .strokeColor(colors.line)
    .stroke();
  doc.moveDown(0.35);

  doc.font('Helvetica').fontSize(10.2).fillColor(colors.text);
  for (const row of rows) {
    ensurePageSpace(22);
    const [label, min, max] = row;
    const topY = doc.y;
    doc.text(label, xLabel, topY, { width: 295, align: 'left' });
    doc.text(euro(min), xMin, topY, { width: 80, align: 'right' });
    doc.text(euro(max), xMax, topY, { width: 80, align: 'right' });
    doc.y = Math.max(doc.y, topY + 16);
  }

  doc.moveDown(0.4);
}

function sumRange(rows) {
  return rows.reduce(
    (acc, row) => {
      acc.min += row[1];
      acc.max += row[2];
      return acc;
    },
    { min: 0, max: 0 }
  );
}

function summaryBox(lines) {
  ensurePageSpace(95);
  const startY = doc.y;
  const x = 48;
  const width = 499;
  doc
    .roundedRect(x, startY, width, 78, 8)
    .lineWidth(1)
    .strokeColor('#bfdbfe')
    .fillAndStroke('#eff6ff', '#bfdbfe');

  let y = startY + 10;
  for (const line of lines) {
    doc
      .fillColor(colors.title)
      .font(line.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(line.size || 10.5)
      .text(line.text, x + 12, y, { width: width - 24, align: 'left' });
    y += 18;
  }
  doc.y = startY + 90;
}

// Document body

drawHeader();

sectionTitle('1) Supuestos base — Stack Google Cloud, solo Android');
bulletList(assumptions);

sectionTitle('2) Costes iniciales (one-shot)');
table(oneTimeCosts, {
  headerLabel: 'Concepto',
  headerMin: 'Esc. Min',
  headerMax: 'Esc. Max',
});

const oneShot = sumRange(oneTimeCosts);

doc
  .font('Helvetica-Bold')
  .fontSize(10.5)
  .fillColor(colors.accent)
  .text(`Total costes iniciales: ${euro(oneShot.min)} - ${euro(oneShot.max)}`);
doc.moveDown(0.7);

sectionTitle('3) Costes mensuales operativos');
table(monthlyCosts, {
  headerLabel: 'Concepto mensual',
  headerMin: 'Min/mes',
  headerMax: 'Max/mes',
});

const monthly = sumRange(monthlyCosts);

doc
  .font('Helvetica-Bold')
  .fontSize(10.5)
  .fillColor(colors.accent)
  .text(`Total mensual operativo: ${euro(monthly.min)} - ${euro(monthly.max)}`);
doc.moveDown(0.7);

sectionTitle('4) Costes anuales fijos');
table(annualFixed, {
  headerLabel: 'Concepto anual',
  headerMin: 'Min/ano',
  headerMax: 'Max/ano',
});

const annual = sumRange(annualFixed);

doc
  .font('Helvetica-Bold')
  .fontSize(10.5)
  .fillColor(colors.accent)
  .text(`Total anual fijo: ${euro(annual.min)} - ${euro(annual.max)}`);
doc.moveDown(0.8);

const firstYearNoBuffer = {
  min: oneShot.min + monthly.min * 12 + annual.min,
  max: oneShot.max + monthly.max * 12 + annual.max,
};

const firstYearWithBuffer = {
  min: Math.round(firstYearNoBuffer.min * (1 + riskBufferPct[0] / 100)),
  max: Math.round(firstYearNoBuffer.max * (1 + riskBufferPct[1] / 100)),
};

sectionTitle('5) Presupuesto anual de lanzamiento (12 meses)');
summaryBox([
  { text: `Sin colchon de riesgo: ${euro(firstYearNoBuffer.min)} - ${euro(firstYearNoBuffer.max)}`, bold: true },
  { text: `Con colchon (${riskBufferPct[0]}% a ${riskBufferPct[1]}%): ${euro(firstYearWithBuffer.min)} - ${euro(firstYearWithBuffer.max)}`, bold: true },
  { text: 'Recomendacion: planificar caja minima de 9-12 meses antes de escalar adquisicion.', bold: false },
]);

sectionTitle('6) Servicios GCP que escalan con el uso (vigilar)');  
bulletList([
  'Cloud Run: facturado por CPU+memoria consumidas. Con trafico bajo es casi gratis.',
  'Cloud SQL: la instancia factura aunque este parada. Considerar apagar en dev/staging.',
  'Cloud Storage: €0,020/GB/mes. Los backups diarios de Postgres pueden acumularse.',
  'Firebase Auth: gratuito hasta 50K MAU/mes. Superado ese limite: €0,0055/MAU.',
  'Stripe: 1,5% + €0,25 por cobro para tarjetas europeas. Con 10 clientes a €20: ~€3,25/mes.',
  'Google Play: 15% sobre ingresos por suscripcion en la tienda (primeros 1M USD/ano).',
  'Cloud Logging: los primeros 50GB/mes gratis; luego €0,50/GB.',
]);

sectionTitle('7) Hoja de ruta de costes GCP por fase');
bulletList([
  'FASE 0 — Desarrollo (gratis): Firebase Spark free tier, Cloud Run local/emulador, Supabase free para prototipo.',
  'FASE 1 — MVP (€15-80/mes): Cloud Run activo, Cloud SQL db-g1-small, Firebase Hosting Blaze pay-as-you-go.',
  'FASE 2 — 100 usuarios (€80-200/mes): Cloud SQL sube a db-n1-standard-1, logs activos, Sentry Team.',
  'FASE 3 — 1.000 usuarios (€200-600/mes): Cloud SQL HA, Cloud Armor WAF, CDN activo, Redis Memorystore.',
  'Regla practica: activa Billing Budget Alerts en GCP (€20 / €50 / €100) antes del dia 1.',
  'Usa gcloud billing budgets create para configurar alertas por email automaticas.',
]);

sectionTitle('8) Control financiero recomendado (mensual)');
bulletList([
  'Separar CAPEX inicial de OPEX mensual en tu hoja de finanzas.',
  'Medir CAC, LTV, churn, MRR y margen bruto cada mes.',
  'Definir umbral de alerta cuando los costes GCP superen el 30% del MRR.',
  'Revisar trimestralmente: Cloud SQL (tamano instancia), Cloud Run (min-instances), logs retenidos.',
]);

ensurePageSpace(60);
const footerY = doc.page.height - doc.page.margins.bottom - 18;
doc
  .font('Helvetica-Oblique')
  .fontSize(9)
  .fillColor(colors.muted)
  .text(
    'Documento de control estimado. Ajustar con facturas reales y contratos de proveedor.',
    48,
    footerY,
    { width: 500, align: 'left' }
  );

doc.end();

console.log(`PDF generado en: ${outputFile}`);
