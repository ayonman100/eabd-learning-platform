import { ArrowRight, Clock, Layers, Sparkles } from "lucide-react";
import { learningPaths } from "../data/learningPaths.js";
import Button from "../components/ui/Button.jsx";
import {
  ArrowLink,
  CallToAction,
  CardGrid,
  FeatureCard,
  PageHero,
  Section,
  SectionHeading,
} from "../components/ui/PageSections.jsx";

export default function Explore() {
  return (
    <main id="main-content" tabIndex="-1">
      <PageHero
        eyebrow="Find your pathway"
        title="Start with what interests you."
        lead="Your goals come first. Explore a practical learning opportunity, discover what it involves, and take the next step at your own pace."
        actions={
          <Button to="/signup" iconAfter={<ArrowRight size={18} />}>
            Create an account
          </Button>
        }
      />

      <Section labelledBy="pathways-heading" tone="surface">
        <SectionHeading
          eyebrow="Learning opportunities"
          title="Explore a pathway"
          lead="Each pathway can be adapted around your goals and participation needs while keeping the intended learning outcome clear."
          id="pathways-heading"
        />

        {learningPaths.length === 0 ? (
          <div className="card">
            <h3 className="card-title">New pathways are on the way</h3>
            <p className="card-subtitle">
              EABD is developing practical learning opportunities around learners' interests and
              goals.
            </p>
          </div>
        ) : (
          <CardGrid columns={2}>
            {learningPaths.map((pathway) => (
              <article className="pathway" key={pathway.id}>
                <div className="pathway-top">
                  <span className="pill pill-progress">{pathway.category}</span>
                  {pathway.status === "pilot" && <span className="pill pill-waiting">Pilot</span>}
                </div>

                <h3 className="pathway-title">{pathway.title}</h3>
                <p className="pathway-summary">{pathway.summary}</p>

                <div className="pathway-outcome">
                  <p className="pathway-label">What you'll work towards</p>
                  <p>{pathway.outcome}</p>
                </div>

                <dl className="pathway-details">
                  <div>
                    <dt>
                      <Layers size={15} aria-hidden="true" />
                      Format
                    </dt>
                    <dd>{pathway.format}</dd>
                  </div>
                  <div>
                    <dt>
                      <Clock size={15} aria-hidden="true" />
                      Duration
                    </dt>
                    <dd>{pathway.duration}</dd>
                  </div>
                </dl>

                {pathway.skills?.length > 0 && (
                  <ul className="pathway-skills">
                    {pathway.skills.map((skill) => (
                      <li key={skill}>
                        <Sparkles size={13} aria-hidden="true" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  to={`/signup?pathway=${encodeURIComponent(pathway.id)}`}
                  className="pathway-action"
                  iconAfter={<ArrowRight size={18} />}
                >
                  Explore this pathway
                </Button>
              </article>
            ))}
          </CardGrid>
        )}
      </Section>

      <Section tone="violet">
        <SectionHeading
          eyebrow="How it works"
          title="Your pathway should work for you."
          lead="EABD starts with your interests, understands your current position, and works with you to identify barriers, useful resources, support, and practical next steps. Accessibility needs inform how you participate, not what you are allowed to aspire to."
        />

        <CardGrid columns={3}>
          <FeatureCard title="Start with the person" icon={<Sparkles size={20} aria-hidden="true" />}>
            <p>Your interest and goal set the direction, not a fixed menu.</p>
          </FeatureCard>
          <FeatureCard title="Adapt how you take part" icon={<Layers size={20} aria-hidden="true" />}>
            <p>Support and adjustments change the route, not the destination.</p>
          </FeatureCard>
          <FeatureCard title="Move at your pace" icon={<Clock size={20} aria-hidden="true" />}>
            <p>Each step waits for you, and a supervisor reviews what you send.</p>
          </FeatureCard>
        </CardGrid>

        <p className="section-footnote">
          <ArrowLink to="/about">Learn how EABD works</ArrowLink>
        </p>
      </Section>

      <CallToAction
        eyebrow="Your next step"
        title="Begin with what matters to you."
        lead="You do not need every step figured out. Start with an interest, and we can explore a practical pathway together."
        actions={
          <Button to="/signup" variant="secondary" iconAfter={<ArrowRight size={18} />}>
            Create an account
          </Button>
        }
      />
    </main>
  );
}
