import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

export default function Account() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user?.id || !isSupabaseConfigured || !supabase) {
        if (active) {
          setError("Learner profile storage is not currently available.");
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from("learner_profiles")
          .select(
            "account_type, learner_name, learner_age, guardian_relationship, goal, current_position, barriers, support_needs, resources, learning_pace, other_details, medical_document_name"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (queryError) throw queryError;

        if (active) setProfile(data);
      } catch (err) {
        if (active) {
          setError(
            err?.message || "We could not load your learner profile."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [user?.id]);

  async function handleSignOut() {
    setSigningOut(true);
    setError("");

    try {
      const { error: signOutError } = await signOut();
      if (signOutError) throw signOutError;
      navigate("/signin", { replace: true });
    } catch (err) {
      setError(err?.message || "We could not sign you out. Please try again.");
      setSigningOut(false);
    }
  }

  const displayName =
    profile?.learner_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Learner";

  return (
    <main id="main-content" className="account-page" tabIndex="-1">
      <div className="account-page-inner">
        <Link className="account-back-link" to="/dashboard">
          <ArrowLeft size={18} aria-hidden="true" />
          Back to dashboard
        </Link>

        <section className="account-card" aria-labelledby="account-heading">
          <div className="account-icon" aria-hidden="true">
            <UserRound size={28} />
          </div>

          <p className="auth-eyebrow">YOUR EABD ACCOUNT</p>
          <h1 id="account-heading">{displayName}</h1>
          <p className="account-email">{user?.email}</p>

          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}

          {loading ? (
            <p role="status">Loading your learner profile...</p>
          ) : profile ? (
            <div className="account-details">
              <h2>Your learner profile</h2>

              <dl>
                <div>
                  <dt>Account type</dt>
                  <dd>
                    {profile.account_type === "guardian"
                      ? "Parent or guardian"
                      : "Learner"}
                  </dd>
                </div>

                {profile.learner_age != null && (
                  <div>
                    <dt>Learner age</dt>
                    <dd>{profile.learner_age}</dd>
                  </div>
                )}

                {profile.guardian_relationship && (
                  <div>
                    <dt>Relationship to learner</dt>
                    <dd>{profile.guardian_relationship}</dd>
                  </div>
                )}

                <div>
                  <dt>Learning goal</dt>
                  <dd>{profile.goal || "Not provided yet"}</dd>
                </div>

                <div>
                  <dt>Starting point</dt>
                  <dd>{profile.current_position || "Not provided yet"}</dd>
                </div>

                <div>
                  <dt>Support and adjustments</dt>
                  <dd>{profile.support_needs || "Not provided yet"}</dd>
                </div>

                <div>
                  <dt>Preferred learning pace</dt>
                  <dd>
                    {{
                      guided: "More guided sessions",
                      flexible: "Flexible practice with check-ins",
                      independent: "Mostly independent learning",
                    }[profile.learning_pace] || "Not provided yet"}
                  </dd>
                </div>

                <div>
                  <dt>Medical report</dt>
                  <dd>
                    {profile.medical_document_name
                      ? "A report has been uploaded"
                      : "No report uploaded"}
                  </dd>
                </div>
              </dl>

              <p className="account-privacy-note">
                Your profile is shown for your account. Medical report
                contents are not displayed on this page.
              </p>
            </div>
          ) : (
            <div className="account-empty">
              <h2>Your learner profile is not set up yet.</h2>
              <p>
                Share your learning goal and any support needs to help shape
                your pathway. A medical report is optional.
              </p>
              <Link className="account-primary-link" to="/onboarding">
                Complete your profile
              </Link>
            </div>
          )}

          <div className="account-actions">
            <Link className="account-secondary-link" to="/learning-journey">
              <BookOpen size={18} aria-hidden="true" />
              View learning journey
            </Link>

            <button
              className="account-signout-button"
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <LogOut size={18} aria-hidden="true" />
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
