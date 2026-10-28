import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import "./Footer.css";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Link to="/" aria-label="EABD home">
            <img
              src="/EABD-LOGO.png"
              alt="EABD, Empowering Ability Beyond Disability"
              width="64"
              height="64"
              loading="lazy"
            />
          </Link>
          <div>
            <strong>Empowering Ability Beyond Disability</strong>
            <p>Building Skills. Creating Opportunities.</p>
          </div>
        </div>

        <nav className="site-footer-links" aria-label="Footer navigation">
          <Link to="/about">About EABD</Link>
          <Link to="/explore">Explore pathways</Link>
          <Link to="/signup">Create an account</Link>
          <Link to="/signin">Learner sign in</Link>
        </nav>

        <a
          className="site-footer-contact"
          href="mailto:empowerabilitybeyonddisability@gmail.com"
        >
          Contact EABD
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>

        <p className="site-footer-note">
          Inclusive by design. Person-led by choice. Connected to opportunity.
        </p>
      </div>
    </footer>
  );
}
