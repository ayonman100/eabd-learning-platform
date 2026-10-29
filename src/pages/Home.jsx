import { useEffect, useRef } from "react";
import { ArrowRight, Compass, Lightbulb, Target, Accessibility, Sparkles } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import {
  CallToAction,
  CardGrid,
  FeatureCard,
  Section,
  SectionHeading,
} from "../components/ui/PageSections.jsx";

/**
 * The hero film loops. It pauses when the visitor has asked for reduced motion,
 * either through the system setting or the in-app display settings.
 */
function useHeroVideo() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const root = document.documentElement;
    const reduceQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    function sync() {
      const reduce =
        Boolean(reduceQuery?.matches) || root.classList.contains("a11y-reduced-motion");

      if (reduce) {
        video.pause();
        video.removeAttribute("autoplay");
      } else {
        video.setAttribute("autoplay", "");
        const play = video.play();
        if (play?.catch) play.catch(() => {});
      }
    }

    sync();
    reduceQuery?.addEventListener("change", sync);

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      reduceQuery?.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, []);

  return videoRef;
}

const PATHWAY_STEPS = [
  {
    number: "01",
    title: "Discover your direction",
    description:
      "Explore your interests, describe your goal and decide what progress means to you.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Identify the barriers",
    description:
      "Understand the skills, access, tools, resources or support that may be needed.",
    icon: Accessibility,
  },
  {
    number: "03",
    title: "Build and test your route",
    description:
      "Try practical learning activities, adapt what gets in the way and learn from each attempt.",
    icon: Lightbulb,
  },
  {
    number: "04",
    title: "Move towards opportunity",
    description:
      "Build evidence of your skills and explore next steps in work, business, freelancing or further learning.",
    icon: Target,
  },
];

export default function Home() {
  const videoRef = useHeroVideo();

  return (
    <main id="main-content" tabIndex="-1">
      <section className="home-hero" aria-labelledby="hero-title">
        <video
          ref={videoRef}
          className="home-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/videos/firefly-world-without-barriers.mp4" type="video/mp4" />
        </video>
        <div className="home-hero-scrim" />

        <div className="home-hero-inner">
          <p className="home-hero-eyebrow">Empowering ability beyond disability</p>

          <h1 className="home-hero-title" id="hero-title">
            Your interest.
            <br />
            Your pathway.
            <br />
            <span>Your opportunity.</span>
          </h1>

          <p className="home-hero-lead">
            Everyone has something they want to learn, create or become. EABD helps young people
            with disabilities address barriers, build practical skills and move towards goals they
            choose.
          </p>

          <div className="home-hero-actions">
            <Button to="/explore" iconAfter={<ArrowRight size={18} />}>
              Explore your possibilities
            </Button>
            <Button to="/about" variant="secondary">
              Discover EABD
            </Button>
          </div>

          <p className="home-hero-note">
            Inclusive by design. Person-led by choice. Connected to opportunity.
          </p>
        </div>
      </section>

      <Section tone="violet" labelledBy="intro-heading">
        <div className="two-column">
          <div>
            <SectionHeading
              eyebrow="A different starting point"
              title="Start with the person. Not the limitation."
              id="intro-heading"
            />
          </div>
          <div className="prose">
            <p>
              A disability should not decide what someone is allowed to aspire to. The starting
              point is the person's own interest, goal and preferred direction.
            </p>
            <p>
              EABD works with each learner to understand what stands between them and that goal,
              then explore practical ways forward while keeping the real-world task and its
              essential standards in view.
            </p>
          </div>
        </div>
      </Section>

      <Section labelledBy="pathway-heading">
        <SectionHeading
          eyebrow="From interest to action"
          title="A pathway shaped around you."
          lead="No fixed menu of interests. No one-size-fits-all route. Start with what matters to you."
          id="pathway-heading"
          align="center"
        />

        <CardGrid columns={4}>
          {PATHWAY_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <FeatureCard
                key={step.number}
                number={step.number}
                title={step.title}
                icon={<Icon size={20} aria-hidden="true" />}
              >
                <p>{step.description}</p>
              </FeatureCard>
            );
          })}
        </CardGrid>

        <p className="section-footnote section-footnote-center">
          This is EABD's developing approach. Learning pathways are tailored to each participant and
          refined through testing.
        </p>
      </Section>

      <Section tone="teal" labelledBy="included-heading">
        <SectionHeading
          eyebrow="Built in, not bolted on"
          title="Adjustments are part of the design."
          lead="The record you complete shapes how the app looks and behaves, from button size to how much is shown at once."
          id="included-heading"
        />

        <CardGrid columns={3}>
          <FeatureCard title="Larger targets" icon={<Accessibility size={20} aria-hidden="true" />}>
            <p>
              Buttons and fields grow to 64 or 88 pixels when the record suggests it, and you can
              change it yourself at any time.
            </p>
          </FeatureCard>
          <FeatureCard title="One step at a time" icon={<Target size={20} aria-hidden="true" />}>
            <p>
              The dashboard can show a single next step instead of a whole week, so the page stays
              calm.
            </p>
          </FeatureCard>
          <FeatureCard title="Read aloud and contrast" icon={<Sparkles size={20} aria-hidden="true" />}>
            <p>
              Read the page aloud, raise contrast, or increase spacing from the display panel in the
              header.
            </p>
          </FeatureCard>
        </CardGrid>
      </Section>

      <CallToAction
        eyebrow="Your goal is the starting point"
        title="What would you like to learn or become?"
        lead="Bring your interest. Together, we can explore the steps, skills and support that may help you move forward."
        actions={
          <Button to="/explore" variant="secondary" iconAfter={<ArrowRight size={18} />}>
            Take the first step
          </Button>
        }
      />
    </main>
  );
}
