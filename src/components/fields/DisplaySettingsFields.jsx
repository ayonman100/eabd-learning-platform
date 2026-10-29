import { DEFAULT_SETTINGS } from "../../lib/adaptations.js";
import { SegmentedChoice, SwitchRow } from "../ui/SettingsControls.jsx";

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
  {
    key: "highContrast",
    label: "High contrast",
    hint: "Black text on white, and the hero film is hidden.",
  },
  {
    key: "extraSpacing",
    label: "More space between lines",
    hint: "Easier to follow a line of text.",
  },
  {
    key: "reducedMotion",
    label: "Reduce animation",
    hint: "Stops movement and looping video.",
  },
  {
    key: "oneThingAtATime",
    label: "Show one step at a time",
    hint: "The dashboard shows only your next step.",
  },
  {
    key: "extraTime",
    label: "Allow extra time",
    hint: "Reminds you that pace is up to you.",
  },
];

/**
 * The display controls, written once.
 *
 * Mounted in three places so the same choices are presented the same way:
 * onboarding step 7, the profile wizard, and the header panel. Every control is
 * a real form control, so keyboard and screen reader behaviour is native.
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
      <SegmentedChoice
        legend="Text size"
        name={`${idPrefix}-text-size`}
        value={settings.textSize}
        options={TEXT_SIZES}
        disabled={disabled}
        onChange={(next) => set("textSize", next)}
      />

      <SegmentedChoice
        legend="Button and link size"
        hint="Larger targets are easier to tap and click."
        name={`${idPrefix}-target-size`}
        value={settings.targetSize}
        options={TARGET_SIZES}
        disabled={disabled}
        onChange={(next) => set("targetSize", next)}
      />

      <fieldset className="choice-group">
        <legend className="choice-legend">Reading and movement</legend>

        <div className="switch-list">
          {TOGGLES.map((toggle) => (
            <SwitchRow
              key={toggle.key}
              id={`${idPrefix}-${toggle.key}`}
              label={toggle.label}
              hint={toggle.hint}
              checked={Boolean(settings[toggle.key])}
              disabled={disabled}
              onChange={(next) => set(toggle.key, next)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
