import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLearner } from "../context/LearnerContext.jsx";
import { getPathwayOrFirst } from "../data/learningPaths.js";
import PersonFields from "../components/fields/PersonFields.jsx";
import RoomFields from "../components/fields/RoomFields.jsx";
import GoalFields from "../components/fields/GoalFields.jsx";
import DisplaySettingsFields from "../components/fields/DisplaySettingsFields.jsx";
import WizardShell from "../components/ui/WizardShell.jsx";
import Button from "../components/ui/Button.jsx";
import { StatusMessage } from "../components/ui/StatusBanner.jsx";
import { deriveAdaptations, resolveSettings } from "../lib/adaptations.js";

const PERSON_KEYS = ["reported_diagnosis", "gmfcs", "macs", "cfcs", "vision", "fatigue"];
const ROOM_KEYS = [
  "device",
  "device_os",
  "screen",
  "pointer",
  "canva_surface",
  "seat",
  "who_in_room",
];
const GOAL_KEYS = [
  "goal",
  "starting_point",
  "barriers",
  "support",
  "resources",
  "learning_pace",
  "other_details",
];

const SECTIONS = [
  {
    key: "person",
    label: "Person",
    hint: "What they can do",
    title: "What can this person do?",
    intro:
      "Function levels shape the screen. The diagnosis is recorded as reported and never changes the interface.",
    keys: PERSON_KEYS,
  },
  {
    key: "room",
    label: "Room",
    hint: "Device and setting",
    title: "Where does the learning happen?",
    intro: "The equipment and setting change what makes a task possible.",
    keys: ROOM_KEYS,
  },
  {
    key: "goals",
    label: "Goals",
    hint: "What they want",
    title: "What would you like to work towards?",
    intro: "The goal leads. Support and adjustments follow it, not the other way round.",
    keys: GOAL_KEYS,
  },
  {
    key: "display",
    label: "Display",
    hint: "How it looks",
    title: "How should the screen look?",
    intro: "These are suggested from the record. Change anything that does not suit you.",
    keys: [],
  },
];

function extractSection(source, keys) {
  const result = {};
  for (const key of keys) result[key] = source[key] ?? null;
  return result;
}

export default function Profile() {
  const { learner, loading, save } = useLearner();
  const [searchParams] = useSearchParams();
  const pathway = getPathwayOrFirst(searchParams.get("pathway"));

  const [step, setStep] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!learner) return;
    setDrafts({
      person: extractSection(learner, PERSON_KEYS),
      room: extractSection(learner, ROOM_KEYS),
      goals: extractSection(learner, GOAL_KEYS),
      display: learner.ui_settings ?? {},
    });
  }, [learner]);

  const section = SECTIONS[step];
  const draft = drafts[section?.key] ?? {};

  const derived = resolveSettings(
    deriveAdaptations({ ...learner, ...(drafts.person ?? {}), ...(drafts.room ?? {}) }),
    drafts.display ?? {}
  );

  const saveStep = useCallback(async () => {
    setSaving(true);
    setError("");
    setStatus("");

    try {
      const patch =
        section.key === "display" ? { ui_settings: derived } : drafts[section.key];
      await save(patch);
      setStatus(`${section.label} saved.`);
      setStep((current) => Math.min(current + 1, SECTIONS.length - 1));
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }, [section, drafts, derived, save]);

  if (loading) {
    return (
      <main id="main-content" className="page" aria-live="polite">
        <div className="page-inner">
          <p>Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (!learner) {
    return (
      <main id="main-content" className="page" tabIndex="-1">
        <div className="page-inner">
          <p role="status" className="status-message">
            Finish setting up the record before editing the profile.
          </p>
          <Button to="/onboarding">Continue setting up</Button>
        </div>
      </main>
    );
  }

  const isGuardian = learner.relationship !== "self";
  const isLast = step === SECTIONS.length - 1;

  return (
    <main id="main-content" tabIndex="-1">
      <WizardShell
        eyebrow={isGuardian ? `Profile for ${learner.first_name}` : "Your record"}
        steps={SECTIONS}
        currentIndex={step}
        title={section.title}
        intro={section.intro}
        error={error}
        submitting={saving}
        submitLabel={isLast ? "Save display settings" : "Save and continue"}
        onBack={() => setStep((current) => Math.max(current - 1, 0))}
        showBack={step > 0}
        onSubmit={(event) => {
          event.preventDefault();
          saveStep();
        }}
        footer={
          <div className="wizard-footer">
            <StatusMessage>{status}</StatusMessage>
            <p className="wizard-footer-note">
              Pathway: {pathway.title}. Each step saves on its own.
            </p>
            <Button to="/dashboard" variant="quiet">
              Back to dashboard
            </Button>
          </div>
        }
      >
        {section.key === "person" && (
          <PersonFields
            value={draft}
            onChange={(next) => setDrafts((current) => ({ ...current, person: next }))}
            idPrefix="profile-person"
          />
        )}

        {section.key === "room" && (
          <RoomFields
            value={draft}
            onChange={(next) => setDrafts((current) => ({ ...current, room: next }))}
            idPrefix="profile-room"
          />
        )}

        {section.key === "goals" && (
          <GoalFields
            value={draft}
            onChange={(next) => setDrafts((current) => ({ ...current, goals: next }))}
            idPrefix="profile-goal"
          />
        )}

        {section.key === "display" && (
          <DisplaySettingsFields
            value={derived}
            onChange={(next) => setDrafts((current) => ({ ...current, display: next }))}
            idPrefix="profile-display"
          />
        )}
      </WizardShell>
    </main>
  );
}
