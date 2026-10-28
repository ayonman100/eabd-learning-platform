/**
 * Validation for suggested fields returned by the extract-document function.
 *
 * The Edge Function enforces the same rules with its own schema. This mirror
 * exists so the browser can show what was suggested, quote the evidence, and
 * refuse anything that does not follow the contract.
 */

export const EXTRACTABLE_FIELDS = [
  "reported_diagnosis",
  "gmfcs",
  "macs",
  "cfcs",
  "vision",
  "fatigue",
  "support",
];

const LEVEL_FIELDS = ["gmfcs", "macs", "cfcs"];

export const FIELD_LABELS = {
  reported_diagnosis: "Diagnosis, as reported",
  gmfcs: "Getting around",
  macs: "Using your hands",
  cfcs: "Communicating",
  vision: "Vision",
  fatigue: "Tiredness",
  support: "Suggested support",
};

function isLevelField(key) {
  return LEVEL_FIELDS.includes(key);
}

function validateEntry(key, entry, errors) {
  if (entry === null || entry === undefined) return null;

  if (typeof entry !== "object" || Array.isArray(entry)) {
    errors.push(`${key} must be an object or null.`);
    return null;
  }

  const { value, evidence } = entry;

  if (value === null || value === undefined) {
    if (evidence !== undefined && evidence !== null && evidence !== "") {
      errors.push(`${key} has evidence but no value.`);
    }
    return null;
  }

  if (isLevelField(key)) {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      errors.push(`${key} must be a whole number from 1 to 5.`);
      return null;
    }
  } else if (typeof value !== "string") {
    errors.push(`${key} must be text.`);
    return null;
  } else if (value.trim() === "") {
    errors.push(`${key} must not be an empty value.`);
    return null;
  }

  if (typeof evidence !== "string" || evidence.trim() === "") {
    errors.push(`${key} needs a short quote from the document.`);
    return null;
  }

  return { value: typeof value === "string" ? value.trim() : value, evidence: evidence.trim() };
}

/**
 * Returns { ok, fields, errors }. `fields` always contains every allowed key, so
 * a caller can render one row per field without guarding for missing keys.
 */
export function validateExtraction(payload) {
  const errors = [];
  const fields = Object.fromEntries(EXTRACTABLE_FIELDS.map((key) => [key, null]));

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ok: false,
      fields,
      errors: ["The extraction result was not an object."],
    };
  }

  const source = payload.fields ?? payload;
  if (typeof source !== "object" || source === null || Array.isArray(source)) {
    return {
      ok: false,
      fields,
      errors: ["The extraction result had no fields."],
    };
  }

  for (const key of Object.keys(source)) {
    if (!EXTRACTABLE_FIELDS.includes(key)) {
      errors.push(`${key} is not a field the app accepts.`);
    }
  }

  for (const key of EXTRACTABLE_FIELDS) {
    if (!(key in source)) continue;
    const cleaned = validateEntry(key, source[key], errors);
    if (cleaned) fields[key] = cleaned;
  }

  return { ok: errors.length === 0, fields, errors };
}

/**
 * The values a person accepted, ready to write onto the learner row.
 */
export function acceptedFieldValues(fields, acceptedKeys) {
  const values = {};
  for (const key of acceptedKeys) {
    const entry = fields[key];
    if (entry) values[key] = entry.value;
  }
  return values;
}
