export type InvoicePdfPage = { startIndex: number; endIndex: number };

export type InvoicePdfPaginationConfig = {
  firstPageCapacity: number;
  continuedPageCapacity: number;
  firstFinalCapacity: number;
  continuedFinalCapacity: number;
  minFinalRows: number;
};

type InvoiceAttachmentItem = { unitPrice: unknown };

const sum = (values: number[], start: number, end: number): number => {
  let total = 0;
  for (let index = start; index < end; index += 1) total += values[index] ?? 0;
  return total;
};

export const shouldUseInvoiceAttachment = (
  items: InvoiceAttachmentItem[],
  override: boolean | undefined,
  threshold: number,
): boolean => {
  if (override !== undefined) return override;
  return items.length > threshold && items.every((item) => Number(item.unitPrice) === 0);
};

export const paginateInvoiceRows = (
  rowHeights: number[],
  config: InvoicePdfPaginationConfig,
): InvoicePdfPage[] => {
  for (const [name, value] of Object.entries(config)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`Invalid invoice PDF pagination setting: ${name}`);
    }
  }
  if (
    config.firstPageCapacity <= 0
    || config.continuedPageCapacity <= 0
    || config.firstFinalCapacity <= 0
    || config.continuedFinalCapacity <= 0
  ) {
    throw new RangeError("Invoice PDF page capacities must be positive");
  }
  if (rowHeights.some((height) => !Number.isFinite(height) || height <= 0)) {
    throw new RangeError("Every invoice PDF row must have a finite positive height");
  }
  if (rowHeights.length === 0) return [{ startIndex: 0, endIndex: 0 }];

  const pages: InvoicePdfPage[] = [];
  let nextIndex = 0;

  while (nextIndex < rowHeights.length) {
    const isFirstPage = pages.length === 0;
    const finalCapacity = isFirstPage ? config.firstFinalCapacity : config.continuedFinalCapacity;
    if (sum(rowHeights, nextIndex, rowHeights.length) <= finalCapacity) {
      pages.push({ startIndex: nextIndex, endIndex: rowHeights.length });
      break;
    }

    const normalCapacity = isFirstPage ? config.firstPageCapacity : config.continuedPageCapacity;
    let endIndex = nextIndex;
    let usedHeight = 0;
    while (endIndex < rowHeights.length - 1) {
      const height = rowHeights[endIndex] ?? 0;
      if (usedHeight + height > normalCapacity) break;
      usedHeight += height;
      endIndex += 1;
    }
    if (endIndex === nextIndex) {
      throw new RangeError(`Invoice row ${nextIndex + 1} cannot fit on an A4 page`);
    }
    pages.push({ startIndex: nextIndex, endIndex });
    nextIndex = endIndex;
  }

  if (pages.length > 1) {
    const finalPage = pages[pages.length - 1];
    const previousPage = pages[pages.length - 2];
    if (!finalPage || !previousPage) throw new RangeError("Invoice PDF pagination produced an invalid page range");

    const minimumRows = Math.max(1, Math.floor(config.minFinalRows));
    let finalHeight = sum(rowHeights, finalPage.startIndex, finalPage.endIndex);
    while (
      finalPage.endIndex - finalPage.startIndex < minimumRows
      && previousPage.endIndex - previousPage.startIndex > 1
    ) {
      const nextHeight = rowHeights[previousPage.endIndex - 1] ?? 0;
      if (finalHeight + nextHeight > config.continuedFinalCapacity) break;
      previousPage.endIndex -= 1;
      finalPage.startIndex -= 1;
      finalHeight += nextHeight;
    }
  }

  return pages;
};
