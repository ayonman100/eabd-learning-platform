import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Account services are unavailable. Please try again later.");
      setChecking(false);
      return;
    }

    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") &&
        session
      ) {
        setReady(true);
        setError("");
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;

        if (sessionError) {
          setError("We couldn't verify your reset link. Request a new one.");
          return;
        }

        if (data.session) {
          setReady(true);
        } else {
          setError(
            "This reset link is invalid or has expired. Request a new one."
          );
        }
      })
      .catch(() => {
        if (active) {
          setError("We couldn't verify your reset link. Please try again.");
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    if (!ready || !supabase) {
      setError("Please open a valid password reset link from your email.");
      return;
    }

    setSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setMessage("Your password has been updated. You can now sign in.");
      setPassword("");
      setConfirmPassword("");
      setReady(false);

      await supabase.auth.signOut();
    } catch (err) {
      setError(
        err.message || "We couldn't update your password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <main id="main-content" className="auth-page" aria-live="polite">
        <p>Verifying your reset link...</p>
      </main>
    );
  }

  return (
    <main id="main-content" className="auth-page" tabIndex="-1">
      <section className="auth-card" aria-labelledby="reset-password-heading">
        <p className="auth-eyebrow">ACCOUNT RECOVERY</p>
        <h1 id="reset-password-heading">Create a new password</h1>
        <p>Choose a new password for your EABD account.</p>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p role="status">
            {message} <Link to="/signin">Sign in</Link>
          </p>
        )}

        {ready && !message && (
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="confirm-new-password">
                Confirm new password
              </label>
              <input
                id="confirm-new-password"
                name="confirm-new-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? "Updating password..." : "Update password"}
            </button>
          </form>
        )}

        {!ready && !message && (
          <p>
            <Link to="/forgot-password">Request another reset link</Link>
          </p>
        )}
      </section>
    </main>
  );
}
