import { Fieldset, TextField } from "./FieldPrimitives.jsx";

const PACES = [
  {
    value: "guided",
    label: "More guided sessions",
    hint: "Someone works alongside you for most of the step.",
  },
  {
    value: "flexible",
    label: "Flexible practice with check-ins",
    hint: "You work on your own and someone checks in.",
  },
  {
    value: "independent",
    label: "Mostly independent learning",
    hint: "You work through the steps yourself and ask when you want to.",
  },
];

/**
 * Goal fields: what the person wants to work towards and what helps them.
 *
 * Used by: StepGoals (onboarding), Profile.
 */
export default function GoalFields({
  value,
  onChange,
  disabled = false,
  idPrefix = "goal",
  required = false,
}) {
  function set(field, next) {
    onChange({ ...value, [field]: next });
  }

  return (
    <>
      <TextField
        id={`${idPrefix}-goal`}
        label="What would you like to achieve?"
        hint="Required. One or two sentences is plenty."
        value={value.goal ?? ""}
        onChange={(next) => set("goal", next)}
        multiline
        rows={3}
        required={required}
        disabled={disabled}
      />

      <TextField
        id={`${idPrefix}-starting-point`}
        label="Where are you starting from?"
        hint="Optional. What do you already know or feel comfortable doing?"
        value={value.starting_point ?? ""}
        onChange={(next) => set("starting_point", next)}
        multiline
        rows={3}
        disabled={disabled}
      />

      <TextField
        id={`${idPrefix}-barriers`}
        label="What might make this difficult?"
        hint="Optional. For example, a device, internet, time, materials or support."
        value={value.barriers ?? ""}
        onChange={(next) => set("barriers", next)}
        multiline
        rows={3}
        disabled={disabled}
      />

      <TextField
        id={`${idPrefix}-support`}
        label="What support or adjustments would help you take part?"
        hint="Optional. Tell us what would make learning more accessible for you."
        value={value.support ?? ""}
        onChange={(next) => set("support", next)}
        multiline
        rows={3}
        disabled={disabled}
      />

      <TextField
        id={`${idPrefix}-resources`}
        label="Do you have useful tools or resources?"
        hint="Optional. Devices, software, internet, materials, people or places."
        value={value.resources ?? ""}
        onChange={(next) => set("resources", next)}
        multiline
        rows={2}
        disabled={disabled}
      />

      <Fieldset legend="What learning pace works best for you?">
        {PACES.map((option) => (
          <label className="onboarding-option" key={option.value}>
            <input
              type="radio"
              name={`${idPrefix}-pace`}
              value={option.value}
              checked={value.learning_pace === option.value}
              disabled={disabled}
              onChange={() => set("learning_pace", option.value)}
            />
            <span>
              <strong>{option.label}</strong>
              <small>{option.hint}</small>
            </span>
          </label>
        ))}
      </Fieldset>

      <TextField
        id={`${idPrefix}-other`}
        label="Anything else we should understand?"
        hint="Optional. Share only what you are comfortable sharing."
        value={value.other_details ?? ""}
        onChange={(next) => set("other_details", next)}
        multiline
        rows={3}
        disabled={disabled}
      />
    </>
  );
}
