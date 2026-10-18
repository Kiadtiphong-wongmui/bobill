import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import test from "node:test";

import { arrangeInvoiceRows, generateInvoicePdfStream, getInvoiceAutoFitSettings } from "./invoice.pdf.js";

type TestInvoice = Parameters<typeof generateInvoicePdfStream>[0];

const createInvoice = (count: number, unitPrice = 125): TestInvoice => ({
  invoiceNumber: "INV-2026-0001",
  documentDate: new Date("2026-10-18T00:00:00.000Z"),
  sellerCompanyName: "บริษัท ทดสอบ จำกัด",
  sellerAddress: "99 ถนนสุขุมวิท กรุงเทพมหานคร",
  sellerTaxId: "0105551234567",
  sellerPhone: "02-000-0000",
  sellerEmail: "test@example.com",
  includeBuyer: true,
  buyerCompanyName: "บริษัท ผู้ซื้อ จำกัด",
  buyerAddress: "100 ถนนตัวอย่าง กรุงเทพมหานคร",
  buyerTaxId: "0105557654321",
  paymentTerms: "ชำระภายใน 30 วัน",
  creditDays: 30,
  subtotal: count * unitPrice,
  discountTotal: 0,
  grandTotal: count * unitPrice,
  note: null,
  amountInWords: "หนึ่งพันสองร้อยห้าสิบบาทถ้วน",
  items: Array.from({ length: count }, (_, index) => ({
    lineNo: index + 1,
    description: index === 0
      ? "บริการติดตั้งและตรวจสอบระบบเครือข่ายพร้อมอบรมการใช้งานให้แก่ผู้ดูแลระบบ"
      : `บริการรายการที่ ${index + 1}`,
    quantity: 1,
    unitPrice,
    lineTotal: unitPrice,
  })),
});

const renderPdf = (invoice: TestInvoice, useAttachment?: boolean): Promise<Buffer> => {
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on("data", (chunk: Buffer) => chunks.push(chunk));
  const result = new Promise<Buffer>((resolve, reject) => {
    stream.once("end", () => resolve(Buffer.concat(chunks)));
    stream.once("error", reject);
  });
  generateInvoicePdfStream(invoice, stream, useAttachment);
  return result;
};

const pageCount = (pdf: Buffer): number => (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;

test("renders a five-row invoice as one streamed PDF page", async () => {
  const pdf = await renderPdf(createInvoice(5));
  assert.equal(pdf.subarray(0, 5).toString("ascii"), "%PDF-");
  assert.equal(pageCount(pdf), 1);
});

test("renders 15 and 30 item invoices on exactly one page", async () => {
  for (const count of [15, 30]) {
    const pdf = await renderPdf(createInvoice(count));
    assert.equal(pageCount(pdf), 1, `expected ${count} rows to fit on one page`);
    assert.ok(pdf.length > 0);
  }
});

test("pairs zero-price name rows side by side and keeps them on one page", async () => {
  const invoice = createInvoice(45, 0);
  invoice.items.forEach((item) => {
    item.description = "ทดสอบชื่อพนักงาน";
  });
  const pdf = await renderPdf(invoice);
  assert.equal(pageCount(pdf), 1);
});

test("keeps mixed invoice rows in their original order", async () => {
  const invoice = createInvoice(5, 0);
  invoice.items.forEach((item) => {
    item.description = "ทดสอบชื่อพนักงาน";
  });
  const secondItem = invoice.items[1];
  if (!secondItem) throw new Error("Test invoice is missing its second item");
  secondItem.unitPrice = 125;
  secondItem.lineTotal = 125;

  const layout = arrangeInvoiceRows(invoice.items);
  assert.deepEqual(layout.map((row) => row.kind), ["item", "item", "item", "item", "item"]);
  assert.deepEqual(
    layout.map((row) => row.kind === "item" ? row.item.lineNo : null),
    [1, 2, 3, 4, 5],
  );
  assert.equal(pageCount(await renderPdf(invoice)), 1);
});

test("keeps a single-page layout when attachment mode is requested", async () => {
  const pdf = await renderPdf(createInvoice(5), true);
  assert.equal(pageCount(pdf), 1);
});

test("selects the requested item-count density bands", () => {
  assert.deepEqual(getInvoiceAutoFitSettings(5), { fontSize: 12, rowPadding: 6, headerGap: 8 });
  assert.deepEqual(getInvoiceAutoFitSettings(15), { fontSize: 11, rowPadding: 4, headerGap: 6 });
  assert.deepEqual(getInvoiceAutoFitSettings(30), { fontSize: 9, rowPadding: 1, headerGap: 2 });
  assert.deepEqual(getInvoiceAutoFitSettings(45), { fontSize: 8, rowPadding: 1, headerGap: 0 });
});