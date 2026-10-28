
import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { learningPaths } from "../data/learningPaths.js";
import {
  supabase,
  isSupabaseConfigured,
} from "../lib/supabase.js";

const DOCUMENT_BUCKET = "learner-private-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pathwayId = searchParams.get("pathway") || "";
  const selectedPathway = learningPaths.find(
    (pathway) => pathway.id === pathwayId
  );

  const [accountType, setAccountType] = useState("self");
  const [learnerName, setLearnerName] = useState("");
  const [learnerAge, setLearnerAge] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");

  const [goal, setGoal] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [barriers, setBarriers] = useState("");
  const [support, setSupport] = useState("");
  const [resources, setResources] = useState("");
  const [pace, setPace] = useState("flexible");
  const [otherDetails, setOtherDetails] = useState("");
  const [medicalReport, setMedicalReport] = useState(null);

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleReportChange(event) {
    const file = event.target.files?.[0] || null;
    setError("");

    if (!file) {
      setMedicalReport(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
    ];

    const allowedExtensions = /\.(pdf|png|jpe?g)$/i;

    if (
      !allowedTypes.includes(file.type) ||
      !allowedExtensions.test(file.name)
    ) {
      setError("Please select a PDF, PNG or JPG medical report.");
      event.target.value = "";
      setMedicalReport(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("The report must be 10 MB or smaller.");
      event.target.value = "";
      setMedicalReport(null);
      return;
    }

    setMedicalReport(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!isSupabaseConfigured || !supabase) {
      setError(
        "Account storage is not configured. Please try again later."
      );
      return;
    }

    if (!goal.trim()) {
      setError("Please tell us what you want to work towards.");
      return;
    }

    if (accountType === "guardian") {
      if (!learnerName.trim()) {
        setError("Please enter the learner's name.");
        return;
      }

      if (
        !learnerAge ||
        Number(learnerAge) < 1 ||
        Number(learnerAge) > 120
      ) {
        setError("Please enter a valid learner age.");
        return;
      }

      if (!guardianRelationship.trim()) {
        setError("Please tell us your relationship to the learner.");
        return;
      }
    }

    setIsSaving(true);
    let uploadedPath = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        navigate("/signin", {
          replace: true,
          state: { from: { pathname: "/onboarding" } },
        });
        return;
      }

      const profileName =
        accountType === "guardian"
          ? learnerName.trim()
          : learnerName.trim() ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "";

      const profile = {
        user_id: user.id,
        account_type: accountType,
        learner_name: profileName,
        learner_age: learnerAge ? Number(learnerAge) : null,
        guardian_relationship:
          accountType === "guardian"
            ? guardianRelationship.trim()
            : null,
        goal: goal.trim(),
        current_position: currentPosition.trim(),
        barriers: barriers.trim(),
        support_needs: support.trim(),
        resources: resources.trim(),
        learning_pace: pace,
        other_details: otherDetails.trim(),
      };

      if (medicalReport) {
        const safeName = medicalReport.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

        uploadedPath = `${user.id}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from(DOCUMENT_BUCKET)
          .upload(uploadedPath, medicalReport, {
            contentType: medicalReport.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        profile.medical_document_path = uploadedPath;
        profile.medical_document_name = medicalReport.name;
        profile.medical_document_mime = medicalReport.type;
        profile.medical_document_uploaded_at =
          new Date().toISOString();
      }

      const { error: saveError } = await supabase
        .from("learner_profiles")
        .upsert(profile, { onConflict: "user_id" });

      if (saveError) throw saveError;

      navigate(
        `/dashboard?pathway=${encodeURIComponent(pathwayId)}`,
        { replace: true }
      );
    } catch (err) {
      if (uploadedPath && supabase) {
        const { error: cleanupError } = await supabase.storage
          .from(DOCUMENT_BUCKET)
          .remove([uploadedPath]);

        if (cleanupError) {
          console.error(
            "Could not clean up an unlinked document:",
            cleanupError
          );
        }
      }

      console.error("Could not save learner profile:", err);

      setError(
        err?.message ||
          "We could not save your information. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main
      id="main-content"
      className="auth-page onboarding-page"
      tabIndex="-1"
    >
      <section
        className="auth-card onboarding-card"
        aria-labelledby="onboarding-heading"
      >
        <p className="auth-eyebrow">
          STEP 1 · UNDERSTAND YOUR GOAL
        </p>

        <h1 id="onboarding-heading">
          Let's build your pathway together.
        </h1>

        <p>
          There is no single way to learn. Tell us about the learner's
          interests, goals and the support that would make learning
          more accessible.
        </p>

        {selectedPathway && (
          <div className="signup-pathway">
            <p className="auth-eyebrow">SELECTED PATHWAY</p>
            <h2>{selectedPathway.title}</h2>
            <p>{selectedPathway.summary}</p>
            <Link to="/explore">Change pathway</Link>
          </div>
        )}

        <p className="auth-help">
          Share only what you are comfortable sharing. A medical
          report is optional and is not required to continue.
        </p>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="account-type">
              Who is completing this form?
            </label>
            <select
              id="account-type"
              value={accountType}
              onChange={(event) => setAccountType(event.target.value)}
            >
              <option value="self">I am the learner</option>
              <option value="guardian">
                I am a parent or guardian
              </option>
            </select>
          </div>

          <div className="auth-field">
            <label htmlFor="learner-name">
              {accountType === "guardian"
                ? "Learner's full name"
                : "Your name (optional)"}
            </label>
            <input
              id="learner-name"
              type="text"
              value={learnerName}
              onChange={(event) => setLearnerName(event.target.value)}
              autoComplete="name"
              required={accountType === "guardian"}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="learner-age">
              Learner's age{accountType === "guardian" ? "" : " (optional)"}
            </label>
            <input
              id="learner-age"
              type="number"
              min="1"
              max="120"
              value={learnerAge}
              onChange={(event) => setLearnerAge(event.target.value)}
              required={accountType === "guardian"}
            />
          </div>

          {accountType === "guardian" && (
            <div className="auth-field">
              <label htmlFor="guardian-relationship">
                Your relationship to the learner
              </label>
              <input
                id="guardian-relationship"
                type="text"
                value={guardianRelationship}
                onChange={(event) =>
                  setGuardianRelationship(event.target.value)
                }
                placeholder="For example, parent or legal guardian"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="onboarding-goal">
              What would you like to achieve?{" "}
              <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="onboarding-goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={3}
              placeholder="Describe the skill, project or opportunity you're interested in."
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="onboarding-current">
              Where are you starting from?
            </label>
            <textarea
              id="onboarding-current"
              value={currentPosition}
              onChange={(event) => setCurrentPosition(event.target.value)}
              rows={3}
              placeholder="What do you already know or feel comfortable doing?"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="onboarding-barriers">
              What might make this difficult?
            </label>
            <textarea
              id="onboarding-barriers"
              value={barriers}
              onChange={(event) => setBarriers(event.target.value)}
              rows={3}
              placeholder="For example, device access, internet, time or materials."
            />
          </div>

          <div className="auth-field">
            <label htmlFor="onboarding-support">
              What support or adjustments would help?
            </label>
            <textarea
              id="onboarding-support"
              value={support}
              onChange={(event) => setSupport(event.target.value)}
              rows={3}
              placeholder="Tell us what would make learning more accessible."
            />
          </div>

          <div className="auth-field">
            <label htmlFor="onboarding-resources">
              What tools or resources can you access?
            </label>
            <textarea
              id="onboarding-resources"
              value={resources}
              onChange={(event) => setResources(event.target.value)}
              rows={2}
              placeholder="Devices, software, internet, materials or people."
            />
          </div>

          <fieldset className="onboarding-fieldset">
            <legend>What learning pace works best?</legend>

            {[
              ["guided", "More guided sessions"],
              ["flexible", "Flexible practice with check-ins"],
              ["independent", "Mostly independent learning"],
            ].map(([value, label]) => (
              <label className="onboarding-option" key={value}>
                <input
                  type="radio"
                  name="pace"
                  value={value}
                  checked={pace === value}
                  onChange={(event) => setPace(event.target.value)}
                />
                {label}
              </label>
            ))}
          </fieldset>

          <div className="auth-field">
            <label htmlFor="onboarding-details">
              Anything else we should understand?
            </label>
            <textarea
              id="onboarding-details"
              value={otherDetails}
              onChange={(event) => setOtherDetails(event.target.value)}
              rows={3}
              placeholder="Any additional context you would like to share."
            />
          </div>

          <div className="auth-field">
            <label htmlFor="medical-report">
              Medical report (optional)
            </label>
            <input
              id="medical-report"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={handleReportChange}
            />
            <p className="auth-help">
              PDF, PNG or JPG, up to 10 MB. Upload only if you wish.
              Your report is stored in private storage. You can
              complete onboarding without one.
            </p>
            {medicalReport && (
              <p className="auth-help">
                Selected file: {medicalReport.name}
              </p>
            )}
          </div>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving your information..." : "Save and continue"}
          </button>
        </form>
      </section>
    </main>
  );
}
