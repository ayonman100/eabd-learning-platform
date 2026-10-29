import { useEffect, useRef } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button.jsx";
import { ErrorMessage } from "./StatusBanner.jsx";

/**
 * The one stepped form in the app: onboarding and profile editing both use it.
 *
 * It provides a labelled progress bar, a centered card at one maximum width, a
 * single heading that takes focus on each step change, one primary action, and
 * one error region. Steps supply their fields only.
 */
export default function WizardShell({
  eyebrow = "Setting up the record",
  steps,
  currentIndex,
  title,
  intro,
  children,
  error,
  onSubmit,
  submitting = false,
  submitLabel = "Save and continue",
  onBack,
  showBack = true,
  primaryAction = true,
  footer,
  aside,
}) {
  const headingRef = useRef(null);
  const total = steps.length;
  const step = steps[currentIndex] ?? steps[0];

  useEffect(() => {
    headingRef.current?.focus();
  }, [currentIndex]);

  return (
    <div className="wizard-page">
      <div className="wizard-shell">
        <aside className="wizard-aside">
          <ol className="wizard-steps">
            {steps.map((entry, index) => {
              const state =
                index === currentIndex ? "current" : index < currentIndex ? "done" : "upcoming";

              return (
                <li key={entry.key ?? entry.label} className={`wizard-step is-${state}`}>
                  <span className="wizard-step-marker" aria-hidden="true">
                    {index < currentIndex ? <Check size={14} strokeWidth={3} /> : index + 1}
                  </span>
                  <span className="wizard-step-label">
                    <span className="wizard-step-name">{entry.label}</span>
                    {entry.hint && <span className="wizard-step-hint">{entry.hint}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="wizard-main">
          <div className="wizard-progress-head">
            <span className="wizard-counter">
              Step {currentIndex + 1} of {total}
            </span>
            <span className="wizard-remaining">
              {total - currentIndex - 1 === 0
                ? "Last step"
                : `${total - currentIndex - 1} to go`}
            </span>
          </div>

          <div
            className="wizard-progress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={currentIndex + 1}
            aria-valuetext={`Step ${currentIndex + 1} of ${total}: ${step?.label ?? ""}`}
          >
            <span
              className="wizard-progress-fill"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>

          <div className="wizard-card">
            <p className="wizard-eyebrow">{eyebrow}</p>
            <h1 className="wizard-title" id="wizard-heading" ref={headingRef} tabIndex="-1">
              {title}
            </h1>
            {intro && <p className="wizard-intro">{intro}</p>}

            <ErrorMessage>{error}</ErrorMessage>

            <form
              onSubmit={onSubmit}
              className="wizard-form"
              noValidate={false}
            >
              <div className="wizard-fields">{children}</div>

              <div className="wizard-actions">
                {showBack && (
                  <Button
                    variant="quiet"
                    onClick={onBack}
                    disabled={submitting}
                    icon={<ChevronLeft size={18} />}
                  >
                    Back
                  </Button>
                )}

                {primaryAction && (
                  <Button
                    type="submit"
                    disabled={submitting}
                    iconAfter={<ChevronRight size={18} />}
                    className="wizard-primary"
                  >
                    {submitting ? "Saving..." : submitLabel}
                  </Button>
                )}
              </div>
            </form>

            {footer}
          </div>

          {aside}
        </div>
      </div>
    </div>
  );
}
