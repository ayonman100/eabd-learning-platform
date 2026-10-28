
import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { learningPaths } from "../data/learningPaths.js";

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pathwayId = searchParams.get("pathway") || "";
  const selectedPathway = learningPaths.find(
    (pathway) => pathway.id === pathwayId
  );

  const [goal, setGoal] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [barriers, setBarriers] = useState("");
  const [support, setSupport] = useState("");
  const [resources, setResources] = useState("");
  const [pace, setPace] = useState("flexible");
  const [otherDetails, setOtherDetails] = useState("");
  const [sample, setSample] = useState(null);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!goal.trim()) {
      setError("Please tell us what you want to work towards.");
      return;
    }

    // Temporary demonstration only.
    // This does not save onboarding data to Supabase.
    navigate(
      `/dashboard?pathway=${encodeURIComponent(pathwayId)}&setup=demo`,
      { replace: true }
    );
  }

  return (
    <main id="main-content" className="auth-page onboarding-page" tabIndex="-1">
      <section className="auth-card onboarding-card" aria-labelledby="onboarding-heading">
        <p className="auth-eyebrow">STEP 1 · UNDERSTAND YOUR GOAL</p>
        <h1 id="onboarding-heading">Let's build your pathway together.</h1>
        <p>
          There is no single way to learn. Tell us a little about your
          goal so we can begin identifying useful next steps.
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
          You can leave optional questions blank. Share only what you are
          comfortable sharing.
        </p>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="onboarding-goal">
              What would you like to achieve? <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="onboarding-goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={3}
              placeholder="Describe the skill, project, or opportunity you're interested in."
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
              placeholder="For example, access to a device, internet, time, materials, or learning resources."
            />
          </div>

          <div className="auth-field">
            <label htmlFor="onboarding-support">
              What support or adjustments would help you participate?
            </label>
            <textarea
              id="onboarding-support"
              value={support}
              onChange={(event) => setSupport(event.target.value)}
              rows={3}
              placeholder="Tell us what would make learning more accessible for you."
            />
          </div>

          <div className="auth-field">
            <label htmlFor="onboarding-resources">
              Do you have access to useful tools or resources?
            </label>
            <textarea
              id="onboarding-resources"
              value={resources}
              onChange={(event) => setResources(event.target.value)}
              rows={2}
              placeholder="Devices, software, internet, materials, people, or places."
            />
          </div>

          <fieldset className="onboarding-fieldset">
            <legend>What learning pace works best for you?</legend>

            <label className="onboarding-option">
              <input
                type="radio"
                name="pace"
                value="guided"
                checked={pace === "guided"}
                onChange={(event) => setPace(event.target.value)}
              />
              More guided sessions
            </label>

            <label className="onboarding-option">
              <input
                type="radio"
                name="pace"
                value="flexible"
                checked={pace === "flexible"}
                onChange={(event) => setPace(event.target.value)}
              />
              Flexible practice with check-ins
            </label>

            <label className="onboarding-option">
              <input
                type="radio"
                name="pace"
                value="independent"
                checked={pace === "independent"}
                onChange={(event) => setPace(event.target.value)}
              />
              Mostly independent learning
            </label>
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
            <label htmlFor="onboarding-sample">
              Optional: attach a relevant work sample
            </label>
            <input
              id="onboarding-sample"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(event) =>
                setSample(event.target.files?.[0] || null)
              }
            />
            <p className="auth-help">
              PDF, PNG or JPG. This demo only selects a file locally.
              It does not upload or save the file.
            </p>
            {sample && (
              <p role="status" className="auth-help">
                Selected locally: {sample.name}. Nothing has been uploaded.
              </p>
            )}
          </div>

          <button type="submit">Continue to dashboard</button>
        </form>
      </section>
    </main>
  );
}
