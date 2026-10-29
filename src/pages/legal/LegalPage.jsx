import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Button from "../../components/ui/Button.jsx";

/**
 * Shared shell for the reference and legal pages: one heading block, an
 * optional table of contents, and prose at a readable measure.
 */
export default function LegalPage({ eyebrow, title, lead, updated, contents, children }) {
  return (
    <main id="main-content" className="legal-page" tabIndex="-1">
      <div className="legal-inner">
        <div className="journey-back">
          <Link to="/">
            <ArrowLeft size={18} aria-hidden="true" />
            Back to home
          </Link>
        </div>

        <header className="legal-header">
          {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
          <h1 className="page-title">{title}</h1>
          {lead && <p className="page-lead">{lead}</p>}
          {updated && (
            <p className="legal-updated">Last updated {updated}</p>
          )}
        </header>

        {contents && contents.length > 0 && (
          <nav className="legal-toc" aria-label="On this page">
            <h2>On this page</h2>
            <ol>
              {contents.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>{item.label}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="legal-body">{children}</div>

        <div className="legal-footer">
          <Button to="/" variant="secondary" icon={<ArrowLeft size={17} />}>
            Return home
          </Button>
        </div>
      </div>
    </main>
  );
}
