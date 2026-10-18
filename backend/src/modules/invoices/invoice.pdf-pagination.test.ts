import assert from "node:assert/strict";
import test from "node:test";

import { paginateInvoiceRows, shouldUseInvoiceAttachment } from "./invoice.pdf-pagination.js";

const config = {
  firstPageHeight: 430,
  continuedPageHeight: 600,
  tableHeaderHeight: 24,
  continuationNoteHeight: 18,
  summaryHeight: 170,
  minFinalRows: 3,
};

test("five rows and a summary stay on the first page", () => {
  const pages = paginateInvoiceRows(Array(5).fill(24), config);
  assert.deepEqual(pages, [{ startIndex: 0, endIndex: 5 }]);
});

test("rows that exactly use the final page capacity stay together", () => {
  const exactFinalCapacity = config.firstPageHeight - config.tableHeaderHeight - config.summaryHeight;
  const pages = paginateInvoiceRows([exactFinalCapacity / 2, exactFinalCapacity / 2], config);
  assert.deepEqual(pages, [{ startIndex: 0, endIndex: 2 }]);
});

test("a small overflow keeps at least two rows with the summary when possible", () => {
  const pages = paginateInvoiceRows(Array(14).fill(24), config);
  const finalPage = pages.at(-1);
  assert.ok(pages.length > 1);
  assert.ok(finalPage);
  assert.ok(finalPage.endIndex - finalPage.startIndex >= 2);
});

test("forty items paginate contiguously with a multi-row final page", () => {
  const pages = paginateInvoiceRows(Array(40).fill(24), config);
  assert.ok(pages.length >= 2);
  assert.equal(pages[0]?.startIndex, 0);
  assert.equal(pages.at(-1)?.endIndex, 40);
  assert.ok((pages.at(-1)?.endIndex ?? 0) - (pages.at(-1)?.startIndex ?? 0) >= 3);
  for (let index = 1; index < pages.length; index += 1) {
    assert.equal(pages[index - 1]?.endIndex, pages[index]?.startIndex);
  }
});

test("wrapped descriptions stay as indivisible rows", () => {
  const heights = [24, 48, 24, 48, 24, 24, 24, 24];
  const pages = paginateInvoiceRows(heights, config);
  for (const page of pages) {
    const pageHeight = page.startIndex === 0 ? config.firstPageHeight : config.continuedPageHeight;
    const capacity = pageHeight - config.tableHeaderHeight - (page === pages.at(-1) ? config.summaryHeight : config.continuationNoteHeight);
    const total = heights.slice(page.startIndex, page.endIndex).reduce((sum, height) => sum + height, 0);
    assert.ok(total <= capacity);
  }
});

test("attachment mode is suggested for more than twenty zero-price rows", () => {
  assert.equal(shouldUseInvoiceAttachment(Array(21).fill({ unitPrice: 0 }), undefined, 20), true);
  assert.equal(shouldUseInvoiceAttachment(Array(20).fill({ unitPrice: 0 }), undefined, 20), false);
  assert.equal(shouldUseInvoiceAttachment([...Array(20).fill({ unitPrice: 0 }), { unitPrice: 1 }], undefined, 20), false);
  assert.equal(shouldUseInvoiceAttachment([{ unitPrice: 5 }], true, 20), true);
  assert.equal(shouldUseInvoiceAttachment(Array(21).fill({ unitPrice: 0 }), false, 20), false);
});
