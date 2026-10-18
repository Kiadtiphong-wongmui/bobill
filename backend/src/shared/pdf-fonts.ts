import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

const THAI_FONT_REGULAR = "thai-regular";
const THAI_FONT_BOLD = "thai-bold";
const THAI_FONT_PATH = path.resolve(
  process.cwd(),
  "node_modules",
  "font-th-sarabun-new",
  "fonts",
  "THSarabunNew-webfont.ttf",
);
const THAI_FONT_BOLD_PATH = path.resolve(
  process.cwd(),
  "node_modules",
  "font-th-sarabun-new",
  "fonts",
  "THSarabunNew_bold-webfont.ttf",
);

export type PdfFontNames = { regular: string; bold: string };

/**
 * Register Thai fonts on the PDFDocument and return font name handles.
 * Falls back to Helvetica if the font files are not found.
 */
export const selectPdfFonts = (doc: PDFKit.PDFDocument): PdfFontNames => {
  if (fs.existsSync(THAI_FONT_PATH) && fs.existsSync(THAI_FONT_BOLD_PATH)) {
    doc.registerFont(THAI_FONT_REGULAR, THAI_FONT_PATH);
    doc.registerFont(THAI_FONT_BOLD, THAI_FONT_BOLD_PATH);
    return { regular: THAI_FONT_REGULAR, bold: THAI_FONT_BOLD };
  }
  return { regular: "Helvetica", bold: "Helvetica-Bold" };
};

/**
 * Decode a signature image from either a `/uploads/<filename>` path or a base64 data URL.
 * Returns a Buffer on success, null if the image cannot be resolved.
 */
export const decodeDataUrlImage = (value?: string): Buffer | null => {
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("/uploads/")) {
    const filename = path.basename(value);
    const uploadPath = path.resolve(process.cwd(), "src", "upload", filename);
    if (!fs.existsSync(uploadPath)) return null;
    try {
      return fs.readFileSync(uploadPath);
    } catch {
      return null;
    }
  }
  const match = value.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (!match || !match[1]) return null;
  try {
    return Buffer.from(match[1], "base64");
  } catch {
    return null;
  }
};

/** Format a numeric value as a locale money string (e.g. "1,234.56"). */
export const formatMoney = (value: unknown): string =>
  Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
