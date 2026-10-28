
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { learningPaths } from "../data/learningPaths.js";

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const registrationType = searchParams.get("type") === "other" ? "other" : "self";
  const selectedPathway = searchParams.get("pathway") || "";
  const pathway = learningPaths.find(
    (item) => item.id === selectedPathway
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match. Please check them.");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error: signUpError } = await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        emailRedirectTo: `${window.location.origin}/onboarding?type=${registrationType}${pathway ? `&pathway=${encodeURIComponent(pathway.id)}` : ""}`,
        registrationType,
      });

      if (signUpError) throw signUpError;

      if (data?.session) {
        navigate(
          pathway
            ? `/onboarding?pathway=${encodeURIComponent(pathway.id)}`
            : `/onboarding?type=${registrationType}`,
          { replace: true }
        );
      } else {
        setMessage(
          "Your account request was received. Check your email for a confirmation link before signing in."
        );
      }
    } catch (err) {
      setError(
        err.message || "We couldn't create your account. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="auth-page" tabIndex="-1">
      <section className="auth-card" aria-labelledby="signup-heading">
        <p className="auth-eyebrow">YOUR NEXT CHAPTER</p>
        <h1 id="signup-heading">Create your EABD account</h1>
        <p>{registrationType === "other" ? "You are creating an account to support a learner." : "You are creating an account for yourself."}</p>
        <p>
          Start with your interests. We'll help you explore a practical
          learning pathway around your goals.
        </p>

        {pathway && (
          <p>
            Selected pathway: <strong>{pathway.title}</strong>
          </p>
        )}

        {message && <p role="status">{message}</p>}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <div className="auth-password-control">
              <input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby="signup-password-help"
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" size={20} />
                ) : (
                  <Eye aria-hidden="true" size={20} />
                )}
              </button>
            </div>
            <small id="signup-password-help">
              Use at least 6 characters.
            </small>
          </div>

          <div className="auth-field">
            <label htmlFor="signup-confirm-password">
              Confirm password
            </label>
            <div className="auth-password-control">
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() =>
                  setShowConfirmation((visible) => !visible)
                }
                aria-label={
                  showConfirmation
                    ? "Hide password confirmation"
                    : "Show password confirmation"
                }
                aria-pressed={showConfirmation}
              >
                {showConfirmation ? (
                  <EyeOff aria-hidden="true" size={20} />
                ) : (
                  <Eye aria-hidden="true" size={20} />
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p>
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
