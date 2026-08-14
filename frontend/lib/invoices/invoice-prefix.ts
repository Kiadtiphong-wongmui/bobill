/** Strip accidental full invoice tail (…YYYYMM-#####) so prefix stays e.g. RC- not RC-202605-00001. */
export function normalizeInvoicePrefixStem(raw: string): string {
  const stripped = raw.trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24);
  const withTail = stripped.match(/^(.+?)(\d{6}-\d{5})$/);
  const stem = withTail ? withTail[1].replace(/-+$/g, "") : stripped.replace(/-+$/g, "");
  return stem;
}
