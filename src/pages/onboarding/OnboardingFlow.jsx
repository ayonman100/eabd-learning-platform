import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLearner } from "../../context/LearnerContext.jsx";
import { createLearner, updateLearner } from "../../lib/db/learners.js";
import {
  confirmExtraction,
  discardExtraction,
  requestExtraction,
  uploadLearnerDocument,
} from "../../lib/db/documents.js";
import { deriveAdaptations, resolveSettings } from "../../lib/adaptations.js";
import { acceptedFieldValues, validateExtraction } from "../../lib/extraction.js";
import { getPathwayById } from "../../data/learningPaths.js";
import OnboardingStep from "./OnboardingStep.jsx";
import { ONBOARDING_STEPS, stepIndex } from "./onboardingSteps.js";
import StepWho from "./StepWho.jsx";
import StepDocument from "./StepDocument.jsx";
import StepConfirm from "./StepConfirm.jsx";
import StepPerson from "./StepPerson.jsx";
import StepRoom from "./StepRoom.jsx";
import StepGoals from "./StepGoals.jsx";
import StepDisplay from "./StepDisplay.jsx";
import { StatusMessage } from "../../components/ui/StatusBanner.jsx";

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

const STEP_TITLES = {
  who: "Whose record is this?",
  document: "Add a document, if you have one",
  confirm: "Check the suggested answers",
  person: "What can this person do?",
  room: "Where does the learning happen?",
  goals: "What would you like to work towards?",
  display: "How should the screen look?",
};

const STEP_INTROS = {
  who: "We only ask for what the record needs. You can change any of it later.",
  document:
    "This step is optional. A report can save typing, and you choose what to keep.",
  confirm:
    "You are in charge of what is saved. Each suggestion shows the words it came from.",
  person:
    "Function levels describe what someone can do. They are not a judgement of what they can learn.",
  room: "Equipment and setting change what makes a task possible.",
  goals: "The goal leads. Support and adjustments follow it, not the other way round.",
  display:
    "These choices apply straight away, and you can change them from your account at any time.",
};

function pick(source, keys) {
  const result = {};
  for (const key of keys) {
    result[key] = source[key] ?? null;
  }
  return result;
}

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, accountType } = useAuth();
  const { learner, loading, error: learnerError, refresh } = useLearner();

  const isGuardian = accountType === "guardian";
  const pathway = getPathwayById(searchParams.get("pathway"));

  const [stepKey, setStepKey] = useState("who");
  const [draft, setDraft] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [documentId, setDocumentId] = useState(null);
  const [suggested, setSuggested] = useState({});
  const [decisions, setDecisions] = useState({});
  const [deleteFile, setDeleteFile] = useState(true);

  // The step is seeded once per learner so a refresh resumes where they stopped.
  const seededFor = useRef(null);

  useEffect(() => {
    if (loading || !user) return;
    if (seededFor.current === user.id) return;

    seededFor.current = user.id;

    if (!learner) {
      setStepKey("who");
      setDraft({ first_name: isGuardian ? "" : firstNameFrom(user) });
      return;
    }

    setStepKey(learner.onboarding_step || "who");
    setDraft({
      first_name: learner.first_name ?? "",
      relationship: learner.relationship ?? "self",
      ...pick(learner, [...PERSON_KEYS, ...ROOM_KEYS, ...GOAL_KEYS]),
    });
  }, [loading, user, learner, isGuardian]);

  const derived = useMemo(
    () => deriveAdaptations({ ...learner, ...draft }),
    [learner, draft]
  );

  const [display, setDisplay] = useState(null);
  const resolvedDisplay = resolveSettings(
    derived,
    display ?? learner?.ui_settings ?? {}
  );

  const saveStep = useCallback(
    async (patch, nextStep) => {
      if (!learner?.id) {
        throw new Error("Your learner record is not ready yet.");
      }
      return updateLearner(learner.id, {
        ...patch,
        onboarding_step: nextStep,
      });
    },
    [learner?.id]
  );

  const goToStep = useCallback((key) => {
    setError("");
    setNotice("");
    setStepKey(key);
  }, []);

  const goBack = useCallback(() => {
    const index = stepIndex(stepKey);
    if (index === 0) {
      navigate("/dashboard");
      return;
    }
    // The confirm step only exists when a document was actually read.
    if (stepKey === "person" && !documentId) {
      goToStep("document");
      return;
    }
    goToStep(ONBOARDING_STEPS[index - 1].key);
  }, [stepKey, documentId, goToStep, navigate]);

  async function handleWho(event) {
    event.preventDefault();
    setError("");

    const firstName = (draft.first_name ?? "").trim();
    if (!firstName) {
      setError(
        isGuardian
          ? "Enter the learner's first name to continue."
          : "Enter your first name to continue."
      );
      return;
    }

    if (isGuardian && !draft.guardian_consent) {
      setError("Tick the box to confirm you have their agreement.");
      return;
    }

    setSubmitting(true);
    try {
      if (learner?.id) {
        await saveStep({ first_name: firstName }, "document");
      } else {
        await createLearner({
          relationship: isGuardian ? draft.relationship ?? "parent" : "self",
          firstName,
          guardianConsent: isGuardian,
        });
        await refresh();
      }
      goToStep("document");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkipDocument() {
    goToStep("person");
  }

  async function handleUpload(file) {
    setError("");
    setUploading(true);

    try {
      const document = await uploadLearnerDocument(learner.id, file);
      setDocumentId(document.id);

      const result = await requestExtraction(document.id);

      const validated = validateExtraction(result?.extraction ?? result);

      if (!validated.ok) {
        setError(
          "We read the document but the result did not look reliable. You can type the answers instead."
        );
        setSuggested({});
        goToStep("person");
        return;
      }

      setSuggested(validated.fields);
      setDecisions(
        Object.fromEntries(
          Object.entries(validated.fields)
            .filter(([, entry]) => entry)
            .map(([key, entry]) => [
              key,
              { choice: "accept", value: entry.value },
            ])
        )
      );
      goToStep("confirm");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirm() {
    setError("");
    setSubmitting(true);

    const acceptedKeys = Object.entries(decisions)
      .filter(([, decision]) => decision.choice !== "leave-out")
      .map(([key]) => key);

    const acceptedValues = {};
    for (const key of acceptedKeys) {
      const { value } = decisions[key];
      if (key === "gmfcs" || key === "macs" || key === "cfcs") {
        const level = Number(value);
        acceptedValues[key] = Number.isInteger(level) ? level : null;
      } else if (typeof value === "string") {
        acceptedValues[key] = value.trim();
      }
    }

    // Merge with anything already in the draft so the Person step shows it.
    setDraft((current) => ({ ...current, ...acceptedValues }));

    try {
      if (documentId) {
        await confirmExtraction(documentId, acceptedFieldValues(suggested, acceptedKeys), {
          deleteFile,
        });
      }
      await saveStep(acceptedValues, "person");
      await refresh();
      goToStep("person");
    } catch (confirmError) {
      setError(confirmError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDiscard() {
    setSubmitting(true);
    try {
      if (documentId) await discardExtraction(documentId);
      await saveStep({}, "person");
      setDocumentId(null);
      setSuggested({});
      setDecisions({});
      await refresh();
      goToStep("person");
    } catch (discardError) {
      setError(discardError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFieldStep(event, keys, nextStep) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await saveStep(pick(draft, keys), nextStep);
      await refresh();
      goToStep(nextStep);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFinish(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await updateLearner(learner.id, {
        ui_settings: resolvedDisplay,
        onboarding_step: "done",
        onboarding_completed_at: new Date().toISOString(),
      });
      await refresh();
      navigate(
        pathway
          ? `/dashboard?pathway=${encodeURIComponent(pathway.id)}`
          : "/dashboard",
        { replace: true }
      );
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main id="main-content" className="onboarding-page" aria-live="polite">
        <p className="onboarding-loading">Loading your record...</p>
      </main>
    );
  }

  if (learnerError) {
    return (
      <main id="main-content" className="onboarding-page">
        <p role="alert" className="error-message">
          {learnerError}
        </p>
      </main>
    );
  }

  if (learner?.onboarding_completed_at) {
    return (
      <main id="main-content" className="onboarding-page">
        <p role="status" className="status-message">
          This record is already set up. You can change any answer from your
          profile.
        </p>
      </main>
    );
  }

  if (stepKey === "who") {
    return (
      <OnboardingStep
        stepKey="who"
        title={STEP_TITLES.who}
        intro={STEP_INTROS.who}
        error={error}
        onSubmit={handleWho}
        submitting={submitting}
        showBack={false}
        submitLabel="Save and continue"
      >
        <StepWho
          draft={draft}
          onChange={setDraft}
          isGuardian={isGuardian}
        />
      </OnboardingStep>
    );
  }

  if (stepKey === "document") {
    return (
      <OnboardingStep
        stepKey="document"
        title={STEP_TITLES.document}
        intro={STEP_INTROS.document}
        error={error}
        onSubmit={(event) => event.preventDefault()}
        onBack={goBack}
        primaryAction={false}
      >
        <StatusMessage>{notice}</StatusMessage>
        <StepDocument
          onUpload={handleUpload}
          uploading={uploading}
          skipToNext={handleSkipDocument}
        />
      </OnboardingStep>
    );
  }

  if (stepKey === "confirm") {
    return (
      <OnboardingStep
        stepKey="confirm"
        title={STEP_TITLES.confirm}
        intro={STEP_INTROS.confirm}
        error={error}
        onSubmit={(event) => event.preventDefault()}
        onBack={goBack}
        showBack={false}
      >
        <StepConfirm
          fields={suggested}
          decisions={decisions}
          onChangeDecision={(key, decision) =>
            setDecisions((current) => ({ ...current, [key]: decision }))
          }
          deleteFile={deleteFile}
          onDeleteFileChange={setDeleteFile}
          onConfirm={handleConfirm}
          onDiscard={handleDiscard}
          submitting={submitting}
        />
      </OnboardingStep>
    );
  }

  if (stepKey === "person") {
    return (
      <OnboardingStep
        stepKey="person"
        title={STEP_TITLES.person}
        intro={STEP_INTROS.person}
        error={error}
        onSubmit={(event) => handleFieldStep(event, PERSON_KEYS, "room")}
        onBack={goBack}
        submitting={submitting}
      >
        <StepPerson value={draft} onChange={setDraft} />
      </OnboardingStep>
    );
  }

  if (stepKey === "room") {
    return (
      <OnboardingStep
        stepKey="room"
        title={STEP_TITLES.room}
        intro={STEP_INTROS.room}
        error={error}
        onSubmit={(event) => handleFieldStep(event, ROOM_KEYS, "goals")}
        onBack={goBack}
        submitting={submitting}
      >
        <StepRoom value={draft} onChange={setDraft} />
      </OnboardingStep>
    );
  }

  if (stepKey === "goals") {
    return (
      <OnboardingStep
        stepKey="goals"
        title={STEP_TITLES.goals}
        intro={STEP_INTROS.goals}
        error={error}
        onSubmit={async (event) => {
          if (!(draft.goal ?? "").trim()) {
            event.preventDefault();
            setError("Tell us what you would like to work towards.");
            return;
          }
          await handleFieldStep(event, GOAL_KEYS, "display");
        }}
        onBack={goBack}
        submitting={submitting}
      >
        <StepGoals value={draft} onChange={setDraft} />
      </OnboardingStep>
    );
  }

  return (
    <OnboardingStep
      stepKey="display"
      title={STEP_TITLES.display}
      intro={STEP_INTROS.display}
      error={error}
      onSubmit={handleFinish}
      onBack={goBack}
      submitting={submitting}
      submitLabel="Go to my dashboard"
    >
      <StepDisplay
        derived={derived}
        value={resolvedDisplay}
        onChange={setDisplay}
      />
    </OnboardingStep>
  );
}

function firstNameFrom(user) {
  const fullName = user?.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim().split(/\s+/)[0];
  }
  return "";
}
