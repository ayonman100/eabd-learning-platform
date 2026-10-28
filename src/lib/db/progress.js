import { requireSupabaseClient, unwrap } from "./helpers.js";

/**
 * Progress rows for one learner on one pathway, keyed for easy lookup.
 */
export async function listTaskProgress(learnerId, pathwayId) {
  const client = requireSupabaseClient();

  const response = await client
    .from("task_progress")
    .select("*")
    .eq("learner_id", learnerId)
    .eq("pathway_id", pathwayId)
    .order("task_id", { ascending: true });

  const rows = unwrap(
    response,
    "Could not load task progress",
    "We could not load your progress. Please try again."
  );

  return rows ?? [];
}

/**
 * Marks a step as started, keeping a step that is already submitted or reviewed.
 */
export async function startTask(learnerId, pathwayId, taskId) {
  const client = requireSupabaseClient();

  const existing = await client
    .from("task_progress")
    .select("*")
    .eq("learner_id", learnerId)
    .eq("pathway_id", pathwayId)
    .eq("task_id", taskId)
    .maybeSingle();

  if (existing.data) {
    return existing.data;
  }

  const response = await client
    .from("task_progress")
    .insert({
      learner_id: learnerId,
      pathway_id: pathwayId,
      task_id: taskId,
      status: "started",
    })
    .select("*")
    .single();

  return unwrap(
    response,
    "Could not start the task",
    "We could not start that step. Please try again."
  );
}

export async function submitTask(
  learnerId,
  pathwayId,
  taskId,
  { designLink = "", note = "" } = {}
) {
  const client = requireSupabaseClient();

  const response = await client
    .from("task_progress")
    .upsert(
      {
        learner_id: learnerId,
        pathway_id: pathwayId,
        task_id: taskId,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        design_link: designLink.trim() || null,
        learner_note: note.trim() || null,
      },
      { onConflict: "learner_id,pathway_id,task_id" }
    )
    .select("*")
    .single();

  return unwrap(
    response,
    "Could not send the step for review",
    "We could not send that step for review. Please try again."
  );
}
