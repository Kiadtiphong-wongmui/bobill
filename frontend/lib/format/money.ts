/**
 * Formats a monetary amount for display (e.g. invoice lines, totals).
 * Accepts API string decimals or computed numbers.
 */
export function formatMoney(value: number | string): string {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) {
    return "0.00";
  }
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
