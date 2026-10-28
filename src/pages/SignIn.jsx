import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Fingerprint } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { passkeyErrorMessage } from "../lib/passkeys.js";
import PasswordField from "../components/ui/PasswordField.jsx";
import { ErrorMessage, StatusMessage } from "../components/ui/StatusBanner.jsx";

export default function SignIn() {
  const { signIn, signInWithPasskey, passkeysSupported } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);

  const destination = location.state?.from?.pathname || "/dashboard";

  async function handlePasskey() {
    setError("");
    setMessage("");
    setPasskeyBusy(true);

    const { error: passkeyError } = await signInWithPasskey();

    setPasskeyBusy(false);

    if (passkeyError) {
      setError(passkeyErrorMessage(passkeyError));
      return;
    }

    navigate(destination, { replace: true });
  }

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
      setError(err.message || "We couldn't sign you in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="auth-page" tabIndex="-1">
      <section className="auth-card" aria-labelledby="signin-heading">
        <p className="auth-eyebrow">WELCOME BACK</p>
        <h1 id="signin-heading">Sign in to EABD</h1>
        <p>Continue your learning journey at your own pace.</p>

        <StatusMessage>{message}</StatusMessage>
        <ErrorMessage>{error}</ErrorMessage>

        {passkeysSupported && (
          <>
            <button
              type="button"
              className="auth-passkey-button"
              onClick={handlePasskey}
              disabled={passkeyBusy || submitting}
              aria-describedby="signin-passkey-help"
            >
              <Fingerprint aria-hidden="true" size={22} />
              {passkeyBusy
                ? "Waiting for your device..."
                : "Sign in with face or fingerprint"}
            </button>
            <small id="signin-passkey-help" className="auth-passkey-help">
              Set this up once from your account, after signing in with your
              email.
            </small>
            <p className="auth-divider">or use your email</p>
          </>
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

          <PasswordField
            id="signin-password"
            name="password"
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={submitting}
          />

          <button type="submit" disabled={submitting || passkeyBusy}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p>
          New to EABD? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
