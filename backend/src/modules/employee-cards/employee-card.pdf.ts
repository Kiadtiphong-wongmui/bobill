import puppeteer from "puppeteer-core";
import { formatThaiDate, photoToDataUrl, escapeHtml as esc, escapeInstructions as escInstructions, getSarabunFontFaceCss } from "./employee-card.pdf.helpers.js";

type EmployeeCardForPdf = {
  cardHeader: string;
  photoUrl: string | null;
  name: string;
  nationality: string;
  workPermitNo: string;
  instructions: string;
  employerName: string;
  address: string;
  issueDate: Date;
  expiryDate: Date;
  signerName: string;
  signerPosition: string;
  telephone: string;
};

// ─── HTML Template ────────────────────────────────────────────────────────────

const buildHtml = (card: EmployeeCardForPdf): string => {
  const photoDataUrl = photoToDataUrl(card.photoUrl);
  const issueStr = formatThaiDate(card.issueDate);
  const expiryStr = formatThaiDate(card.expiryDate);

  const photoHtml = photoDataUrl
    ? `<img src="${photoDataUrl}" alt="employee photo" class="photo-img" />`
    : `<div class="photo-placeholder">รูปถ่ายพนักงาน</div>`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Employee Card</title>
  <style>
    ${getSarabunFontFaceCss()}

    /* ── Reset & Page Setup ──────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 297mm;
      height: 210mm;
      font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @media print {
      @page {
        size: A4 landscape;
        margin: 0;
      }
      html, body { width: 297mm; height: 210mm; }
    }

    /* ── Page layout: two cards side by side, centered ──── */
    .page {
      width: 297mm;
      height: 210mm;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10mm;
      position: relative;
    }

    /* ── Card base ───────────────────────────────────────── */
    .card {
      width: 72mm;
      height: 103mm;
      border: 0.4pt solid #dcdcdc;
      background: #fff;
      position: relative;
      overflow: hidden;
      font-size: 9.5pt;
    }

    /* ── Cut marks ───────────────────────────────────────── */
    .cut-wrap {
      position: relative;
    }
    .cut-wrap::before,
    .cut-wrap::after {
      content: '';
      position: absolute;
      left: -6mm;
      right: -6mm;
      height: 0;
      border-top: 0.4pt dashed #aaa;
    }
    .cut-wrap::before { top: 0; }
    .cut-wrap::after  { bottom: 0; }

    .card-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    .card-col::before,
    .card-col::after {
      content: '';
      position: absolute;
      top: -6mm;
      bottom: -6mm;
      width: 0;
      border-left: 0.4pt dashed #aaa;
    }
    .card-col::before { left: 0; }
    .card-col::after  { right: 0; }

    /* ── FRONT CARD ──────────────────────────────────────── */
    .front-header {
      background: #1e40af;
      color: #fff;
      font-weight: 700;
      font-size: 10pt;
      text-align: center;
      padding: 3mm 2mm;
      line-height: 1.3;
    }

    .front-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3mm 3.5mm;
      gap: 3mm;
    }

    .photo-frame {
      width: 35mm;
      height: 44mm;
      border: 0.5pt solid #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-placeholder {
      font-size: 8pt;
      color: #aaa;
      text-align: center;
    }

    .field-block {
      width: 100%;
    }

    .field-label {
      font-size: 8pt;
      color: #777;
      font-weight: 400;
      line-height: 1.2;
    }

    .field-value {
      font-weight: 700;
      color: #000;
      border-bottom: 0.4pt dashed #aaa;
      padding-bottom: 0.5mm;
      min-height: 5mm;
      line-height: 1.3;
      word-break: break-all;
    }

    .field-value--lg {
      font-size: 11pt;
    }

    /* ── BACK CARD ───────────────────────────────────────── */
    .back-body {
      padding: 3.5mm 3.5mm;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between; /* Distribute boxes vertically */
    }

    .back-box {
      display: flex;
      flex-direction: column;
      gap: 2mm;
      width: 100%;
    }

    .back-box--sig {
      margin-top: auto; /* Push signature block to bottom */
      margin-bottom: 2mm; /* Space between signature and telephone */
      align-self: flex-end; /* Align to the right side of the card */
      width: 43mm; /* visual proportion for 72mm width */
    }

    .back-title {
      text-align: center;
      font-weight: 700;
      font-size: 10pt;
      color: #000;
    }

    .instructions {
      font-size: 8pt;
      color: #333;
      line-height: 1.45;
      flex-shrink: 0;
    }

    .inline-field {
      display: flex;
      align-items: baseline;
      gap: 1mm;
      width: 100%;
    }

    .inline-label {
      font-size: 8pt;
      color: #777;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .inline-value {
      font-weight: 700;
      font-size: 9pt;
      color: #000;
      border-bottom: 0.4pt dashed #aaa;
      flex: 1;
      min-height: 4.5mm;
      padding-bottom: 0.3mm;
      word-break: break-all;
    }

    .date-row {
      display: flex;
      align-items: baseline;
      gap: 2mm;
      flex-wrap: nowrap;
    }

    .date-row .inline-label { font-size: 7.5pt; }
    .date-row .inline-value { font-size: 8pt; flex: 0 0 auto; min-width: 14mm; }

    .sig-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.8mm;
      width: 100%;
    }

    .sig-line-row {
      display: flex;
      align-items: baseline;
      gap: 1mm;
      width: 100%;
      justify-content: center;
    }

    .sig-line {
      flex: 1;
      border-bottom: 0.4pt dashed #aaa;
      min-height: 4.5mm;
      max-width: 38mm;
    }

    .sig-name {
      font-weight: 700;
      font-size: 9pt;
      color: #000;
      text-align: center;
    }

    .sig-pos-row {
      display: flex;
      align-items: baseline;
      gap: 1mm;
      width: 100%;
      justify-content: center;
    }

    .sig-pos-value {
      font-weight: 700;
      font-size: 8.5pt;
      color: #000;
      border-bottom: 0.4pt dashed #aaa;
      min-width: 22mm;
      text-align: center;
      padding-bottom: 0.3mm;
    }

    .employer-caption {
      font-size: 7.5pt;
      color: #555;
      text-align: center;
      width: 100%;
    }

    .tel-row {
      display: flex;
      align-items: baseline;
      gap: 1mm;
    }

    .tel-value {
      font-weight: 700;
      font-size: 9pt;
      color: #000;
      border-bottom: 0.4pt dashed #aaa;
      min-width: 20mm;
      padding-bottom: 0.3mm;
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- ══ FRONT CARD ══ -->
    <div class="card-col">
      <div class="cut-wrap">
        <div class="card">
          <!-- Header band -->
          <div class="front-header">${esc(card.cardHeader)}</div>

          <!-- Body -->
          <div class="front-body">
            <!-- Photo -->
            <div class="photo-frame">
              ${photoHtml}
            </div>

            <!-- Name -->
            <div class="field-block">
              <div class="field-label">ชื่อ-นามสกุล</div>
              <div class="field-value field-value--lg">${esc(card.name)}</div>
            </div>

            <!-- Nationality -->
            <div class="field-block">
              <div class="inline-field">
                <span class="inline-label">สัญชาติ</span>
                <span class="inline-value">${esc(card.nationality)}</span>
              </div>
            </div>

            <!-- Work permit -->
            <div class="field-block">
              <div class="field-label">เลขที่ใบอนุญาตทำงาน</div>
              <div class="field-value field-value--lg">${esc(card.workPermitNo)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ BACK CARD ══ -->
    <div class="card-col">
      <div class="cut-wrap">
        <div class="card">
          <div class="back-body">
            
            <!-- Box 1: Instructions -->
            <div class="back-box">
              <div class="back-title">คำแนะนำ</div>
              <div class="instructions">${escInstructions(card.instructions)}</div>
            </div>

            <!-- Box 2: Employer Details -->
            <div class="back-box">
              <div class="inline-field">
                <span class="inline-label">ชื่อนายจ้างสถานประกอบการ</span>
                <span class="inline-value">${esc(card.employerName)}</span>
              </div>
              <div class="inline-field">
                <span class="inline-label">ตั้งอยู่เลขที่</span>
                <span class="inline-value">${esc(card.address)}</span>
              </div>
              <div class="date-row">
                <span class="inline-label">วันที่ออกบัตร</span>
                <span class="inline-value">${esc(issueStr)}</span>
                <span class="inline-label">บัตรหมดอายุ</span>
                <span class="inline-value">${esc(expiryStr)}</span>
              </div>
            </div>

            <!-- Box 3: Signature Block -->
            <div class="back-box back-box--sig">
              <div class="sig-block">
                <div class="sig-line-row">
                  <span class="inline-label">ลงชื่อ</span>
                  <span class="sig-line"></span>
                </div>
                <div class="sig-name">( ${esc(card.signerName)} )</div>
                <div class="sig-pos-row">
                  <span class="inline-label">ตำแหน่ง</span>
                  <span class="sig-pos-value">${esc(card.signerPosition)}</span>
                </div>
                <div class="employer-caption">นายจ้างผู้ออกบัตร</div>
              </div>
            </div>

            <!-- Box 4: Telephone -->
            <div class="back-box">
              <div class="tel-row">
                <span class="inline-label">โทรศัพท์</span>
                <span class="tel-value">${esc(card.telephone)}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

  </div>
</body>
</html>`;
};

// ─── Main Export ──────────────────────────────────────────────────────────────

const CHROMIUM_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH ??
  // Common fallback paths depending on the host OS
  (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/usr/bin/chromium");

/**
 * Generates an A4-landscape PDF buffer for an employee card using Puppeteer.
 * The PDF contains two cards (front & back) side-by-side with crop marks.
 */
export const generateEmployeeCardPdfBuffer = async (
  card: EmployeeCardForPdf,
): Promise<Buffer> => {
  const html = buildHtml(card);

  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // waitUntil:'load' + waitForNetworkIdle() lets Google Fonts CDN finish
    // loading before Puppeteer captures the PDF. Puppeteer v25 excludes
    // 'networkidle0' from setContent's waitUntil union type.
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForNetworkIdle({ idleTime: 500 });

    const pdfUint8Array = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
};

/**
 * @deprecated Use generateEmployeeCardPdfBuffer instead.
 * Kept for backward compatibility — pipes the PDF buffer to the stream.
 */
export const generateEmployeeCardPdfStream = async (
  card: EmployeeCardForPdf,
  stream: NodeJS.WritableStream,
): Promise<void> => {
  const buffer = await generateEmployeeCardPdfBuffer(card);
  stream.end(buffer);
};
