/** Helper utilities for employee card PDF generation (minimal implementations). */

export const formatThaiDate = (d: Date): string => {
  try {
    const dt = new Date(d);
    const day = String(dt.getDate()).padStart(2, "0");
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const year = String(dt.getFullYear());
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
};

export const photoToDataUrl = (photoUrl: string | null): string | null => {
  if (!photoUrl) return null;
  // If already a data URL, return as-is. Otherwise return the url (Puppeteer can load http(s) URLs).
  if (photoUrl.startsWith("data:")) return photoUrl;
  return photoUrl;
};

export const escapeHtml = (input: string): string => {
  if (!input) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export const escapeInstructions = (input: string): string => {
  if (!input) return "";
  // Preserve newlines as <br>
  return escapeHtml(input).replace(/\r?\n/g, "<br />");
};

export const getSarabunFontFaceCss = (): string => {
  // Minimal placeholder — real implementation may embed @font-face or point to local files.
  return "";
};
