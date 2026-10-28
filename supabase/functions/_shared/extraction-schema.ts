/**
 * The contract the extract-document function enforces before it stores a result.
 *
 * Kept in one file so the function and its handler share the allowed keys, the
 * evidence rule, and the 1 to 5 level rule. The browser mirrors these rules in
 * src/lib/extraction.js for display purposes only.
 */

export const EXTRACTABLE_FIELDS = [
  "reported_diagnosis",
  "gmfcs",
  "macs",
  "cfcs",
  "vision",
  "fatigue",
  "support",
] as const;

export type ExtractableField = (typeof EXTRACTABLE_FIELDS)[number];

export type FieldSuggestion = {
  value: string | number;
  evidence: string;
};

export type ExtractionResult = {
  fields: Record<ExtractableField, FieldSuggestion | null>;
};

const LEVEL_FIELDS = new Set<string>(["gmfcs", "macs", "cfcs"]);

export type ValidationOutcome = {
  ok: boolean;
  result: ExtractionResult;
  errors: string[];
};

export function emptyResult(): ExtractionResult {
  return {
    fields: Object.fromEntries(
      EXTRACTABLE_FIELDS.map((key) => [key, null])
    ) as Record<ExtractableField, FieldSuggestion | null>,
  };
}

/**
 * Validates an untrusted payload. Unknown keys, missing evidence, and levels
 * outside 1 to 5 are errors; a field with no statement is null.
 */
export function validateExtraction(payload: unknown): ValidationOutcome {
  const result = emptyResult();
  const errors: string[] = [];

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, result, errors: ["payload is not an object"] };
  }

  const source = (payload as { fields?: unknown }).fields ?? payload;

  if (typeof source !== "object" || source === null || Array.isArray(source)) {
    return { ok: false, result, errors: ["payload has no fields object"] };
  }

  const entries = source as Record<string, unknown>;

  for (const key of Object.keys(entries)) {
    if (!(EXTRACTABLE_FIELDS as readonly string[]).includes(key)) {
      errors.push(`unexpected key: ${key}`);
    }
  }

  for (const key of EXTRACTABLE_FIELDS) {
    if (!(key in entries)) continue;

    const entry = entries[key];
    if (entry === null || entry === undefined) continue;

    if (typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(`${key} is not an object`);
      continue;
    }

    const { value, evidence } = entry as Record<string, unknown>;

    if (value === null || value === undefined) {
      if (typeof evidence === "string" && evidence.trim() !== "") {
        errors.push(`${key} has evidence but no value`);
      }
      continue;
    }

    if (LEVEL_FIELDS.has(key)) {
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > 5
      ) {
        errors.push(`${key} must be a whole number from 1 to 5`);
        continue;
      }
    } else if (typeof value !== "string" || value.trim() === "") {
      errors.push(`${key} must be non-empty text`);
      continue;
    }

    if (typeof evidence !== "string" || evidence.trim() === "") {
      errors.push(`${key} needs a quote from the document`);
      continue;
    }

    result.fields[key as ExtractableField] = {
      value: typeof value === "string" ? value.trim() : value,
      evidence: evidence.trim(),
    };
  }

  return { ok: errors.length === 0, result, errors };
}
