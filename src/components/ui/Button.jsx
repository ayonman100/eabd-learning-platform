import { Link } from "react-router-dom";

/**
 * The one button in the app.
 *
 * Variants:
 *   primary   solid brand fill, for the single main action on a screen
 *   secondary outlined, for a supporting action
 *   quiet     borderless, for Back and Cancel
 *   danger    destructive confirmation
 *
 * Renders a Link when `to` is given, an anchor when `href` is given, otherwise a
 * button. Every variant keeps the 44px minimum target and the focus ring.
 */
const VARIANT_CLASS = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  quiet: "btn btn-quiet",
  danger: "btn btn-danger",
};

export default function Button({
  children,
  variant = "primary",
  icon,
  iconAfter,
  to,
  href,
  type = "button",
  onClick,
  disabled = false,
  fullWidth = false,
  className = "",
  ...rest
}) {
  const classes = [
    VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary,
    fullWidth ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {icon && <span className="btn-icon" aria-hidden="true">{icon}</span>}
      <span className="btn-label">{children}</span>
      {iconAfter && <span className="btn-icon" aria-hidden="true">{iconAfter}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled} {...rest}>
      {content}
    </button>
  );
}
