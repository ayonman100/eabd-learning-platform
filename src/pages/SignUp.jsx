
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { learningPaths } from "../data/learningPaths.js";

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedPathway = searchParams.get("pathway") || "";
  const pathway = learningPaths.find(
    (item) => item.id === selectedPathway
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const { data, error: signUpError } = await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        emailRedirectTo: `${window.location.origin}/onboarding`,
      });

      if (signUpError) throw signUpError;

      if (data?.session) {
        navigate(
          pathway
            ? `/onboarding?pathway=${encodeURIComponent(pathway.id)}`
            : "/onboarding",
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
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <small>Use at least 6 characters.</small>
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
