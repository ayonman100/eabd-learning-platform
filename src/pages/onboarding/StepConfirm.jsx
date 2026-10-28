import { useState } from "react";
import { EXTRACTABLE_FIELDS, FIELD_LABELS } from "../../lib/extraction.js";

const DECISIONS = [
  { value: "accept", label: "Accept" },
  { value: "edit", label: "Edit" },
  { value: "leave-out", label: "Leave out" },
];

/**
 * Step 3. One row per suggested field, showing the value and the quote it came
 * from. A person accepts, edits, or leaves out each suggestion. Nothing is saved
 * until Confirm and continue, and the document can be deleted at that moment.
 */
export default function StepConfirm({
  fields,
  decisions,
  onChangeDecision,
  deleteFile,
  onDeleteFileChange,
  onConfirm,
  onDiscard,
  submitting,
  error,
}) {
  const [confirmError, setConfirmError] = useState("");

  const suggested = EXTRACTABLE_FIELDS.filter((key) => fields[key]);
  const acceptedCount = Object.values(decisions).filter(
    (decision) => decision.choice !== "leave-out"
  ).length;

  function handleConfirm() {
    if (acceptedCount === 0) {
      setConfirmError(
        "Accept at least one suggestion, or discard the document and type the answers instead."
      );
      return;
    }
    setConfirmError("");
    onConfirm();
  }

  return (
    <>
      <p>
        Check each suggestion against the document. The quoted words are copied
        from the file. You can change a value or leave it out.
      </p>

      {(error || confirmError) && (
        <p role="alert" className="error-message">
          {error || confirmError}
        </p>
      )}

      <ul className="confirm-list">
        {suggested.map((key) => {
          const entry = fields[key];
          const decision = decisions[key] ?? { choice: "accept", value: entry.value };

          return (
            <li className="confirm-item" key={key}>
              <fieldset className="onboarding-fieldset">
                <legend>{FIELD_LABELS[key]}</legend>

                <p className="confirm-value">
                  Suggested: <strong>{String(entry.value)}</strong>
                </p>
                <blockquote className="confirm-evidence">
                  &ldquo;{entry.evidence}&rdquo;
                </blockquote>

                <div className="segmented-options" role="group" aria-label={`What to do with ${FIELD_LABELS[key]}`}>
                  {DECISIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="segmented-option"
                      aria-pressed={decision.choice === option.value}
                      onClick={() =>
                        onChangeDecision(key, {
                          ...decision,
                          choice: option.value,
                        })
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {decision.choice === "edit" && (
                  <div className="auth-field">
                    <label htmlFor={`confirm-${key}`}>
                      Your version of {FIELD_LABELS[key].toLowerCase()}
                    </label>
                    <input
                      id={`confirm-${key}`}
                      value={decision.value ?? ""}
                      onChange={(event) =>
                        onChangeDecision(key, {
                          ...decision,
                          value: event.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </fieldset>
            </li>
          );
        })}
      </ul>

      <label className="onboarding-option consent-option">
        <input
          type="checkbox"
          checked={deleteFile}
          onChange={(event) => onDeleteFileChange(event.target.checked)}
        />
        <span>
          <strong>Delete the document after I confirm</strong>
          <small>Recommended. The answers you accepted are kept.</small>
        </span>
      </label>

      <div className="onboarding-actions">
        <button
          type="button"
          className="button-quiet"
          onClick={onDiscard}
          disabled={submitting}
        >
          Discard the document
        </button>
        <button type="button" onClick={handleConfirm} disabled={submitting}>
          {submitting ? "Saving..." : "Confirm and continue"}
        </button>
      </div>
    </>
  );
}
