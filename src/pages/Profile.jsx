import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLearner } from "../context/LearnerContext.jsx";
import { getPathwayOrFirst } from "../data/learningPaths.js";
import PersonFields from "../components/fields/PersonFields.jsx";
import RoomFields from "../components/fields/RoomFields.jsx";
import GoalFields from "../components/fields/GoalFields.jsx";
import DisplaySettingsFields from "../components/fields/DisplaySettingsFields.jsx";
import { ErrorMessage, StatusMessage } from "../components/ui/StatusBanner.jsx";
import { deriveAdaptations, resolveSettings } from "../lib/adaptations.js";

const PERSON_KEYS = [
  "reported_diagnosis",
  "gmfcs",
  "macs",
  "cfcs",
  "vision",
  "fatigue",
];
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

function extractSection(source, keys) {
  const result = {};
  for (const key of keys) {
    result[key] = source[key] ?? null;
  }
  return result;
}

/**
 * One titled section with its own Save button and its own status line.
 * Written once, used for all four sections.
 */
function ProfileSection({ id, title, description, children, onSave, saving, status }) {
  return (
    <section className="profile-section" aria-labelledby={`${id}-heading`}>
      <div className="profile-section-heading">
        <h2 id={`${id}-heading`}>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        {children}

        <div className="profile-section-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save this section"}
          </button>
          <StatusMessage>{status}</StatusMessage>
        </div>
      </form>
    </section>
  );
}

export default function Profile() {
  const { learner, loading, save } = useLearner();
  const [searchParams] = useSearchParams();
  const pathway = getPathwayOrFirst(searchParams.get("pathway"));

  const [person, setPerson] = useState(() => extractSection(learner ?? {}, PERSON_KEYS));
  const [room, setRoom] = useState(() => extractSection(learner ?? {}, ROOM_KEYS));
  const [goals, setGoals] = useState(() => extractSection(learner ?? {}, GOAL_KEYS));
  const [display, setDisplay] = useState(learner?.ui_settings ?? {});

  const [savingKey, setSavingKey] = useState("");
  const [status, setStatus] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!learner) return;
    setPerson(extractSection(learner, PERSON_KEYS));
    setRoom(extractSection(learner, ROOM_KEYS));
    setGoals(extractSection(learner, GOAL_KEYS));
    setDisplay(learner.ui_settings ?? {});
  }, [learner]);

  const resolvedDisplay = resolveSettings(deriveAdaptations(learner), display);

  const saveSection = useCallback(
    async (key, patch, label) => {
      setSavingKey(key);
      setError("");
      setStatus((current) => ({ ...current, [key]: "" }));

      try {
        await save(patch);
        setStatus((current) => ({ ...current, [key]: `${label} saved.` }));
      } catch (saveError) {
        setError(saveError.message);
      } finally {
        setSavingKey("");
      }
    },
    [save]
  );

  if (loading) {
    return (
      <main id="main-content" className="profile-page" aria-live="polite">
        <p>Loading your profile...</p>
      </main>
    );
  }

  if (!learner) {
    return (
      <main id="main-content" className="profile-page">
        <p role="status" className="status-message">
          Finish setting up your record before editing your profile.
        </p>
        <p>
          <a href="/onboarding">Continue setting up</a>
        </p>
      </main>
    );
  }

  const isGuardian = learner.relationship !== "self";

  return (
    <main id="main-content" className="profile-page" tabIndex="-1">
      <div className="profile-inner">
        <header className="profile-intro">
          <p className="auth-eyebrow">YOUR RECORD</p>
          <h1>{isGuardian ? `Profile for ${learner.first_name}` : "Your profile"}</h1>
          <p>
            Change anything here at any time. Each section saves on its own, so
            you can stop after any of them.
          </p>
          <p className="auth-help">Pathway: {pathway.title}</p>
        </header>

        <ErrorMessage>{error}</ErrorMessage>

        <ProfileSection
          id="profile-person"
          title="Person"
          description="What this person can do day to day. Function levels shape the screen; the diagnosis never does."
          saving={savingKey === "person"}
          status={status.person}
          onSave={() => saveSection("person", person, "Person details")}
        >
          <PersonFields
            value={person}
            onChange={setPerson}
            idPrefix="profile-person"
          />
        </ProfileSection>

        <ProfileSection
          id="profile-room"
          title="Room"
          description="The equipment and setting the learning happens in."
          saving={savingKey === "room"}
          status={status.room}
          onSave={() => saveSection("room", room, "Room details")}
        >
          <RoomFields value={room} onChange={setRoom} idPrefix="profile-room" />
        </ProfileSection>

        <ProfileSection
          id="profile-goals"
          title="Goal"
          description="What you want to work towards, and what helps you take part."
          saving={savingKey === "goals"}
          status={status.goals}
          onSave={() => saveSection("goals", goals, "Goal")}
        >
          <GoalFields
            value={goals}
            onChange={setGoals}
            idPrefix="profile-goal"
          />
        </ProfileSection>

        <ProfileSection
          id="profile-display"
          title="Display"
          description="These settings are suggested from your answers and apply straight away."
          saving={savingKey === "display"}
          status={status.display}
          onSave={() => saveSection("display", { ui_settings: resolvedDisplay }, "Display settings")}
        >
          <DisplaySettingsFields
            value={resolvedDisplay}
            onChange={setDisplay}
            idPrefix="profile-display"
          />
        </ProfileSection>

        <p className="profile-back">
          <a href="/dashboard">Back to your dashboard</a>
        </p>
      </div>
    </main>
  );
}
