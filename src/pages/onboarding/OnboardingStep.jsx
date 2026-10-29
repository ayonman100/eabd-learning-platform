import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import { ErrorMessage } from "../../components/ui/StatusBanner.jsx";
import { ONBOARDING_STEPS, stepIndex } from "./onboardingSteps.js";

/**
 * Shared shell for every onboarding step.
 *
 * Renders the labelled progress bar, the centred card, one primary action, a
 * Back button, and the error region. Focus moves to the heading on each step
 * change so a screen reader announces the new question.
 */
export default function OnboardingStep({
  stepKey,
  title,
  intro,
  children,
  error,
  onSubmit,
  submitting = false,
  submitLabel = "Save and continue",
  onBack,
  secondaryAction,
  showBack = true,
  primaryAction = true,
}) {
  const headingRef = useRef(null);
  const current = stepIndex(stepKey);
  const total = ONBOARDING_STEPS.length;

  useEffect(() => {
    headingRef.current?.focus();
  }, [stepKey]);

  return (
    <div className="wizard-page">
      <div className="wizard-shell">
        <aside className="wizard-aside">
          <ol className="wizard-steps">
            {ONBOARDING_STEPS.map((step, index) => {
              const state =
                index === current ? "current" : index < current ? "done" : "upcoming";

              return (
                <li key={step.key} className={`wizard-step is-${state}`}>
                  <span className="wizard-step-marker" aria-hidden="true">
                    {index < current ? "\u2713" : index + 1}
                  </span>
                  <span className="wizard-step-label">
                    <span className="wizard-step-name">{step.label}</span>
                    <span className="wizard-step-hint">{step.hint}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="wizard-main">
          <div className="wizard-progress-head">
            <span className="wizard-counter">
              Step {current + 1} of {total}
            </span>
            <span className="wizard-remaining">
              {total - current - 1 === 0 ? "Last step" : `${total - current - 1} to go`}
            </span>
          </div>

          <div
            className="wizard-progress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={current + 1}
            aria-valuetext={`Step ${current + 1} of ${total}: ${ONBOARDING_STEPS[current]?.label ?? ""}`}
          >
            <span
              className="wizard-progress-fill"
              style={{ width: `${((current + 1) / total) * 100}%` }}
            />
          </div>

          <div className="wizard-card">
            <p className="wizard-eyebrow">Setting up the record</p>
            <h1 className="wizard-title" id="onboarding-heading" ref={headingRef} tabIndex="-1">
              {title}
            </h1>
            {intro && <p className="wizard-intro">{intro}</p>}

            <ErrorMessage>{error}</ErrorMessage>

            <form onSubmit={onSubmit} className="wizard-form">
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

            {secondaryAction}

            <p className="wizard-leave">
              <Link to="/dashboard">Leave and finish later</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
