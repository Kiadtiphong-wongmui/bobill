/**
 * Generic sequential document number generator.
 * Format: {prefix}{YYYYMM}-{NNNNN}  e.g. QT-202608-00001
 *
 * @param prefixRaw - Raw prefix string (e.g. "QT-", "RC-"). Falls back to `fallbackPrefix` if blank/invalid.
 * @param fallbackPrefix - Default prefix used when prefixRaw is empty or invalid.
 * @param findLastNumber - Async function that accepts a `startsWith` string and returns the last
 *   document number matching that prefix, or null if none exists.
 */
export const nextDocumentNumber = async (
  prefixRaw: string | undefined,
  fallbackPrefix: string,
  findLastNumber: (startsWith: string) => Promise<string | null>,
): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const yyyymm = `${year}${month}`;
  const prefix = sanitizeDocumentNumberPrefix(prefixRaw, fallbackPrefix);
  const startsWith = `${prefix}${yyyymm}-`;

  const last = await findLastNumber(startsWith);

  const current = last?.split("-").at(-1);
  const next = (Number(current ?? 0) + 1).toString().padStart(5, "0");

  return `${prefix}${yyyymm}-${next}`;
};

export const sanitizeDocumentNumberPrefix = (raw: string | undefined, fallback: string): string => {
  if (raw === undefined || raw === null) return normalizePrefix(fallback);
  const safe = String(raw).trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24);
  if (!safe) return normalizePrefix(fallback);
  return safe.endsWith("-") ? safe : `${safe}-`;
};

const normalizePrefix = (prefix: string): string =>
  prefix.endsWith("-") ? prefix : `${prefix}-`;
