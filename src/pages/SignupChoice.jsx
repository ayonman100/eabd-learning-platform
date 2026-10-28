import { Link, useSearchParams } from "react-router-dom";
import { UserRound, UsersRound, ArrowRight, ShieldCheck } from "lucide-react";

export default function SignupChoice() {
  const [searchParams] = useSearchParams();
  const existingQuery = new URLSearchParams(searchParams);

  function signupLink(type) {
    const query = new URLSearchParams(existingQuery);
    query.set("type", type);
    return `/signup/create?${query.toString()}`;
  }

  return (
    <main id="main-content" className="signup-choice-page" tabIndex="-1">
      <section className="signup-choice-container">
        <p className="auth-eyebrow">YOUR EABD JOURNEY STARTS HERE</p>

        <h1>Who is signing up?</h1>

        <p className="signup-choice-intro">
          Every learner has their own goals and interests.
          Choose the option that best describes you so we can
          guide you through the right registration process.
        </p>

        <div className="signup-choice-grid">
          <Link
            to={signupLink("self")}
            className="signup-choice-card"
          >
            <span className="signup-choice-icon signup-choice-icon-self">
              <UserRound size={30} aria-hidden="true" />
            </span>

            <span className="signup-choice-card-title">
              I'm signing up for myself
            </span>

            <span className="signup-choice-card-description">
              I'm the learner. I want to explore my interests,
              build skills and work towards my own goals.
            </span>

            <span className="signup-choice-card-action">
              Continue as a learner
              <ArrowRight size={18} aria-hidden="true" />
            </span>
          </Link>

          <Link
            to={signupLink("other")}
            className="signup-choice-card"
          >
            <span className="signup-choice-icon signup-choice-icon-other">
              <UsersRound size={30} aria-hidden="true" />
            </span>

            <span className="signup-choice-card-title">
              I'm signing up for someone else
            </span>

            <span className="signup-choice-card-description">
              I'm a parent, guardian or supporter helping
              someone explore their learning opportunities.
            </span>

            <span className="signup-choice-card-action">
              Continue as a supporter
              <ArrowRight size={18} aria-hidden="true" />
            </span>
          </Link>
        </div>

        <p className="signup-choice-privacy">
          <ShieldCheck size={18} aria-hidden="true" />
          Your information should be handled privately and
          used to support the learner's journey.
        </p>

        <p className="signup-choice-signin">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
