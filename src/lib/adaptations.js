/**
 * Turns what a person reports into display settings.
 *
 * Two rules hold everywhere:
 *   1. The diagnosis is never read. Only function levels, the pointer, vision,
 *      fatigue, and the person's own choices change the screen.
 *   2. A setting is only ever raised by these rules. A person's override, stored
 *      in learners.ui_settings, always wins key by key.
 */

export const DEFAULT_SETTINGS = {
  textSize: "default",
  highContrast: false,
  extraSpacing: false,
  reducedMotion: false,
  targetSize: "standard",
  oneThingAtATime: false,
  extraTime: false,
};

const TARGET_ORDER = ["standard", "large", "extra-large"];

// Phrases that suggest precise pointing is hard: pinch, drag, tremor, switch.
const POINTER_DIFFICULTY = /pinch|drag|tremor|switch/i;
// Phrases that suggest vision needs help: low vision, glare.
const VISION_DIFFICULTY = /low vision|glare/i;

function raiseTarget(current, next) {
  return TARGET_ORDER.indexOf(next) > TARGET_ORDER.indexOf(current)
    ? next
    : current;
}

function asLevel(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
}

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function deriveAdaptations(learner) {
  const settings = { ...DEFAULT_SETTINGS };
  if (!learner) return settings;

  const macs = asLevel(learner.macs);
  const cfcs = asLevel(learner.cfcs);
  const pointer = asText(learner.pointer);
  const vision = asText(learner.vision);
  const fatigue = asText(learner.fatigue);

  if (macs === 3) {
    settings.targetSize = raiseTarget(settings.targetSize, "large");
    settings.extraSpacing = true;
  }

  if (macs === 4 || macs === 5) {
    settings.targetSize = raiseTarget(settings.targetSize, "extra-large");
    settings.extraSpacing = true;
    settings.oneThingAtATime = true;
  }

  if (POINTER_DIFFICULTY.test(pointer)) {
    settings.targetSize = raiseTarget(settings.targetSize, "large");
  }

  if (cfcs !== null && cfcs >= 3) {
    settings.oneThingAtATime = true;
  }

  if (VISION_DIFFICULTY.test(vision)) {
    settings.textSize = "large";
    settings.highContrast = true;
  }

  if (fatigue) {
    settings.extraTime = true;
  }

  return settings;
}

export function resolveSettings(derived, overrides) {
  const base = derived ?? DEFAULT_SETTINGS;
  if (!overrides) return { ...base };

  const resolved = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null || value === "") continue;
    resolved[key] = value;
  }
  return resolved;
}

/**
 * The class names the header applies to the document root.
 */
export function settingsToClasses(settings) {
  return [
    settings.textSize === "large" && "a11y-text-large",
    settings.textSize === "larger" && "a11y-text-larger",
    settings.textSize === "default" && "a11y-text-default",
    settings.highContrast && "a11y-high-contrast",
    settings.extraSpacing && "a11y-extra-spacing",
    settings.reducedMotion && "a11y-reduced-motion",
    settings.targetSize === "large" && "a11y-targets-large",
    settings.targetSize === "extra-large" && "a11y-targets-xl",
    settings.oneThingAtATime && "a11y-one-thing",
    settings.extraTime && "a11y-extra-time",
  ].filter(Boolean);
}
