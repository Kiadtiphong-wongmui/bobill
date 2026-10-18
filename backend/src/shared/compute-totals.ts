/** Money string formatted to 2 decimal places. */
export const asMoney = (value: number): string => value.toFixed(2);

export type LineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type EnrichedLineItem = {
  lineNo: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ComputedTotals = {
  enrichedItems: EnrichedLineItem[];
  subtotal: number;
  discountTotal: number;
  /** VAT amount (0 when vatRate is 0). */
  vatTotal: number;
  grandTotal: number;
};

/**
 * Compute line item totals, discount, optional VAT, and grand total.
 * Throws if grand total would be negative after discount.
 *
 * @param items - Raw line items (quantity & unitPrice as numbers).
 * @param discountTotal - Flat discount amount (default 0).
 * @param vatRate - VAT percentage (0, 7, or 10). Defaults to 0.
 */
export const computeTotals = (
  items: LineItemInput[],
  discountTotal: number,
  vatRate = 0,
): ComputedTotals => {
  const enrichedItems: EnrichedLineItem[] = items.map((item, index) => ({
    lineNo: index + 1,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: Number((item.quantity * item.unitPrice).toFixed(2)),
  }));

  const subtotal = Number(enrichedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const resolvedDiscount = Number((discountTotal ?? 0).toFixed(2));
  const afterDiscount = Number((subtotal - resolvedDiscount).toFixed(2));

  if (afterDiscount < 0) {
    throw new Error("discountTotal cannot exceed subtotal");
  }

  const vatTotal = Number(((afterDiscount * vatRate) / 100).toFixed(2));
  const grandTotal = Number((afterDiscount + vatTotal).toFixed(2));

  return {
    enrichedItems,
    subtotal,
    discountTotal: resolvedDiscount,
    vatTotal,
    grandTotal,
  };
};
