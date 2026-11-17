// Shared helpers for the per-recipient link preview (?to=Tên).
// Used by middleware.js (meta tag injection) and api/og.js (image rendering).

export const MAX_RECIPIENT_LENGTH = 40;

// Normalises the raw ?to= value: strips control characters, collapses whitespace,
// caps the length. Returns "" when nothing usable remains.
export function cleanRecipientName(raw) {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_RECIPIENT_LENGTH)
    .trim();
}

// Escapes a value for safe use inside an HTML attribute.
export function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
