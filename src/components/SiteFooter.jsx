import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Mail } from "lucide-react";
import Button from "./ui/Button.jsx";
import { StatusMessage, ErrorMessage } from "./ui/StatusBanner.jsx";

const SITE_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/explore", label: "Explore pathways" },
  { to: "/signup", label: "Create an account" },
  { to: "/signin", label: "Sign in" },
];

const RESOURCE_LINKS = [
  { to: "/glossary", label: "Glossary" },
  { to: "/terms", label: "Terms of use" },
  { to: "/privacy", label: "Privacy notice" },
];

/**
 * Site footer: brand, page links, and a newsletter sign-up.
 *
 * Shown on the public pages only. Once a learner is signed in, the footer's
 * marketing links would compete with their own navigation, so the app shell
 * leaves it out.
 */
export default function SiteFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function handleSubscribe(event) {
    event.preventDefault();
    setStatus("");
    setError("");

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address to subscribe.");
      return;
    }

    // There is no mailing list service connected yet. The form says so rather
    // than pretending to subscribe someone and losing their address.
    setStatus(
      "Thank you. Newsletter sign-up is not connected yet, so your address has not been stored. Please check back soon."
    );
    setEmail("");
  }

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-brand-link" aria-label="EABD home">
            <img className="footer-mark" src="/EABD-mark.png" alt="" aria-hidden="true" />
            <span className="footer-brand-words">
              <span className="footer-brand-name">EABD</span>
              <span className="footer-brand-tagline">Empowering Ability Beyond Disability</span>
            </span>
          </Link>

          <p className="footer-phrase">
            Everyone has something they want to learn, create or become. We help young people with
            disabilities address barriers, build practical skills, and move towards goals they
            choose.
          </p>

          <p className="footer-values">
            Inclusive by design. Person-led by choice. Connected to opportunity.
          </p>
        </div>

        <nav className="footer-links" aria-labelledby="footer-links-heading">
          <h2 id="footer-links-heading" className="footer-heading">
            The site
          </h2>

          <ul>
            {SITE_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>

          <h2 className="footer-heading footer-heading-secondary">Resources</h2>

          <ul>
            {RESOURCE_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-newsletter">
          <h2 className="footer-heading">Stay in touch</h2>
          <p className="footer-newsletter-copy">
            Occasional news about new pathways and pilot updates. No more than one email a month.
          </p>

          <form onSubmit={handleSubscribe} className="newsletter-form" noValidate>
            <label className="visually-hidden" htmlFor="newsletter-email">
              Email address
            </label>
            <div className="newsletter-field">
              <Mail size={18} aria-hidden="true" />
              <input
                id="newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <Button type="submit" iconAfter={<ArrowRight size={17} />}>
              Subscribe
            </Button>
          </form>

          <StatusMessage>{status}</StatusMessage>
          <ErrorMessage>{error}</ErrorMessage>

          <p className="footer-newsletter-note">
            Read how we handle your information in the{" "}
            <Link to="/privacy">privacy notice</Link>.
          </p>
        </div>
      </div>

      <div className="footer-base">
        <p>EABD is a pilot. Pathways and support are refined through testing.</p>
        <p>
          <Link to="/terms">Terms</Link>
          <span aria-hidden="true"> · </span>
          <Link to="/privacy">Privacy</Link>
          <span aria-hidden="true"> · </span>
          <Link to="/glossary">Glossary</Link>
        </p>
      </div>
    </footer>
  );
}

/** A small tick list used on legal pages. */
export function TickList({ items }) {
  return (
    <ul className="tick-list">
      {items.map((item) => (
        <li key={item}>
          <Check size={16} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
