
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <main id="main-content" className="auth-page" tabIndex="-1">
      <section className="auth-card" aria-labelledby="signin-heading">
        <p className="auth-eyebrow">WELCOME BACK</p>
        <h1 id="signin-heading">Sign in to EABD</h1>
        <p>Continue your learning journey at your own pace.</p>

        {message && <p role="status">{message}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}

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
            <input
              id="signin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={submitting}>
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
