import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, Compass, UserRound } from "lucide-react";
import { useLearner } from "../context/LearnerContext.jsx";
import { getPathwayOrFirst } from "../data/learningPaths.js";
import { listTaskProgress } from "../lib/db/progress.js";
import { latestReviewByTask, listReviews } from "../lib/db/reviews.js";
import { getNextTask, getProgressSummary } from "../utils/progress.js";
import { deriveAdaptations, resolveSettings } from "../lib/adaptations.js";
import ReviewFeedbackCard from "../components/ui/ReviewFeedbackCard.jsx";
import { ErrorMessage } from "../components/ui/StatusBanner.jsx";

export default function Dashboard() {
  const { learner, loading, isSupervisor } = useLearner();
  const [searchParams] = useSearchParams();
  const pathway = getPathwayOrFirst(searchParams.get("pathway"));

  const [rows, setRows] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");

  const learnerId = learner?.id ?? null;

  useEffect(() => {
    if (!learnerId) return undefined;

    let active = true;
    Promise.all([
      listTaskProgress(learnerId, pathway.id),
      listReviews(learnerId, pathway.id),
    ])
      .then(([nextRows, nextReviews]) => {
        if (!active) return;
        setRows(nextRows);
        setReviews(nextReviews);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });

    return () => {
      active = false;
    };
  }, [learnerId, pathway.id]);

  if (loading) {
    return (
      <main id="main-content" className="dashboard-page" aria-live="polite">
        <p>Loading your learning space...</p>
      </main>
    );
  }

  const settings = resolveSettings(
    deriveAdaptations(learner),
    learner?.ui_settings ?? {}
  );

  const name = learner?.first_name || "Learner";
  const isGuardian = learner?.relationship && learner.relationship !== "self";
  const summary = getProgressSummary(pathway, rows);
  const next = getNextTask(pathway, rows);
  const latestReview = [...latestReviewByTask(reviews).values()].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  )[0];

  return (
    <main id="main-content" className="dashboard-page" tabIndex="-1">
      <div className="dashboard-inner">
        <section className="dashboard-welcome">
          <p className="dashboard-eyebrow">
            {isGuardian ? "LEARNER RECORD" : "YOUR EABD LEARNING SPACE"}
          </p>
          <h1>{isGuardian ? `${name}'s learning space` : `Welcome, ${name}.`}</h1>
          <p>
            {isGuardian
              ? "Everything here belongs to the young person you support. You can change any answer with them."
              : "Your goals lead the way. Use this space to take your next practical step."}
          </p>

          <div className="dashboard-links">
            <Link className="dashboard-account-link" to="/profile">
              Your record and adjustments
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link className="dashboard-account-link" to="/account">
              Account and face or fingerprint sign-in
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            {isSupervisor && (
              <Link className="dashboard-account-link" to="/supervisor">
                Supervisor area
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
        </section>

        <ErrorMessage>{error}</ErrorMessage>

        {!learner?.onboarding_completed_at && (          <section className="dashboard-section">
            <div className="dashboard-empty-card">
              <div className="dashboard-card-icon" aria-hidden="true">
                <Compass size={24} />
              </div>
              <div>
                <h2>Finish setting up the record</h2>
                <p>
                  A few questions about what helps this person learn will shape
                  the screen and the pathway.
                </p>
                <Link
                  className="dashboard-primary-link"
                  to={`/onboarding?pathway=${encodeURIComponent(pathway.id)}`}
                >
                  Continue setting up
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {settings.oneThingAtATime ? (
          <section className="dashboard-section" aria-labelledby="next-heading">
            <p className="dashboard-eyebrow">ONE STEP AT A TIME</p>
            <h2 id="next-heading">Your next step</h2>

            {next ? (
              <article className="dashboard-next-card">
                <p className="dashboard-status">
                  Week {next.weekIndex + 1}
                </p>
                <h3>{next.task.title}</h3>
                <p>{next.task.description}</p>
                <Link
                  className="dashboard-primary-link"
                  to={`/learning-journey?pathway=${encodeURIComponent(pathway.id)}`}
                >
                  Open this step
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </article>
            ) : (
              <article className="dashboard-next-card">
                <h3>Everything is sent or reviewed</h3>
                <p>Well done. Your supervisor's feedback is on each step.</p>
              </article>
            )}

            {latestReview && (
              <div className="dashboard-feedback">
                <h3>Latest feedback</h3>
                <ReviewFeedbackCard review={latestReview} />
              </div>
            )}
          </section>
        ) : (
          <section className="dashboard-section" aria-labelledby="journey-heading">
            <div className="dashboard-section-heading">
              <div>
                <p className="dashboard-eyebrow">YOUR JOURNEY</p>
                <h2 id="journey-heading">Where would you like to begin?</h2>
              </div>
              <strong className="dashboard-percentage">{summary.percentage}%</strong>
            </div>

            <article className="dashboard-pathway-card">
              <div className="dashboard-card-icon" aria-hidden="true">
                <BookOpen size={24} />
              </div>

              <div className="dashboard-pathway-content">
                <span className="dashboard-status">
                  {pathway.status === "pilot" ? "Pilot pathway" : "Learning pathway"}
                </span>

                <h3>{pathway.title}</h3>
                <p>{pathway.description}</p>

                <p className="dashboard-next-step">
                  <strong>Intended outcome:</strong> {pathway.outcome}
                </p>

                <p className="dashboard-next-step">
                  {summary.doneCount} of {summary.totalTasks} steps done.
                  {summary.reviewedCount > 0 &&
                    ` ${summary.reviewedCount} reviewed by your supervisor.`}
                </p>

                <div className="dashboard-actions">
                  <Link
                    className="dashboard-primary-link"
                    to={`/learning-journey?pathway=${encodeURIComponent(pathway.id)}`}
                  >
                    Open learning journey
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>

            {latestReview && (
              <div className="dashboard-feedback">
                <h3>Latest supervisor feedback</h3>
                <ReviewFeedbackCard review={latestReview} />
              </div>
            )}
          </section>
        )}

        <section
          className="dashboard-section dashboard-how-section"
          aria-labelledby="how-heading"
        >
          <p className="dashboard-eyebrow">HOW EABD WORKS</p>
          <h2 id="how-heading">A pathway built around you</h2>

          <div className="dashboard-steps">
            <article className="dashboard-step">
              <span className="dashboard-step-number">01</span>
              <h3>Share your goal</h3>
              <p>Tell us what interests you and what you want to achieve.</p>
            </article>

            <article className="dashboard-step">
              <span className="dashboard-step-number">02</span>
              <h3>Identify what helps</h3>
              <p>Explore barriers, useful resources, and participation needs.</p>
            </article>

            <article className="dashboard-step">
              <span className="dashboard-step-number">03</span>
              <h3>Take a practical step</h3>
              <p>Work towards a meaningful outcome at a suitable pace.</p>
            </article>
          </div>
        </section>

        <section className="dashboard-support">
          <div className="dashboard-support-icon" aria-hidden="true">
            <UserRound size={22} />
          </div>

          <div>
            <h2>Need a different starting point?</h2>
            <p>
              Your pathway should reflect your interests, circumstances,
              and the support that helps you participate.
            </p>
            <Link to="/about">
              Learn how EABD works
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
