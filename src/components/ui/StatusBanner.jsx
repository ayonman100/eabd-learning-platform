/**
 * Shared feedback banners.
 *
 * StatusMessage announces a result with role="status". ErrorMessage interrupts
 * with role="alert". Both are used across sign-in, sign-up, onboarding, profile,
 * the learning journey, and supervisor screens so the wording and markup stay
 * in one place.
 */

export function StatusMessage({ children, className = "" }) {
  if (!children) return null;

  return (
    <p role="status" className={`status-message ${className}`.trim()}>
      {children}
    </p>
  );
}

export function ErrorMessage({ children, className = "" }) {
  if (!children) return null;

  return (
    <p role="alert" className={`error-message ${className}`.trim()}>
      {children}
    </p>
  );
}
