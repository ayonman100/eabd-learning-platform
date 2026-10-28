import { useEffect, useRef } from "react";
import "./Home.css";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Compass,
  Lightbulb,
  Target,
  Accessibility,
} from "lucide-react";

/**
 * The hero film loops. It pauses when the visitor has asked for reduced motion,
 * either through the system setting or the in-app display settings.
 */
function useHeroVideo(enabled) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;

    function sync() {
      const reduce =
        reduceQuery.matches || root.classList.contains("a11y-reduced-motion");

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
    reduceQuery.addEventListener("change", sync);

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      reduceQuery.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, [enabled]);

  return videoRef;
}

export default function Home() {
  const videoRef = useHeroVideo(true);

  return (
    <main id="main-content" className="home-page" tabIndex="-1">
      <section className="hero" aria-labelledby="hero-title">
        <video
          ref={videoRef}
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source
            src="/videos/firefly-world-without-barriers.mp4"
            type="video/mp4"
          />
        </video>

        <div className="hero-overlay" />

        <div className="hero-content">
          <p className="eyebrow">EMPOWERING ABILITY BEYOND DISABILITY</p>

          <h1 id="hero-title">
            Your interest.
            <br />
            Your pathway.
            <br />
            <span>Your opportunity.</span>
          </h1>

          <p className="hero-description">
            Everyone has something they want to learn, create or become.
            EABD helps young people with disabilities address barriers,
            build practical skills and move towards goals they choose.
          </p>

          <div className="hero-actions">
            <Link className="button button-primary" to="/explore">
              Explore your possibilities
              <ArrowRight size={18} aria-hidden="true" />
            </Link>

            <Link className="button button-secondary" to="/about">
              Discover EABD
            </Link>
          </div>

          <p className="hero-note">
            Inclusive by design. Person-led by choice. Connected to opportunity.
          </p>
        </div>

        <div className="hero-scroll-cue" aria-hidden="true">
          <span />
          Start with what interests you
        </div>
      </section>

      <section className="home-intro section-container">
        <div className="section-heading">
          <p className="eyebrow">A DIFFERENT STARTING POINT</p>
          <h2>
            Start with the person.
            <br />
            Not the limitation.
          </h2>
        </div>

        <div className="intro-copy">
          <p>
            A disability should not decide what someone is allowed to aspire
            to. The starting point is the person's own interest, goal and
            preferred direction.
          </p>
          <p>
            EABD works with each learner to understand what stands between
            them and that goal, then explore practical ways forward while
            keeping the real-world task and its essential standards in view.
          </p>
        </div>
      </section>

      <section className="pathway-section">
        <div className="section-container">
          <div className="section-heading centered">
            <p className="eyebrow">FROM INTEREST TO ACTION</p>
            <h2>A pathway shaped around you.</h2>
            <p className="section-subtitle">
              No fixed menu of interests. No one-size-fits-all route.
              Start with what matters to you.
            </p>
          </div>

          <div className="pathway-grid">
            <article className="pathway-card">
              <span className="pathway-icon">
                <Compass size={25} aria-hidden="true" />
              </span>
              <p className="card-number">01</p>
              <h3>Discover your direction</h3>
              <p>
                Explore your interests, describe your goal and decide
                what progress means to you.
              </p>
            </article>

            <article className="pathway-card">
              <span className="pathway-icon">
                <Accessibility size={25} aria-hidden="true" />
              </span>
              <p className="card-number">02</p>
              <h3>Identify the barriers</h3>
              <p>
                Understand the skills, access, tools, resources or support
                that may be needed.
              </p>
            </article>

            <article className="pathway-card">
              <span className="pathway-icon">
                <Lightbulb size={25} aria-hidden="true" />
              </span>
              <p className="card-number">03</p>
              <h3>Build and test your route</h3>
              <p>
                Try practical learning activities, adapt what gets in the
                way and learn from each attempt.
              </p>
            </article>

            <article className="pathway-card">
              <span className="pathway-icon">
                <Target size={25} aria-hidden="true" />
              </span>
              <p className="card-number">04</p>
              <h3>Move towards opportunity</h3>
              <p>
                Build evidence of your skills and explore next steps in
                work, business, freelancing or further learning.
              </p>
            </article>
          </div>

          <p className="pathway-disclaimer">
            This is EABD's developing approach. Learning pathways are
            tailored to each participant and refined through testing.
          </p>
        </div>
      </section>

      <section className="home-cta section-container">
        <div>
          <p className="eyebrow">YOUR GOAL IS THE STARTING POINT</p>
          <h2>What would you like to learn or become?</h2>
          <p>
            Bring your interest. Together, we can explore the steps,
            skills and support that may help you move forward.
          </p>
        </div>

        <Link className="button button-primary" to="/explore">
          Take the first step
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
