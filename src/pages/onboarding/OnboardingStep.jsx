import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage } from "../../components/ui/StatusBanner.jsx";
import { ONBOARDING_STEPS, stepIndex } from "./onboardingSteps.js";

/**
 * Shared shell for every onboarding step: one heading, a step counter, a single
 * primary action, a Back button, and an error region. Focus moves to the heading
 * whenever the step changes so a screen reader announces the new question.
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
}) {
  const headingRef = useRef(null);
  const current = stepIndex(stepKey);

  useEffect(() => {
    headingRef.current?.focus();
  }, [stepKey]);

  return (
    <main id="main-content" className="onboarding-page" tabIndex="-1">
      <div className="onboarding-inner">
        <nav className="onboarding-progress" aria-label="Onboarding progress">
          <ol>
            {ONBOARDING_STEPS.map((step, index) => (
              <li
                key={step.key}
                className={
                  index === current
                    ? "is-current"
                    : index < current
                      ? "is-done"
                      : ""
                }
                aria-current={index === current ? "step" : undefined}
              >
                <span className="onboarding-step-dot" aria-hidden="true" />
                {step.label}
              </li>
            ))}
          </ol>
          <p className="onboarding-counter">
            Step {current + 1} of {ONBOARDING_STEPS.length}
          </p>
        </nav>

        <section
          className="auth-card onboarding-card"
          aria-labelledby="onboarding-heading"
        >
          <p className="auth-eyebrow">SETTING UP YOUR RECORD</p>
          <h1 id="onboarding-heading" ref={headingRef} tabIndex="-1">
            {title}
          </h1>
          {intro && <p>{intro}</p>}

          <ErrorMessage>{error}</ErrorMessage>

          <form onSubmit={onSubmit}>
            {children}

            <div className="onboarding-actions">
              {showBack && (
                <button type="button" className="button-quiet" onClick={onBack}>
                  Back
                </button>
              )}
              <button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : submitLabel}
              </button>
            </div>
          </form>

          {secondaryAction}

          <p className="onboarding-leave">
            <Link to="/dashboard">Leave and finish later</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
