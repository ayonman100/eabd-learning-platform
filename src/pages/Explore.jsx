
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { learningPaths } from "../data/learningPaths.js";
import "./Explore.css";

export default function Explore() {
  return (
    <main id="main-content" className="explore-page" tabIndex="-1">
      <section className="explore-hero">
        <p className="explore-eyebrow">FIND YOUR PATHWAY</p>

        <h1>Start with what interests you.</h1>

        <p>
          Your goals come first. Explore a practical learning opportunity,
          discover what it involves, and take the next step at your own pace.
        </p>
      </section>

      <section
        className="explore-catalogue"
        aria-labelledby="pathways-heading"
      >
        <div className="explore-section-heading">
          <div>
            <p className="explore-eyebrow">LEARNING OPPORTUNITIES</p>
            <h2 id="pathways-heading">Explore a pathway</h2>
          </div>

          <p>
            Each pathway can be adapted around your goals and participation
            needs while keeping the intended learning outcome clear.
          </p>
        </div>

        {learningPaths.length === 0 ? (
          <div className="explore-empty">
            <h3>New pathways are on the way</h3>
            <p>
              EABD is developing practical learning opportunities around
              learners' interests and goals.
            </p>
          </div>
        ) : (
          <div className="pathway-grid">
            {learningPaths.map((pathway) => (
              <article className="pathway-card" key={pathway.id}>
                <div className="pathway-card-top">
                  <span className="pathway-category">
                    {pathway.category}
                  </span>

                  {pathway.status === "pilot" && (
                    <span className="pathway-status">Pilot</span>
                  )}
                </div>

                <h3>{pathway.title}</h3>

                <p className="pathway-summary">{pathway.summary}</p>

                <div className="pathway-outcome">
                  <h4>What you'll work towards</h4>
                  <p>{pathway.outcome}</p>
                </div>

                <div className="pathway-details">
                  <p>
                    <strong>Learning format:</strong> {pathway.format}
                  </p>

                  <p>
                    <strong>Duration:</strong> {pathway.duration}
                  </p>
                </div>

                <Link
                  className="pathway-link"
                  to={`/signup?pathway=${encodeURIComponent(pathway.id)}`}
                  aria-label={`Apply for ${pathway.title}`}
                >
                  <span>Explore this pathway</span>
                  <ArrowRight
                    size={18}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="explore-support">
        <h2>Your pathway should work for you.</h2>

        <p>
          EABD starts with your interests, understands your current position,
          and works with you to identify barriers, useful resources, support,
          and practical next steps. Accessibility needs inform how you
          participate, not what you are allowed to aspire to.
        </p>

        <Link to="/about" className="explore-secondary-link">
          Learn about EABD
        </Link>
      </section>
    </main>
  );
}
