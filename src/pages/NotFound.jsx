import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import "./NotFound.css";

export default function NotFound() {
  return (
    <main id="main-content" className="not-found-page" tabIndex="-1">
      <div className="not-found-card">
        <p className="not-found-eyebrow">404 | PAGE NOT FOUND</p>
        <h1>We couldn't find that page.</h1>
        <p>
          The page may have moved, or the link may be incorrect.
          You can return home or explore the available learning pathways.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="not-found-primary">
            <ArrowLeft size={18} aria-hidden="true" />
            Return home
          </Link>
          <Link to="/explore" className="not-found-secondary">
            <Compass size={18} aria-hidden="true" />
            Explore pathways
          </Link>
        </div>
      </div>
    </main>
  );
}
