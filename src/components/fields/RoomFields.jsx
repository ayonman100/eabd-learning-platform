import { Fieldset, TextField } from "./FieldPrimitives.jsx";

const CANVA_SURFACES = [
  { value: "app", label: "The Canva app" },
  { value: "browser", label: "Canva in a web browser" },
];

/**
 * Room fields: the equipment and setting the person works in.
 *
 * Used by: StepRoom (onboarding), Profile, and the supervisor's read-only summary.
 */
export default function RoomFields({
  value,
  onChange,
  disabled = false,
  idPrefix = "room",
}) {
  function set(field, next) {
    onChange({ ...value, [field]: next });
  }

  return (
    <>
      <TextField
        id={`${idPrefix}-device`}
        label="What device do you use?"
        hint="Optional. For example, a laptop, tablet or phone."
        value={value.device ?? ""}
        onChange={(next) => set("device", next)}
        disabled={disabled}
      />

      <TextField
        id={`${idPrefix}-os`}
        label="Which system does it run?"
        hint="Optional. For example, Windows, macOS, iPadOS or Android."
        value={value.device_os ?? ""}
        onChange={(next) => set("device_os", next)}
        disabled={disabled}
      />

      <TextField
        id={`${idPrefix}-screen`}
        label="How big is the screen?"
        hint="Optional. A rough size is enough."
        value={value.screen ?? ""}
        onChange={(next) => set("screen", next)}
        disabled={disabled}
      />

      <TextField
        id={`${idPrefix}-pointer`}
        label="How do you point and tap?"
        hint="Optional. For example, one finger, a mouse, a switch or eye gaze."
        value={value.pointer ?? ""}
        onChange={(next) => set("pointer", next)}
        disabled={disabled}
      />

      <Fieldset legend="How do you open Canva?">
        {CANVA_SURFACES.map((option) => (
          <label className="onboarding-option" key={option.value}>
            <input
              type="radio"
              name={`${idPrefix}-canva-surface`}
              value={option.value}
              checked={value.canva_surface === option.value}
              disabled={disabled}
              onChange={() => set("canva_surface", option.value)}
            />
            <span>
              <strong>{option.label}</strong>
            </span>
          </label>
        ))}
      </Fieldset>

      <TextField
        id={`${idPrefix}-seat`}
        label="Where do you sit?"
        hint="Optional. For example, a desk chair, a wheelchair at a desk, or a sofa."
        value={value.seat ?? ""}
        onChange={(next) => set("seat", next)}
        disabled={disabled}
      />

      <TextField
        id={`${idPrefix}-who`}
        label="Who is usually in the room with you?"
        hint="Optional. This helps us understand the support around you."
        value={value.who_in_room ?? ""}
        onChange={(next) => set("who_in_room", next)}
        multiline
        rows={2}
        disabled={disabled}
      />
    </>
  );
}
