// Primitive guards for untrusted values: Firestore documents, AsyncStorage
// blobs written by older app versions, pasted import text. Each one answers
// "is this usable as X?" and never throws, so a normalizer is a flat list of
// these calls rather than a tangle of typeof checks.

/** A plain object (not null, not an array), or null. */
export function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * A trimmed, non-empty string, cut to `max` characters. Anything else —
 * numbers included — is undefined: a name field holding 42 is a data bug,
 * not a name.
 */
export function asText(value: unknown, max = 200): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

const INT_STRING = /^-?\d{1,15}$/;

/**
 * An integer, from a number or a numeric string ("5"). Fractions are
 * rejected rather than rounded: 3.7 stars means the data is wrong, and
 * guessing would hide that.
 */
export function toInt(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) ? value : undefined;
  }
  if (typeof value === "string" && INT_STRING.test(value.trim())) {
    const n = Number(value.trim());
    return Number.isSafeInteger(n) ? n : undefined;
  }
  return undefined;
}

/** An integer within [min, max], or undefined. */
export function intInRange(
  value: unknown,
  min: number,
  max: number,
): number | undefined {
  const n = toInt(value);
  return n !== undefined && n >= min && n <= max ? n : undefined;
}

/**
 * For values a person typed: any finite number is rounded and pulled into
 * [min, max]; anything else becomes `fallback`. Stored data goes through the
 * strict intInRange instead.
 */
export function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Largest SchaleDB student id we accept; real ids are five digits. */
const MAX_STUDENT_ID = 9_999_999;

/** A SchaleDB student id: a positive integer, from a number or "10000". */
export function asStudentId(value: unknown): number | undefined {
  return intInRange(value, 1, MAX_STUDENT_ID);
}

/** Lenient boolean for flags written by hand: true, 1 and "true" count. */
export function asFlag(value: unknown): boolean {
  return (
    value === true ||
    value === 1 ||
    (typeof value === "string" && value.trim().toLowerCase() === "true")
  );
}

/** An absolute http(s) URL, or undefined. Blocks javascript:, data: and friends. */
export function asHttpUrl(value: unknown, max = 2048): string | undefined {
  const text = asText(value, max + 1);
  if (!text || text.length > max) return undefined;
  return /^https?:\/\/[^\s/?#]+[^\s]*$/i.test(text) ? text : undefined;
}
