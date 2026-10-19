import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import test from "node:test";

import { arabicToThaiBahtText } from "../../utils/document-calculator.js";
import { computeTotals } from "../../shared/compute-totals.js";
import { generateQuotationPdfStream, getQuotationAutoFitSettings } from "./quotation.pdf.js";
import type { QuotationForPdf } from "./quotation.pdf.js";
import { QUOTATION_TRANSITIONS } from "./quotation.types.js";
import { parseQuotationInput } from "./quotation.validation.js";

const validBody = () => ({
  documentDate: "2026-10-01",
  validUntil: "2026-10-31",
  sellerCompanyName: "Seller Co.",
  sellerAddress: "Bangkok",
  buyerCompanyName: "Buyer Co.",
  buyerAddress: "Chiang Mai",
  items: [{ description: "Service", quantity: 2, unitPrice: 100 }],
});

const buildPdfFixture = (itemCount: number, vatEnabled: boolean): QuotationForPdf => ({
  quotationNumber: "QT-202610-00001",
  documentDate: new Date("2026-10-01"),
  validUntil: new Date("2026-10-31"),
  paymentTerms: "Net 30",
  sellerCompanyName: "Seller Co.",
  sellerAddress: "Bangkok",
  sellerTaxId: null,
  sellerPhone: null,
  sellerEmail: null,
  includeBuyer: true,
  buyerCompanyName: "Buyer Co.",
  buyerAddress: "Chiang Mai",
  buyerTaxId: null,
  subtotal: "100.00",
  discountTotal: "0.00",
  vatEnabled,
  vatRate: "7.00",
  vatAmount: vatEnabled ? "7.00" : "0.00",
  grandTotal: vatEnabled ? "107.00" : "100.00",
  note: "Valid for 30 days",
  amountInWords: arabicToThaiBahtText(vatEnabled ? 107 : 100),
  items: Array.from({ length: itemCount }, (_, i) => ({
    lineNo: i + 1,
    description: `Item ${i + 1}`,
    quantity: "1.00",
    unitPrice: "10.00",
    lineTotal: "10.00",
  })),
});

const renderPdf = async (fixture: QuotationForPdf): Promise<Buffer> => {
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<void>((resolve) => stream.on("end", resolve));
  generateQuotationPdfStream(fixture, stream);
  await finished;
  return Buffer.concat(chunks);
};

test("validation applies defaults and ignores client-supplied status", () => {
  const input = parseQuotationInput({ ...validBody(), status: "ACCEPTED" });
  assert.equal(input.vatEnabled, false);
  assert.equal(input.vatRate, 7);
  assert.equal("status" in input, false);
});

test("validation rejects validUntil before documentDate", () => {
  assert.throws(
    () => parseQuotationInput({ ...validBody(), validUntil: "2026-09-01" }),
    /validUntil must not be earlier/,
  );
});

test("validation rejects empty items and out-of-range vatRate", () => {
  assert.throws(() => parseQuotationInput({ ...validBody(), items: [] }), /non-empty/);
  assert.throws(() => parseQuotationInput({ ...validBody(), vatRate: 150 }), /vatRate/);
});

test("transitions only allow DRAFT->SENT and SENT->final states", () => {
  assert.deepEqual(QUOTATION_TRANSITIONS.DRAFT, ["SENT"]);
  assert.ok(QUOTATION_TRANSITIONS.SENT.includes("ACCEPTED"));
  assert.ok(QUOTATION_TRANSITIONS.SENT.includes("REJECTED"));
  assert.deepEqual(QUOTATION_TRANSITIONS.ACCEPTED, []);
  assert.deepEqual(QUOTATION_TRANSITIONS.EXPIRED, []);
});

test("VAT total is calculated on the discounted subtotal", () => {
  const totals = computeTotals([{ description: "x", quantity: 2, unitPrice: 500 }], 100, 7);
  assert.equal(totals.vatTotal, 63);
  assert.equal(totals.grandTotal, 963);
});

test("baht text is generated for the grand total", () => {
  assert.equal(arabicToThaiBahtText(107), "หนึ่งร้อยเจ็ดบาทถ้วน");
});

test("auto-fit bands shrink font as item count grows", () => {
  assert.equal(getQuotationAutoFitSettings(5).fontSize, 12);
  assert.equal(getQuotationAutoFitSettings(15).fontSize, 11);
  assert.equal(getQuotationAutoFitSettings(30).fontSize, 9);
  assert.equal(getQuotationAutoFitSettings(45).fontSize, 8);
});

test("PDF renders on a single page with and without VAT", async () => {
  for (const [count, vat] of [[3, true], [3, false], [30, true]] as const) {
    const pdf = await renderPdf(buildPdfFixture(count, vat));
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    const pages = pdf.toString("latin1").match(/\/Type \/Page\b(?!s)/g) ?? [];
    assert.equal(pages.length, 1, `expected one page for ${count} items (vat=${vat})`);
  }
});
