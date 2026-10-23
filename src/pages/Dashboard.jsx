
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  UserRound,
} from "lucide-react";
import { learningPaths } from "../data/learningPaths.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();

  const name =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Learner";

  const selectedPathway = new URLSearchParams(
    window.location.search
  ).get("pathway");

  const pathway = learningPaths.find(
    (item) => item.id === selectedPathway
  );

  return (
    <main id="main-content" className="dashboard-page" tabIndex="-1">
      <section className="dashboard-welcome">
        <p className="dashboard-eyebrow">YOUR EABD LEARNING SPACE</p>
        <h1>Welcome, {name}.</h1>
        <p>
          Your goals lead the way. Use this space to explore your pathway
          and take your next practical step.
        </p>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="journey-heading"
      >
        <div className="dashboard-section-heading">
          <div>
            <p className="dashboard-eyebrow">YOUR JOURNEY</p>
            <h2 id="journey-heading">Where would you like to begin?</h2>
          </div>
        </div>

        {pathway ? (
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

              <Link
                className="dashboard-primary-link"
                to={`/onboarding?pathway=${encodeURIComponent(pathway.id)}`}
              >
                Continue to pathway setup
                <ArrowRight size={18} aria-hidden="true" />
              </Link>

             <Link
  className="dashboard-primary-link"
  to={`/learning-journey?pathway=${encodeURIComponent(pathway.id)}`}
>
  Open learning journey
  <ArrowRight size={18} aria-hidden="true" />
</Link>

            </div>
          </article>
        ) : (
          <article className="dashboard-empty-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              <Compass size={24} />
            </div>

            <div>
              <h3>Your learning journey starts with your interests.</h3>
              <p>
                Explore the available opportunity and choose a starting
                point that connects with something you want to learn or do.
              </p>

              <Link className="dashboard-primary-link" to="/explore">
                Explore learning pathways
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </article>
        )}
      </section>

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
    </main>
  );
}
