import {
  requireSupabaseClient,
  requireUserId,
  unwrap,
} from "./helpers.js";

/**
 * Whether the signed-in account holds the platform admin role.
 */
export async function isPlatformAdmin() {
  const client = requireSupabaseClient();
  const userId = await requireUserId();

  const { data, error } = await client
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Could not check the admin role:", error.message);
    return false;
  }

  return Boolean(data);
}

/**
 * Every learner, with counts of what is waiting and what is done. Used by the
 * overview table.
 */
export async function listAllLearners() {
  const client = requireSupabaseClient();

  const learners = await client
    .from("learners")
    .select(
      "id, first_name, relationship, owner_id, onboarding_step, onboarding_completed_at, created_at"
    )
    .order("created_at", { ascending: false });

  const rows = unwrap(
    learners,
    "Could not load learners",
    "We could not load the learner list. Please try again."
  );

  if (!rows || rows.length === 0) return [];

  const progress = await client
    .from("task_progress")
    .select("learner_id, status");

  const progressRows = unwrap(
    progress,
    "Could not load progress counts",
    "We could not load progress counts. Please try again."
  );

  const counts = new Map();
  for (const row of progressRows ?? []) {
    const entry = counts.get(row.learner_id) ?? {
      started: 0,
      submitted: 0,
      reviewed: 0,
    };
    if (row.status in entry) entry[row.status] += 1;
    counts.set(row.learner_id, entry);
  }

  return rows.map((learner) => ({
    ...learner,
    counts: counts.get(learner.id) ?? { started: 0, submitted: 0, reviewed: 0 },
  }));
}

/**
 * Every step currently waiting for a review, oldest first. This is the approval
 * queue: it is the same task_reviews-shaped data a supervisor sees, but across
 * all learners.
 */
export async function listAwaitingReview() {
  const client = requireSupabaseClient();

  const response = await client
    .from("task_progress")
    .select(
      "learner_id, pathway_id, task_id, status, submitted_at, design_link, learner_note, learners (first_name)"
    )
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true });

  const rows = unwrap(
    response,
    "Could not load the approval queue",
    "We could not load the approval queue. Please try again."
  );

  return (rows ?? []).map((row) => ({
    learnerId: row.learner_id,
    learnerName: row.learners?.first_name ?? "Learner",
    pathwayId: row.pathway_id,
    taskId: row.task_id,
    submittedAt: row.submitted_at,
    designLink: row.design_link,
    learnerNote: row.learner_note,
  }));
}

/** The most recent administrative actions. */
export async function listAudit(limit = 25) {
  const client = requireSupabaseClient();

  const response = await client
    .from("admin_audit")
    .select("id, actor_id, action, learner_id, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return unwrap(
    response,
    "Could not load the audit trail",
    "We could not load the recent activity. Please try again."
  ) ?? [];
}

/**
 * Writes one audit row. Called after an administrative action succeeds, so a
 * failed action leaves no misleading trail.
 */
export async function recordAudit({ action, learnerId = null, targetUserId = null, detail = {} }) {
  const client = requireSupabaseClient();
  const actorId = await requireUserId();

  const { error } = await client.from("admin_audit").insert({
    actor_id: actorId,
    action,
    learner_id: learnerId,
    target_user_id: targetUserId,
    detail,
  });

  if (error) {
    // The action itself already succeeded; a missing audit row is logged rather
    // than turning a successful approval into an error for the reviewer.
    console.error("Could not record the audit entry:", error.message);
  }
}

/** Supervisors, so an admin can assign one to a learner. */
export async function listSupervisors() {
  const client = requireSupabaseClient();

  const response = await client.from("supervisors").select("user_id");
  const rows = unwrap(
    response,
    "Could not load supervisors",
    "We could not load the supervisor list. Please try again."
  ) ?? [];

  if (rows.length === 0) return [];

  const profiles = await client
    .from("profiles")
    .select("id, full_name")
    .in(
      "id",
      rows.map((row) => row.user_id)
    );

  const profileRows = unwrap(
    profiles,
    "Could not load supervisor names",
    "We could not load the supervisor list. Please try again."
  ) ?? [];

  const names = new Map(profileRows.map((profile) => [profile.id, profile.full_name]));

  return rows.map((row) => ({
    user_id: row.user_id,
    profiles: { full_name: names.get(row.user_id) ?? null },
  }));
}

/** Which supervisors are assigned to which learner. */
export async function listAssignments() {
  const client = requireSupabaseClient();

  const response = await client
    .from("learner_supervisors")
    .select("learner_id, supervisor_id");

  return unwrap(
    response,
    "Could not load assignments",
    "We could not load supervisor assignments. Please try again."
  ) ?? [];
}

export async function assignSupervisor(learnerId, supervisorId) {
  const client = requireSupabaseClient();

  const response = await client
    .from("learner_supervisors")
    .insert({ learner_id: learnerId, supervisor_id: supervisorId })
    .select("*")
    .single();

  return unwrap(
    response,
    "Could not assign the supervisor",
    "We could not assign that supervisor. Please try again."
  );
}

export async function unassignSupervisor(learnerId, supervisorId) {
  const client = requireSupabaseClient();

  const { error } = await client
    .from("learner_supervisors")
    .delete()
    .eq("learner_id", learnerId)
    .eq("supervisor_id", supervisorId);

  if (error) {
    throw new Error("We could not remove that assignment. Please try again.");
  }
}

/** Grants the supervisor role to an existing account. */
export async function grantSupervisor(userId) {
  const client = requireSupabaseClient();

  const response = await client
    .from("supervisors")
    .insert({ user_id: userId })
    .select("*")
    .single();

  return unwrap(
    response,
    "Could not grant the supervisor role",
    "We could not grant that role. Please try again."
  );
}
