/**
 * Shared HTTP utility helpers for Express controllers.
 * Consolidates common parsing and response-formatting patterns
 * used across invoice and employee-card controllers.
 */

/**
 * Parses an Express route param (string | string[] | undefined) as a positive integer id.
 * Throws if the value is missing or not a valid positive integer.
 */
export const parseId = (value: string | string[] | undefined): number => {
  const idText = Array.isArray(value) ? value[0] : value;
  const id = Number(idText);
  if (!idText || !Number.isInteger(id) || id <= 0) {
    throw new Error("id must be a positive integer");
  }
  return id;
};

/**
 * Extracts an error message string from an unknown thrown value.
 * Returns `fallback` when the value is not an Error instance.
 */
export const getError = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/**
 * Converts a filename to a safe ASCII-only string for use in
 * Content-Disposition headers. Non-ASCII characters are replaced with `_`.
 */
export const toAsciiFilename = (name: string, defaultName = "download.pdf"): string => {
  const normalized = name.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return normalized.length > 0 ? normalized : defaultName;
};

/**
 * Builds a RFC 6266-compliant Content-Disposition header value that
 * supports both ASCII-only clients and modern clients via `filename*`.
 */
export const toContentDisposition = (filename: string, defaultName = "download.pdf"): string => {
  const fallback = toAsciiFilename(filename, defaultName);
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
};
