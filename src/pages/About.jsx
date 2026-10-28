
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Compass,
  HeartHandshake,
  Lightbulb,
  Route,
  Target,
  Wrench,
} from "lucide-react";
import "./About.css";

const processSteps = [
  {
    number: "01",
    title: "Discover",
    description:
      "Start with the person's interests, ambitions, and what they want to achieve.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Understand",
    description:
      "Learn about their current position, strengths, circumstances, and participation needs.",
    icon: HeartHandshake,
  },
  {
    number: "03",
    title: "Identify",
    description:
      "Identify the barriers, skills, knowledge, tools, and resources relevant to the goal.",
    icon: Target,
  },
  {
    number: "04",
    title: "Explore",
    description:
      "Explore practical routes towards the goal, considering accessible ways to learn and participate.",
    icon: Route,
  },
  {
    number: "05",
    title: "Test",
    description:
      "Try an achievable next step, learn from the experience, and adjust where needed.",
    icon: Lightbulb,
  },
  {
    number: "06",
    title: "Build",
    description:
      "Develop relevant skills, practical experience, and evidence of progress.",
    icon: Wrench,
  },
  {
    number: "07",
    title: "Connect",
    description:
      "Explore opportunities to apply skills through work, enterprise, freelancing, or further learning.",
    icon: ArrowRight,
  },
];

export default function About() {
  return (
    <main id="main-content" className="about-page" tabIndex="-1">
      <section className="about-hero">
        <div className="about-container about-hero-grid">
          <div className="about-hero-copy">
            <p className="about-eyebrow">ABOUT EABD</p>

            <h1>
              Your ability deserves a pathway, not a predetermined limit.
            </h1>

            <p className="about-hero-description">
              Empowering Ability Beyond Disability (EABD) is an initiative that helps empower young people age 15-24
              in education, living in Lagos Nigeria, identify and address the barriers between skills of their interests
              and the goals they want to pursue.
            </p>

            <div className="about-hero-actions">
              <Link to="/explore" className="about-primary-link">
                Explore learning pathways
                <ArrowRight size={18} aria-hidden="true" />
              </Link>

              <Link to="/signup" className="about-text-link">
                Get started
              </Link>
            </div>
          </div>

          <div className="about-hero-art" aria-hidden="true">
            <div className="about-art-orbit about-art-orbit-one" />
            <div className="about-art-orbit about-art-orbit-two" />

            <div className="about-art-center">
              <HeartHandshake size={48} strokeWidth={1.5} />
              <span>Ability beyond barriers</span>
            </div>

            <span className="about-art-label about-art-label-one">
              Your interests
            </span>
            <span className="about-art-label about-art-label-two">
              Your pathway
            </span>
            <span className="about-art-label about-art-label-three">
              Your goals
            </span>
          </div>
        </div>
      </section>

      <section className="about-principle">
        <div className="about-container about-principle-inner">
          <p className="about-eyebrow">OUR GUIDING PRINCIPLE</p>

          <h2>
            Disability informs the accommodation.
            <span> Interest informs the pathway.</span>
          </h2>

          <p>
            A person's disability should not automatically determine what
            they can learn or aspire to do. We begin with the person's
            chosen interest, then work to understand what support,
            resources, skills, and accessible approaches may help them
            pursue it.
          </p>
        </div>
      </section>

      <section className="about-approach">
        <div className="about-container">
          <div className="about-section-heading">
            <p className="about-eyebrow">OUR APPROACH</p>

            <h2>Start with the person. Work towards the goal.</h2>

            <p>
              Every person has a different starting point. EABD uses a
              structured process to explore practical ways forward,
              rather than expecting everyone to follow an identical route.
            </p>
          </div>

          <div className="about-process-grid">
            {processSteps.map((step) => {
              const StepIcon = step.icon;

              return (
                <article className="about-process-card" key={step.number}>
                  <div className="about-process-card-top">
                    <span className="about-step-number">
                      {step.number}
                    </span>

                    <span className="about-step-icon" aria-hidden="true">
                      <StepIcon size={22} strokeWidth={1.8} />
                    </span>
                  </div>

                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-difference">
        <div className="about-container about-difference-grid">
          <div>
            <p className="about-eyebrow">WHAT GUIDES US</p>
            <h2>Inclusion by design. Choice at the centre.</h2>
          </div>

          <div className="about-difference-content">
            <article>
              <h3>Person-led by choice</h3>
              <p>
                The learner's interests and goals guide the direction.
                Support should help people pursue meaningful ambitions,
                not replace their choices.
              </p>
            </article>

            <article>
              <h3>Inclusive by design</h3>
              <p>
                Accessibility and participation needs are considered
                when shaping how a person learns, practises, and
                demonstrates what they can do.
              </p>
            </article>

            <article>
              <h3>Connected to opportunity</h3>
              <p>
                Learning is a step towards practical possibilities,
                including employment, self-employment, entrepreneurship,
                freelancing, and further education.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="about-pilot">
        <div className="about-container about-pilot-inner">
          <div className="about-pilot-copy">
            <p className="about-eyebrow">A PRACTICAL START</p>
            <h2>Learning through meaningful projects.</h2>

            <p>
              EABD is developing its approach through practical,
              interest-led learning. The current pilot focuses on a
              Canva design project, giving a learner the opportunity
              to work towards a finished design with appropriate
              guidance and support.
            </p>

            <p>
              This is a starting point for testing the learning
              experience and improving the approach. It is not a
              claim that every pathway or support system is already
              fully established.
            </p>

            <Link to="/explore" className="about-primary-link">
              View the current pilot
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <div className="about-pilot-card">
            <div className="about-pilot-icon" aria-hidden="true">
              <Lightbulb size={28} />
            </div>

            <p className="about-pilot-label">CURRENT PILOT</p>
            <h3>Canva Design Project</h3>

            <ul>
              <li>Explore visual design</li>
              <li>Practise using Canva</li>
              <li>Create a useful design</li>
              <li>Review the finished project</li>
            </ul>

            <span className="about-pilot-status">Pilot stage</span>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="about-container">
          <p className="about-eyebrow">YOUR NEXT STEP</p>
          <h2>Begin with what matters to you.</h2>

          <p>
            You do not need to have every step figured out. Start with an
            interest or goal, and explore what a practical pathway could
            look like.
          </p>

          <div className="about-hero-actions">
            <Link to="/explore" className="about-primary-link">
              Explore pathways
              <ArrowRight size={18} aria-hidden="true" />
            </Link>

            <Link to="/signup" className="about-cta-secondary">
              Create an account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
