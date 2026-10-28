import { Fieldset, TextField } from "./FieldPrimitives.jsx";
import {
  FUNCTION_SCALES,
  NOT_SURE,
  optionToScaleValue,
  scaleValueToOption,
} from "../../lib/levels.js";

/**
 * Person fields: what the person reports about themselves.
 *
 * The diagnosis is stored as reported and never drives the interface. The three
 * function scales describe what the person can do, which is what adapts the screen.
 * Options are shared by onboarding and the profile page.
 *
 * Used by: StepPerson (onboarding), Profile.
 */
export default function PersonFields({
  value,
  onChange,
  disabled = false,
  idPrefix = "person",
}) {
  function set(field, next) {
    onChange({ ...value, [field]: next });
  }

  return (
    <>
      <TextField
        id={`${idPrefix}-diagnosis`}
        label="Diagnosis, as it was told to you"
        hint="Optional. Write it in your own words, or leave it blank."
        value={value.reported_diagnosis ?? ""}
        onChange={(next) => set("reported_diagnosis", next)}
        multiline
        rows={2}
        disabled={disabled}
      />

      {FUNCTION_SCALES.map((scale) => (
        <Fieldset
          key={scale.key}
          legend={scale.label}
          hint={scale.question}
        >
          {scale.options.map((option) => {
            const selected =
              scaleValueToOption(value[scale.key]) === String(option.value);

            return (
              <label className="onboarding-option" key={option.value}>
                <input
                  type="radio"
                  name={`${idPrefix}-${scale.key}`}
                  value={option.value}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => set(scale.key, optionToScaleValue(option.value))}
                />
                <span>
                  <strong>
                    Level {option.value}: {option.label}
                  </strong>
                </span>
              </label>
            );
          })}

          <label className="onboarding-option">
            <input
              type="radio"
              name={`${idPrefix}-${scale.key}`}
              value={NOT_SURE}
              checked={scaleValueToOption(value[scale.key]) === NOT_SURE}
              disabled={disabled}
              onChange={() => set(scale.key, null)}
            />
            <span>
              <strong>Not sure</strong>
            </span>
          </label>
        </Fieldset>
      ))}

      <TextField
        id={`${idPrefix}-vision`}
        label="Anything about your vision that helps us?"
        hint="Optional. For example, low vision, glare, or glasses for close work."
        value={value.vision ?? ""}
        onChange={(next) => set("vision", next)}
        multiline
        rows={2}
        disabled={disabled}
      />

      <TextField
        id={`${idPrefix}-fatigue`}
        label="How does tiredness affect your work?"
        hint="Optional. For example, when you need a break."
        value={value.fatigue ?? ""}
        onChange={(next) => set("fatigue", next)}
        multiline
        rows={2}
        disabled={disabled}
      />
    </>
  );
}
