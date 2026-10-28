import { TextField } from "../../components/fields/FieldPrimitives.jsx";

const RELATIONSHIPS = [
  { value: "parent", label: "I am their parent" },
  { value: "guardian", label: "I am their legal guardian" },
  { value: "carer", label: "I am their carer" },
  { value: "other", label: "Another relationship" },
];

/**
 * Step 1 fields. Creates the learner row on submit, so later steps have a place
 * to save. Fields only; the shell and the save live in OnboardingFlow.
 */
export default function StepWho({ draft, onChange, isGuardian }) {
  function set(field, next) {
    onChange({ ...draft, [field]: next });
  }

  if (!isGuardian) {
    return (
      <TextField
        id="who-first-name"
        label="What should we call you?"
        hint="Your first name is enough. It appears on your dashboard."
        value={draft.first_name ?? ""}
        onChange={(next) => set("first_name", next)}
        required
        autoComplete="given-name"
      />
    );
  }

  return (
    <>
      <TextField
        id="who-first-name"
        label="What is the learner's first name?"
        hint="We use this name on their record and dashboard."
        value={draft.first_name ?? ""}
        onChange={(next) => set("first_name", next)}
        required
        autoComplete="off"
      />

      <fieldset className="onboarding-fieldset">
        <legend>What is your relationship to them?</legend>
        {RELATIONSHIPS.map((option) => (
          <label className="onboarding-option" key={option.value}>
            <input
              type="radio"
              name="relationship"
              value={option.value}
              checked={(draft.relationship ?? "parent") === option.value}
              onChange={() => set("relationship", option.value)}
            />
            <span>
              <strong>{option.label}</strong>
            </span>
          </label>
        ))}
      </fieldset>

      <label className="onboarding-option consent-option">
        <input
          type="checkbox"
          checked={Boolean(draft.guardian_consent)}
          onChange={(event) => set("guardian_consent", event.target.checked)}
          required
        />
        <span>
          <strong>
            I am this person's parent, guardian or carer, and I have their
            agreement to share this information.
          </strong>
          <small>This is recorded on their learner record with the date.</small>
        </span>
      </label>
    </>
  );
}
