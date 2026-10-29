import { Link } from "react-router-dom";

/**
 * Shared building blocks for the public pages.
 *
 * Home, About, and Explore are the same kind of page: a hero, a run of
 * sections, cards in a grid, and a closing call to action. These components
 * describe that once so the three pages differ in content, not in styling.
 */

/** A full-width band that owns its background and vertical rhythm. */
export function Section({ children, tone = "default", labelledBy, className = "" }) {
  return (
    <section
      className={`section section-${tone} ${className}`.trim()}
      aria-labelledby={labelledBy}
    >
      <div className="section-inner">{children}</div>
    </section>
  );
}

/** Heading block: eyebrow, title, optional lead paragraph. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  id,
  align = "start",
  as = "h2",
}) {
  const Heading = as;

  return (
    <div className={`section-heading section-heading-${align}`}>
      {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
      <Heading className="section-title" id={id}>
        {title}
      </Heading>
      {lead && <p className="section-lead">{lead}</p>}
    </div>
  );
}

/** The top of a public page: eyebrow, one h1, lead, and optional actions. */
export function PageHero({ eyebrow, title, lead, actions, aside, tone = "brand" }) {
  return (
    <section className={`hero hero-${tone}`}>
      <div className="hero-inner">
        <div className="hero-copy">
          {eyebrow && <p className="hero-eyebrow">{eyebrow}</p>}
          <h1 className="hero-title">{title}</h1>
          {lead && <p className="hero-lead">{lead}</p>}
          {actions && <div className="hero-actions">{actions}</div>}
        </div>
        {aside && <div className="hero-aside">{aside}</div>}
      </div>
    </section>
  );
}

/** A grid of cards, with a column count that collapses on small screens. */
export function CardGrid({ children, columns = 2, className = "" }) {
  return (
    <div className={`card-grid card-grid-${columns} ${className}`.trim()}>
      {children}
    </div>
  );
}

/** A card with an optional icon, number, title, and body. */
export function FeatureCard({ icon, number, title, children, footer }) {
  return (
    <article className="feature-card">
      {(icon || number) && (
        <div className="feature-card-top">
          {icon && <span className="feature-card-icon">{icon}</span>}
          {number && <span className="feature-card-number">{number}</span>}
        </div>
      )}
      <h3 className="feature-card-title">{title}</h3>
      {children && <div className="feature-card-body">{children}</div>}
      {footer && <div className="feature-card-footer">{footer}</div>}
    </article>
  );
}

/** Closing call to action, used at the foot of each public page. */
export function CallToAction({ eyebrow, title, lead, actions }) {
  return (
    <Section tone="brand">
      <div className="cta">
        <div className="cta-copy">
          {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
          <h2 className="cta-title">{title}</h2>
          {lead && <p className="cta-lead">{lead}</p>}
        </div>
        {actions && <div className="cta-actions">{actions}</div>}
      </div>
    </Section>
  );
}

/** Text link with a trailing chevron, for "read more" style destinations. */
export function ArrowLink({ to, children, variant = "primary" }) {
  return (
    <Link to={to} className={`arrow-link arrow-link-${variant}`}>
      {children}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
