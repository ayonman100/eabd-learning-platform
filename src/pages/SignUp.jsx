import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getPathwayById } from "../data/learningPaths.js";
import PasswordField from "../components/ui/PasswordField.jsx";
import { ErrorMessage, StatusMessage } from "../components/ui/StatusBanner.jsx";

const ACCOUNT_TYPES = [
  {
    value: "learner",
    label: "Myself",
    hint: "You will fill in your own learner record.",
  },
  {
    value: "guardian",
    label: "Someone I support",
    hint: "A parent, guardian or carer creating a record for a young person.",
  },
];

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pathway = getPathwayById(searchParams.get("pathway"));

  const [accountType, setAccountType] = useState("learner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isGuardian = accountType === "guardian";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
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
        accountType,
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

        <StatusMessage>{message}</StatusMessage>
        <ErrorMessage>{error}</ErrorMessage>

        <form onSubmit={handleSubmit}>
          <fieldset className="auth-fieldset">
            <legend>Who is this account for?</legend>

            {ACCOUNT_TYPES.map((option) => (
              <label className="onboarding-option" key={option.value}>
                <input
                  type="radio"
                  name="accountType"
                  value={option.value}
                  checked={accountType === option.value}
                  onChange={(event) => setAccountType(event.target.value)}
                />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.hint}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="auth-field">
            <label htmlFor="signup-name">
              {isGuardian ? "Your name" : "Full name"}
            </label>
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

          <PasswordField
            id="signup-password"
            name="password"
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            helperId="signup-password-help"
            helperText="Use at least 8 characters."
          />

          <PasswordField
            id="signup-confirm-password"
            name="confirmPassword"
            label="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            toggleLabel="password confirmation"
          />

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
