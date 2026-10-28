import { DEFAULT_SETTINGS } from "../../lib/adaptations.js";

const TEXT_SIZES = [
  { value: "default", label: "Normal" },
  { value: "large", label: "Large" },
  { value: "larger", label: "Larger" },
];

const TARGET_SIZES = [
  { value: "standard", label: "Standard" },
  { value: "large", label: "Large" },
  { value: "extra-large", label: "Extra large" },
];

const TOGGLES = [
  { key: "highContrast", label: "High contrast" },
  { key: "extraSpacing", label: "More space between lines and words" },
  { key: "reducedMotion", label: "Reduce animation" },
  { key: "oneThingAtATime", label: "Show one step at a time" },
  { key: "extraTime", label: "Allow extra time" },
];

/**
 * The display controls, written once.
 *
 * Mounted in three places so the same choices are presented the same way:
 * onboarding step 7, the profile page, and the header accessibility panel.
 */
export default function DisplaySettingsFields({
  value,
  onChange,
  disabled = false,
  idPrefix = "display",
}) {
  const settings = { ...DEFAULT_SETTINGS, ...value };

  function set(key, next) {
    onChange({ ...settings, [key]: next });
  }

  return (
    <div className="display-settings">
      <fieldset className="onboarding-fieldset">
        <legend>Text size</legend>
        <div className="segmented-options" role="group" aria-label="Page text size">
          {TEXT_SIZES.map((option) => (
            <button
              key={option.value}
              type="button"
              className="segmented-option"
              aria-pressed={settings.textSize === option.value}
              disabled={disabled}
              onClick={() => set("textSize", option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="onboarding-fieldset">
        <legend>Button and link size</legend>
        <p className="field-hint">
          Larger targets are easier to tap and click.
        </p>
        <div
          className="segmented-options"
          role="group"
          aria-label="Button and link size"
        >
          {TARGET_SIZES.map((option) => (
            <button
              key={option.value}
              type="button"
              className="segmented-option"
              aria-pressed={settings.targetSize === option.value}
              disabled={disabled}
              onClick={() => set("targetSize", option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="onboarding-fieldset">
        <legend>Reading and movement</legend>
        {TOGGLES.map((toggle) => (
          <label className="onboarding-option toggle-option" key={toggle.key}>
            <input
              id={`${idPrefix}-${toggle.key}`}
              type="checkbox"
              checked={Boolean(settings[toggle.key])}
              disabled={disabled}
              onChange={(event) => set(toggle.key, event.target.checked)}
            />
            <span>
              <strong>{toggle.label}</strong>
            </span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
