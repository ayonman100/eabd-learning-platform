import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error(
          "Account services are temporarily unavailable. Please try again later."
        );
      }

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (resetError) {
        throw resetError;
      }

      setMessage(
        "If an account exists for that email address, a password reset link will be sent. Check your inbox and spam folder."
      );
    } catch (err) {
      setError(
        err.message ||
          "We couldn't process your request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="auth-page" tabIndex="-1">
      <section
        className="auth-card"
        aria-labelledby="forgot-password-heading"
      >
        <p className="auth-eyebrow">ACCOUNT RECOVERY</p>

        <h1 id="forgot-password-heading">Forgot your password?</h1>

        <p>
          Enter the email address you used to register with EABD.
          We'll help you get back into your account.
        </p>

        {message && <p role="status">{message}</p>}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="recovery-email">Email address</label>

            <input
              id="recovery-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Sending link..." : "Send reset link"}
          </button>
        </form>

        <p>
          Remembered your password? <Link to="/signin">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
