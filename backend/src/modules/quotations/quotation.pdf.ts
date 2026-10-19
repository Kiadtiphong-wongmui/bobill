import PDFDocument from "pdfkit";

import { decodeDataUrlImage, formatMoney, selectPdfFonts } from "../../shared/pdf-fonts.js";
import { INVOICE_PDF_CONFIG } from "../invoices/invoice-pdf.config.js";

export type QuotationForPdf = {
  quotationNumber: string;
  documentDate: Date;
  validUntil: Date;
  paymentTerms: string | null;
  sellerCompanyName: string;
  sellerAddress: string;
  sellerTaxId: string | null;
  sellerPhone: string | null;
  sellerEmail: string | null;
  includeBuyer?: boolean;
  buyerCompanyName: string | null;
  buyerAddress: string | null;
  buyerTaxId: string | null;
  subtotal: unknown;
  discountTotal: unknown;
  vatEnabled: boolean;
  vatRate: unknown;
  vatAmount: unknown;
  grandTotal: unknown;
  note: string | null;
  amountInWords: string | null;
  signatures?: unknown;
  items: Array<{
    lineNo: number;
    description: string;
    quantity: unknown;
    unitPrice: unknown;
    lineTotal: unknown;
  }>;
};

type SignatureBlock = { dottedText?: string; bracketText?: string; imageDataUrl?: string };
type QuotationSignatures = { quotedBy?: SignatureBlock; acceptedBy?: SignatureBlock };
type Fonts = ReturnType<typeof selectPdfFonts>;

export type QuotationAutoFitSettings = { fontSize: number; rowPadding: number };

const MARGIN = INVOICE_PDF_CONFIG.pageMargin;
const CELL_PADDING_X = 4;
const TABLE_HEADER_HEIGHT = 24;
const TABLE_HEADERS = ["ลำดับ", "รายการสินค้า / บริการ", "จำนวน", "ราคา / หน่วย", "จำนวนเงิน"] as const;
const MIN_FONT_SIZE = 8;
const SIZE_BODY = 9;
const SIGNATURE_HEIGHT = 72;
const FOOTER_BOTTOM = 8;
const SUMMARY_ROW_HEIGHT = 12;
const SUMMARY_ROW_GAP = 1;
const NOTE_COLOR = "#c0392b";

const lineGap = (size: number): number => -size * 0.7;

export const getQuotationAutoFitSettings = (itemCount: number): QuotationAutoFitSettings => {
  if (!Number.isInteger(itemCount) || itemCount < 0) {
    throw new RangeError("Quotation item count must be a non-negative integer");
  }
  if (itemCount <= 10) return { fontSize: 12, rowPadding: 6 };
  if (itemCount <= 18) return { fontSize: 11, rowPadding: 4 };
  if (itemCount <= 28) return { fontSize: 10, rowPadding: 2 };
  if (itemCount <= 38) return { fontSize: 9, rowPadding: 1 };
  return { fontSize: 8, rowPadding: 1 };
};

const measure = (doc: PDFKit.PDFDocument, text: string, width: number, font: string, size: number): number => {
  doc.font(font).fontSize(size);
  return doc.heightOfString(text, { width, lineGap: lineGap(size) });
};

const write = (
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  font: string,
  size: number,
  align: "left" | "center" | "right" = "left",
): number => {
  const height = measure(doc, text, width, font, size);
  doc.font(font).fontSize(size).text(text, x, y, { width, align, lineGap: lineGap(size) });
  return height;
};

const formatDate = (date: Date): string => date.toLocaleDateString("th-TH");

const drawHeader = (doc: PDFKit.PDFDocument, q: QuotationForPdf, fonts: Fonts): number => {
  const width = doc.page.width - MARGIN * 2;
  let y = MARGIN;
  y += write(doc, q.sellerCompanyName, MARGIN, y, width, fonts.bold, 16, "center") + 7;
  y += write(doc, q.sellerAddress, MARGIN, y, width, fonts.regular, 11, "center") + 7;
  y += write(
    doc,
    `เลขประจำตัวผู้เสียภาษี: ${q.sellerTaxId ?? "-"}   เบอร์โทร: ${q.sellerPhone ?? "-"}   อีเมล: ${q.sellerEmail ?? "-"}`,
    MARGIN,
    y,
    width,
    fonts.regular,
    11,
    "center",
  ) + 16;
  y += write(doc, "ใบเสนอราคา", MARGIN, y, width, fonts.bold, 18, "center") + 16;

  const details = [
    `เลขที่ใบเสนอราคา: ${q.quotationNumber}`,
    `วันที่: ${formatDate(q.documentDate)}   ใช้ได้ถึงวันที่: ${formatDate(q.validUntil)}`,
    `เงื่อนไขการชำระเงิน: ${q.paymentTerms ?? "-"}`,
  ];
  if (q.includeBuyer !== false) {
    details.push(
      `ลูกค้า: ${q.buyerCompanyName ?? "-"}`,
      `ที่อยู่: ${q.buyerAddress ?? "-"}`,
      `เลขประจำตัวผู้เสียภาษี: ${q.buyerTaxId ?? "-"}`,
    );
  }
  for (const detail of details) {
    y += write(doc, detail, MARGIN, y, width, fonts.regular, SIZE_BODY + 1) + 6;
    if (detail.startsWith("เงื่อนไขการชำระเงิน")) y += 8;
  }
  return y + 10;
};

const rowValues = (row: QuotationForPdf["items"][number]): string[] => [
  String(row.lineNo),
  row.description || "-",
  formatMoney(row.quantity),
  formatMoney(row.unitPrice),
  formatMoney(row.lineTotal),
];

const tableWidths = (doc: PDFKit.PDFDocument): number[] => {
  const width = doc.page.width - MARGIN * 2;
  return [width * 0.07, width * 0.45, width * 0.12, width * 0.17, width * 0.19];
};

const rowHeight = (
  doc: PDFKit.PDFDocument,
  row: QuotationForPdf["items"][number],
  widths: number[],
  font: string,
  size: number,
  padding: number,
): number => {
  const textHeight = rowValues(row).reduce(
    (largest, value, i) => Math.max(largest, measure(doc, value, (widths[i] ?? 0) - CELL_PADDING_X * 2, font, size)),
    0,
  );
  return Math.ceil(textHeight + padding * 1.75 * 2);
};

const summaryLines = (q: QuotationForPdf): Array<{ label: string; value: string; bold: boolean }> => {
  const lines = [
    { label: "รวมเงิน", value: formatMoney(q.subtotal), bold: false },
    { label: "ส่วนลด", value: formatMoney(q.discountTotal), bold: false },
  ];
  if (q.vatEnabled) {
    lines.push({ label: `ภาษีมูลค่าเพิ่ม ${Number(q.vatRate)}%`, value: formatMoney(q.vatAmount), bold: false });
  }
  lines.push({ label: "รวมทั้งสิ้น", value: formatMoney(q.grandTotal), bold: true });
  return lines.map((line) => ({ ...line, bold: line.bold }));
};

const summaryHeight = (doc: PDFKit.PDFDocument, q: QuotationForPdf, fonts: Fonts, width: number): number => {
  const lines = summaryLines(q).length;
  const totals = lines * SUMMARY_ROW_HEIGHT + (lines - 1) * SUMMARY_ROW_GAP;
  const noteWidth = width - Math.min(220, width) - 12;
  const note = q.note ? measure(doc, `* ${q.note}`, noteWidth, fonts.regular, SIZE_BODY) : 0;
  return 6 + Math.max(totals, note);
};

const drawSummary = (doc: PDFKit.PDFDocument, q: QuotationForPdf, fonts: Fonts, top: number, width: number): void => {
  const rightWidth = Math.min(220, width);
  const rightX = MARGIN + width - rightWidth;
  let y = top + 6;
  if (q.note) {
    doc.fillColor(NOTE_COLOR).font(fonts.regular).fontSize(SIZE_BODY).text(`* ${q.note}`, MARGIN, y, {
      width: width - rightWidth - 12,
      lineGap: lineGap(SIZE_BODY),
    });
    doc.fillColor("black");
  }
  for (const line of summaryLines(q)) {
    doc.font(line.bold ? fonts.bold : fonts.regular).fontSize(SIZE_BODY).text(`${line.label}: ${line.value}`, rightX, y, {
      width: rightWidth,
      height: SUMMARY_ROW_HEIGHT,
      align: "right",
      lineBreak: false,
    });
    y += SUMMARY_ROW_HEIGHT + SUMMARY_ROW_GAP;
  }
};

const drawFooter = (
  doc: PDFKit.PDFDocument,
  q: QuotationForPdf,
  signatures: QuotationSignatures,
  fonts: Fonts,
  top: number,
  width: number,
): void => {
  const y = top;

  const blockGap = 80;
  const blockWidth = (width - blockGap) / 2;
  const blocks = [
    { label: "ผู้เสนอราคา", data: signatures.quotedBy },
    { label: "ผู้อนุมัติ", data: signatures.acceptedBy },
  ];
  blocks.forEach(({ label, data }, index) => {
    const x = MARGIN + index * (blockWidth + blockGap);
    doc.font(fonts.bold).fontSize(SIZE_BODY).text(label, x, y, { width: blockWidth, align: "center" });
    const image = decodeDataUrlImage(data?.imageDataUrl);
    if (image) {
      try {
        doc.image(image, x + (blockWidth - 82) / 2, y + 12, { fit: [82, 28], align: "center", valign: "center" });
      } catch {
        // Invalid signature image data leaves the text signature area available.
      }
    }
    doc.font(fonts.regular).fontSize(SIZE_BODY);
    doc.text(data?.dottedText || "........................................", x, y + 40, {
      width: blockWidth,
      align: "center",
    });
    doc.text(`( ${data?.bracketText || "                                 "} )`, x, y + 52, {
      width: blockWidth,
      align: "center",
    });
  });
};

/** Renders a single-page A4 quotation, shrinking the table until it fits. */
export const generateQuotationPdfStream = (q: QuotationForPdf, stream: NodeJS.WritableStream): void => {
  const doc = new PDFDocument({ size: INVOICE_PDF_CONFIG.pageSize, margin: MARGIN, bufferPages: false });
  const fonts = selectPdfFonts(doc);
  const signatures = (q.signatures && typeof q.signatures === "object" ? q.signatures : {}) as QuotationSignatures;
  const width = doc.page.width - MARGIN * 2;
  const widths = tableWidths(doc);

  const headerEnd = drawHeader(doc, q, fonts);
  const footerHeight = SIGNATURE_HEIGHT;
  const footerTop = doc.page.height - MARGIN - FOOTER_BOTTOM - footerHeight;
  const available = footerTop - 5 - headerEnd;
  const summary = summaryHeight(doc, q, fonts, width);

  const measureRows = (size: number, padding: number): number[] =>
    q.items.map((row) => rowHeight(doc, row, widths, fonts.regular, size, padding));
  const contentHeight = (heights: number[]): number =>
    TABLE_HEADER_HEIGHT + heights.reduce((sum, h) => sum + h, 0) + summary;

  let settings = getQuotationAutoFitSettings(q.items.length);
  let heights = measureRows(settings.fontSize, settings.rowPadding);
  while (contentHeight(heights) > available && settings.fontSize > MIN_FONT_SIZE) {
    settings = { ...settings, fontSize: Math.max(MIN_FONT_SIZE, settings.fontSize - 0.5) };
    heights = measureRows(settings.fontSize, settings.rowPadding);
  }
  while (contentHeight(heights) > available && settings.rowPadding > 0) {
    settings = { ...settings, rowPadding: settings.rowPadding - 1 };
    heights = measureRows(settings.fontSize, settings.rowPadding);
  }
  if (contentHeight(heights) > available) {
    throw new RangeError(
      `Quotation with ${q.items.length} items requires ${contentHeight(heights).toFixed(1)}pt but only ${available.toFixed(1)}pt is available at the minimum ${MIN_FONT_SIZE}pt font size`,
    );
  }

  doc.pipe(stream);

  let y = headerEnd;
  let x = MARGIN;
  TABLE_HEADERS.forEach((label, i) => {
    const w = widths[i] ?? 0;
    doc.rect(x, y, w, TABLE_HEADER_HEIGHT).stroke();
    doc.font(fonts.bold).fontSize(settings.fontSize).text(label, x + CELL_PADDING_X, y + 6, {
      width: w - CELL_PADDING_X * 2,
      height: TABLE_HEADER_HEIGHT - 8,
      align: i >= 2 ? "right" : "left",
      lineBreak: false,
      ellipsis: true,
    });
    x += w;
  });
  y += TABLE_HEADER_HEIGHT;

  q.items.forEach((row, index) => {
    const h = heights[index] ?? 0;
    x = MARGIN;
    rowValues(row).forEach((value, i) => {
      const w = widths[i] ?? 0;
      doc.rect(x, y, w, h).stroke();
      doc.font(fonts.regular).fontSize(settings.fontSize).text(value, x + CELL_PADDING_X, y + settings.rowPadding * 1.75, {
        width: w - CELL_PADDING_X * 2,
        height: h - settings.rowPadding * 1.75 * 2,
        align: i >= 2 ? "right" : "left",
        lineGap: lineGap(settings.fontSize),
        ellipsis: true,
      });
      x += w;
    });
    y += h;
  });

  drawSummary(doc, q, fonts, y, width);
  drawFooter(doc, q, signatures, fonts, footerTop, width);
  doc.end();
};
