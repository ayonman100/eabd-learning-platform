import { ArrowRight, Compass, HeartHandshake, Lightbulb, Route, Target, Wrench } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import {
  CallToAction,
  CardGrid,
  FeatureCard,
  PageHero,
  Section,
  SectionHeading,
} from "../components/ui/PageSections.jsx";

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Discover",
    description: "Start with the person's interests, ambitions, and what they want to achieve.",
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
    description: "Develop relevant skills, practical experience, and evidence of progress.",
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

const PRINCIPLES = [
  {
    title: "Person-led by choice",
    description:
      "The learner's interests and goals guide the direction. Support should help people pursue meaningful ambitions, not replace their choices.",
  },
  {
    title: "Inclusive by design",
    description:
      "Accessibility and participation needs are considered when shaping how a person learns, practises, and demonstrates what they can do.",
  },
  {
    title: "Connected to opportunity",
    description:
      "Learning is a step towards practical possibilities, including employment, self-employment, entrepreneurship, freelancing, and further education.",
  },
];

export default function About() {
  return (
    <main id="main-content" tabIndex="-1">
      <PageHero
        eyebrow="About EABD"
        title="Your ability deserves a pathway, not a predetermined limit."
        lead="Empowering Ability Beyond Disability helps people identify and address the barriers between their interests and the goals they want to pursue."
        actions={
          <>
            <Button to="/explore" iconAfter={<ArrowRight size={18} />}>
              Explore learning pathways
            </Button>
            <Button to="/signup" variant="secondary">
              Get started
            </Button>
          </>
        }
        aside={
          <div className="principle-mark">
            <HeartHandshake size={40} strokeWidth={1.5} aria-hidden="true" />
            <p>Ability beyond barriers</p>
            <ul>
              <li>Your interests</li>
              <li>Your pathway</li>
              <li>Your goals</li>
            </ul>
          </div>
        }
      />

      <Section tone="surface" labelledBy="principle-heading">
        <SectionHeading
          eyebrow="Our guiding principle"
          title="Disability informs the accommodation. Interest informs the pathway."
          id="principle-heading"
          align="center"
        />
        <div className="prose prose-center">
          <p>
            A person's disability should not automatically determine what they can learn or aspire
            to do. We begin with the person's chosen interest, then work to understand what support,
            resources, skills, and accessible approaches may help them pursue it.
          </p>
        </div>
      </Section>

      <Section labelledBy="approach-heading">
        <SectionHeading
          eyebrow="Our approach"
          title="Start with the person. Work towards the goal."
          lead="Every person has a different starting point. EABD uses a structured process to explore practical ways forward, rather than expecting everyone to follow an identical route."
          id="approach-heading"
        />

        <CardGrid columns={4}>
          {PROCESS_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <FeatureCard
                key={step.number}
                number={step.number}
                title={step.title}
                icon={<Icon size={20} strokeWidth={1.8} aria-hidden="true" />}
              >
                <p>{step.description}</p>
              </FeatureCard>
            );
          })}
        </CardGrid>
      </Section>

      <Section tone="surface" labelledBy="principles-heading">
        <SectionHeading
          eyebrow="What guides us"
          title="Inclusion by design. Choice at the centre."
          id="principles-heading"
        />

        <CardGrid columns={3}>
          {PRINCIPLES.map((principle) => (
            <FeatureCard key={principle.title} title={principle.title}>
              <p>{principle.description}</p>
            </FeatureCard>
          ))}
        </CardGrid>
      </Section>

      <Section labelledBy="pilot-heading">
        <div className="two-column">
          <div className="two-column-copy">
            <SectionHeading
              eyebrow="A practical start"
              title="Learning through meaningful projects."
              id="pilot-heading"
            />
            <div className="prose">
              <p>
                EABD is developing its approach through practical, interest-led learning. The current
                pilot focuses on a Canva design project, giving a learner the opportunity to work
                towards a finished design with appropriate guidance and support.
              </p>
              <p>
                This is a starting point for testing the learning experience and improving the
                approach. It is not a claim that every pathway or support system is already fully
                established.
              </p>
            </div>
            <p>
              <Button to="/explore" iconAfter={<ArrowRight size={18} />}>
                View the current pilot
              </Button>
            </p>
          </div>

          <aside className="pilot-card" aria-label="Current pilot">
            <span className="pill pill-waiting">Current pilot</span>
            <h3 className="pilot-card-title">Canva Design Project</h3>
            <ul className="pilot-card-list">
              <li>Explore visual design</li>
              <li>Practise using Canva</li>
              <li>Create a useful design</li>
              <li>Review the finished project</li>
            </ul>
            <div className="stat-row">
              <div className="stat">
                <span className="stat-value">Four weeks</span>
                <span className="stat-label">Adjusted to the learner</span>
              </div>
              <div className="stat">
                <span className="stat-value">Reviewed</span>
                <span className="stat-label">Each step, by a supervisor</span>
              </div>
            </div>
          </aside>
        </div>
      </Section>

      <CallToAction
        eyebrow="Your next step"
        title="Begin with what matters to you."
        lead="You do not need to have every step figured out. Start with an interest or goal, and explore what a practical pathway could look like."
        actions={
          <>
            <Button to="/explore" variant="secondary" iconAfter={<ArrowRight size={18} />}>
              Explore pathways
            </Button>
            <Button to="/signup" variant="secondary">
              Create an account
            </Button>
          </>
        }
      />
    </main>
  );
}
