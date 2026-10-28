
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passkeySubmitting, setPasskeySubmitting] = useState(false);

  const destination = location.state?.from?.pathname || "/dashboard";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const { error: signInError } = await signIn({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.message || "We couldn't sign you in. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasskeySignIn() {
    setError("");
    setMessage("");

    if (!isSupabaseConfigured || !supabase) {
      setError("Account services are unavailable. Please try again later.");
      return;
    }

    if (
      !window.isSecureContext ||
      !window.PublicKeyCredential ||
      !navigator.credentials
    ) {
      setError(
        "Passkey sign-in is not supported in this browser or context. Try the deployed HTTPS website or use email and password."
      );
      return;
    }

    setPasskeySubmitting(true);

    try {
      const { error: passkeyError } =
        await supabase.auth.signInWithPasskey();

      if (passkeyError) {
        throw passkeyError;
      }

      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.message ||
          "Passkey sign-in did not complete. You can try again or use email and password."
      );
    } finally {
      setPasskeySubmitting(false);
    }
  }
  return (
    <main id="main-content" className="auth-page" tabIndex="-1">
      <section className="auth-card" aria-labelledby="signin-heading">
        <p className="auth-eyebrow">WELCOME BACK</p>
        <h1 id="signin-heading">Sign in to EABD</h1>
        <p>Continue your learning journey at your own pace.</p>

        {message && <p role="status">{message}</p>}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="signin-email">Email address</label>
            <input
              id="signin-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signin-password">Password</label>

            <div className="auth-password-wrapper">
              <input
                id="signin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
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

            <p className="auth-forgot-password">
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="auth-passkey-divider" aria-hidden="true">
          <span>OR</span>
        </div>

        <button
          className="auth-passkey-button"
          type="button"
          onClick={handlePasskeySignIn}
          disabled={submitting || passkeySubmitting}
        >
          {passkeySubmitting
            ? "Waiting for your passkey..."
            : "Sign in with a passkey"}
        </button>

        <p>
          New to EABD? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
