import {
  raiseUserSafeError,
  requireSupabaseClient,
  requireUserId,
  unwrap,
} from "./helpers.js";

const LEARNER_COLUMNS = "*";

/**
 * The learner record for the signed-in account. For a learner this is their own
 * record; for a guardian it is their first supported learner.
 */
export async function getMyLearner() {
  const client = requireSupabaseClient();
  const ownerId = await requireUserId();

  const response = await client
    .from("learners")
    .select(LEARNER_COLUMNS)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return unwrap(
    response,
    "Could not load the learner record",
    "We could not load your learner record. Please try again."
  );
}

export async function getLearner(learnerId) {
  const client = requireSupabaseClient();

  const response = await client
    .from("learners")
    .select(LEARNER_COLUMNS)
    .eq("id", learnerId)
    .maybeSingle();

  return unwrap(
    response,
    "Could not load the learner record",
    "We could not load that learner record. Please try again."
  );
}

export async function createLearner({ relationship, firstName, guardianConsent }) {
  const client = requireSupabaseClient();
  const ownerId = await requireUserId();

  const response = await client
    .from("learners")
    .insert({
      owner_id: ownerId,
      relationship,
      first_name: firstName,
      guardian_consent_at: guardianConsent ? new Date().toISOString() : null,
      onboarding_step: "document",
    })
    .select(LEARNER_COLUMNS)
    .single();

  return unwrap(
    response,
    "Could not create the learner record",
    "We could not start your learner record. Please try again."
  );
}

export async function updateLearner(learnerId, patch) {
  const client = requireSupabaseClient();

  if (!learnerId) {
    raiseUserSafeError(
      "Cannot update a learner without an id",
      "Your learner record is not ready yet. Please try again."
    );
  }

  const response = await client
    .from("learners")
    .update(patch)
    .eq("id", learnerId)
    .select(LEARNER_COLUMNS)
    .single();

  return unwrap(
    response,
    "Could not save the learner record",
    "We could not save your changes. Please try again."
  );
}

/**
 * Saves the accessibility overrides without touching the rest of the record.
 */
export async function saveUiSettings(learnerId, uiSettings) {
  return updateLearner(learnerId, { ui_settings: uiSettings });
}

/**
 * Learners the signed-in supervisor is assigned to, with a count of steps
 * waiting for review.
 */
export async function listSupervisedLearners() {
  const client = requireSupabaseClient();

  const assignments = await client
    .from("learner_supervisors")
    .select("learner_id, learners (id, first_name, relationship)");

  const rows = unwrap(
    assignments,
    "Could not load supervised learners",
    "We could not load your learners. Please try again."
  );

  if (!rows || rows.length === 0) return [];

  const learnerIds = rows.map((row) => row.learner_id);

  const progress = await client
    .from("task_progress")
    .select("learner_id")
    .in("learner_id", learnerIds)
    .eq("status", "submitted");

  const submittedRows = unwrap(
    progress,
    "Could not load awaiting reviews",
    "We could not load the steps awaiting review. Please try again."
  );

  const awaitingByLearner = new Map();
  for (const row of submittedRows ?? []) {
    awaitingByLearner.set(
      row.learner_id,
      (awaitingByLearner.get(row.learner_id) ?? 0) + 1
    );
  }

  return rows
    .filter((row) => row.learners)
    .map((row) => ({
      id: row.learners.id,
      firstName: row.learners.first_name,
      relationship: row.learners.relationship,
      awaitingReview: awaitingByLearner.get(row.learner_id) ?? 0,
    }));
}
