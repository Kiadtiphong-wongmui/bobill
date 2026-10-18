import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

export type BaseDocumentItem = {
  lineNo: number;
  description: string;
  quantity: unknown;
  unitPrice: unknown;
  lineTotal: unknown;
};

export type BaseSignatureBlock = {
  dottedText?: string;
  bracketText?: string;
  imageDataUrl?: string;
};

export type BaseDocumentSignatures = {
  approvedBy?: BaseSignatureBlock;
  receivedBy?: BaseSignatureBlock;
  payer?: BaseSignatureBlock;
};

export type BaseDocumentForPdf = {
  documentTitle: string;
  documentNumberLabel: string;
  documentNumber: string;
  documentDate: Date;
  sellerCompanyName: string;
  sellerAddress: string;
  sellerTaxId: string | null;
  sellerPhone: string | null;
  sellerEmail: string | null;
  includeBuyer?: boolean;
  buyerCompanyName: string | null;
  buyerAddress: string | null;
  buyerTaxId: string | null;
  paymentTerms: string | null;
  creditDays: number | null;
  subtotal: unknown;
  discountTotal: unknown;
  grandTotal: unknown;
  note: string | null;
  amountInWords: string | null;
  signatures?: unknown;
  items: BaseDocumentItem[];
};

const money = (value: unknown): string =>
  Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const THAI_FONT_REGULAR = "thai-regular";
const THAI_FONT_BOLD = "thai-bold";
const THAI_FONT_PATH = path.resolve(
  process.cwd(),
  "node_modules",
  "font-th-sarabun-new",
  "fonts",
  "THSarabunNew-webfont.ttf"
);
const THAI_FONT_BOLD_PATH = path.resolve(
  process.cwd(),
  "node_modules",
  "font-th-sarabun-new",
  "fonts",
  "THSarabunNew_bold-webfont.ttf"
);

const selectPdfFonts = (doc: PDFKit.PDFDocument): { regular: string; bold: string } => {
  if (fs.existsSync(THAI_FONT_PATH) && fs.existsSync(THAI_FONT_BOLD_PATH)) {
    doc.registerFont(THAI_FONT_REGULAR, THAI_FONT_PATH);
    doc.registerFont(THAI_FONT_BOLD, THAI_FONT_BOLD_PATH);
    return { regular: THAI_FONT_REGULAR, bold: THAI_FONT_BOLD };
  }
  return { regular: "Helvetica", bold: "Helvetica-Bold" };
};

const parseSignatures = (value: unknown): BaseDocumentSignatures => {
  if (!value || typeof value !== "object") return {};
  return value as BaseDocumentSignatures;
};

const decodeDataUrlImage = (value?: string): Buffer | null => {
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

export const generateDocumentPdfStream = (
  docData: BaseDocumentForPdf,
  stream: NodeJS.WritableStream
): void => {
  const doc = new PDFDocument({ size: "A4", margin: 32 });
  const fontNames = selectPdfFonts(doc);
  const sizeTitle = 16;
  const sizeSubTitle = 11;
  const sizeBody = 10;
  const sizeTable = 9.5;
  const headerHeight = 22;
  const rowHeight = 22;

  doc.pipe(stream);

  const signatures = parseSignatures(docData.signatures);

  doc.font(fontNames.bold).fontSize(sizeTitle).text(docData.sellerCompanyName, { align: "center" });
  doc.font(fontNames.regular).fontSize(sizeSubTitle).text(docData.sellerAddress, { align: "center" });
  doc.text(
    `เลขประจำตัวผู้เสียภาษี: ${docData.sellerTaxId ?? "-"}   เบอร์โทร: ${docData.sellerPhone ?? "-"}   อีเมล: ${docData.sellerEmail ?? "-"}`,
    { align: "center" }
  );

  doc.moveDown(0.8);
  doc.font(fontNames.bold).fontSize(18).text(docData.documentTitle, { align: "center", underline: true });
  doc.moveDown(0.45);

  doc.font(fontNames.regular).fontSize(sizeBody);
  doc.text(`${docData.documentNumberLabel}: ${docData.documentNumber}`);
  doc.text(`วันที่: ${docData.documentDate.toLocaleDateString("th-TH")}`);
  if (docData.paymentTerms) {
    doc.text(`เงื่อนไขการชำระเงิน: ${docData.paymentTerms}`);
  }
  if (docData.creditDays !== null && docData.creditDays !== undefined) {
    doc.text(`เครดิต: ${docData.creditDays} วัน`);
  }
  doc.moveDown(0.5);
  const showBuyer = docData.includeBuyer !== false;
  if (showBuyer) {
    doc.text(`ผู้ซื้อ: ${docData.buyerCompanyName ?? "-"}`);
    doc.text(`ที่อยู่: ${docData.buyerAddress ?? "-"}`);
    doc.text(`เลขประจำตัวผู้เสียภาษี: ${docData.buyerTaxId ?? "-"}`);
  }
  doc.moveDown();

  const startX = 32;
  let y = doc.y;
  const widths = [40, 260, 60, 90, 90] as const;
  const headers = ["ลำดับ", "รายการสินค้า / บริการ", "จำนวน", "ราคา / หน่วย", "จำนวนเงิน"];

  let cursorX = startX;
  headers.forEach((header, i) => {
    const width = widths[i] ?? 0;
    doc.rect(cursorX, y, width, headerHeight).stroke();
    doc.font(fontNames.bold).fontSize(sizeTable).text(header, cursorX + 4, y + 6, {
      width: width - 8,
      height: headerHeight - 8,
      align: i >= 2 ? "right" : "left",
      lineBreak: false,
      ellipsis: true,
    });
    cursorX += width;
  });

  y += headerHeight;
  docData.items.forEach((item) => {
    let rowX = startX;
    const values = [
      String(item.lineNo),
      item.description,
      money(item.quantity),
      money(item.unitPrice),
      money(item.lineTotal),
    ];

    values.forEach((value, i) => {
      const width = widths[i] ?? 0;
      doc.rect(rowX, y, width, rowHeight).stroke();
      doc.font(fontNames.regular).fontSize(sizeTable).text(value, rowX + 4, y + 6, {
        width: width - 8,
        height: rowHeight - 8,
        align: i >= 2 ? "right" : "left",
        lineBreak: false,
        ellipsis: true,
      });
      rowX += width;
    });
    y += rowHeight;
  });

  y += 12;
  doc.font(fontNames.regular).fontSize(sizeBody).text(`รวมเงิน: ${money(docData.subtotal)}`, startX + 350, y, {
    width: 190,
    align: "right",
  });
  y += 16;
  doc.font(fontNames.regular).fontSize(sizeBody).text(`ส่วนลด: ${money(docData.discountTotal)}`, startX + 350, y, {
    width: 190,
    align: "right",
  });
  y += 16;
  doc.font(fontNames.bold).fontSize(sizeBody).text(`รวมชำระทั้งสิ้น: ${money(docData.grandTotal)}`, startX + 350, y, {
    width: 190,
    align: "right",
  });
  y += 22;
  const amountY = y;
  doc.font(fontNames.regular).text(`ตัวอักษร: ${docData.amountInWords ?? "-"}`, startX, amountY, { width: 420 });
  const noteY = amountY + 16;
  if (docData.note) {
    doc.text(`หมายเหตุ: ${docData.note}`, startX, noteY, { width: 520 });
  }

  const signatureTop = (docData.note ? noteY : amountY) + 32;
  const blockWidth = 145;
  const gap = 20;
  const labels = ["อนุมัติโดย", "ผู้สั่งซื้อ / ผู้รับบริการ", "ผู้เสนอราคา / ผู้รับเงิน"] as const;
  const signatureData = [signatures.approvedBy, signatures.receivedBy, signatures.payer] as const;
  const signatureFontSize = 9;
  labels.forEach((label, index) => {
    const x = startX + index * (blockWidth + gap);
    const block = signatureData[index];
    doc.font(fontNames.bold).fontSize(signatureFontSize).text(label, x, signatureTop, {
      width: blockWidth,
      align: "center",
    });

    const imageBuffer = decodeDataUrlImage(block?.imageDataUrl);
    if (imageBuffer) {
      try {
        doc.image(imageBuffer, x + 32, signatureTop + 12, {
          fit: [82, 30],
          align: "center",
          valign: "center",
        });
      } catch {
        // Ignore image parsing issues and continue with text lines.
      }
    }

    doc.font(fontNames.regular).fontSize(signatureFontSize);
    doc.text(block?.dottedText || "........................................", x, signatureTop + 36, {
      width: blockWidth,
      align: "center",
    });
    doc.text(`( ${block?.bracketText || "                                 "} )`, x, signatureTop + 49, {
      width: blockWidth,
      align: "center",
    });
  });

  doc.end();
};
