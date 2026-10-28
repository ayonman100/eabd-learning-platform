/**
 * Progress rules over database rows.
 *
 * Every function here is pure: it takes the pathway definition from
 * src/data/learningPaths.js and the task_progress rows from Supabase, and
 * returns a value. Nothing reads or writes browser storage.
 *
 * Status meanings, from the database check constraint:
 *   started    the learner has opened the step
 *   submitted  the learner has sent the step for review
 *   reviewed   a supervisor marked it done
 *
 * A step sent back by a review returns to started, which locks the next week
 * again until the learner resubmits.
 */

const DONE_STATUSES = new Set(["submitted", "reviewed"]);

function tasksOf(pathway) {
  if (!pathway?.weeks) return [];
  return pathway.weeks.flatMap((week) => week.tasks ?? []);
}

function statusByTask(rows) {
  const map = new Map();
  for (const row of rows ?? []) {
    map.set(row.task_id, row.status);
  }
  return map;
}

export function getProgressSummary(pathway, rows) {
  const tasks = tasksOf(pathway);
  const statuses = statusByTask(rows);

  let submittedCount = 0;
  let reviewedCount = 0;

  for (const task of tasks) {
    const status = statuses.get(task.id);
    if (status === "submitted") submittedCount += 1;
    if (status === "reviewed") reviewedCount += 1;
  }

  const doneCount = submittedCount + reviewedCount;
  const totalTasks = tasks.length;

  return {
    totalTasks,
    doneCount,
    submittedCount,
    reviewedCount,
    remainingCount: totalTasks - doneCount,
    percentage:
      totalTasks === 0 ? 0 : Math.round((doneCount / totalTasks) * 100),
  };
}

/**
 * "locked", "available", "review", or "complete".
 *
 * The first week is always available. A later week is available only when every
 * task in the week before it has been submitted or reviewed.
 */
export function getWeekStatus(pathway, rows, weekIndex) {
  const week = pathway?.weeks?.[weekIndex];
  if (!week) return "locked";

  const statuses = statusByTask(rows);
  const tasks = week.tasks ?? [];

  const isComplete = tasks.every((task) => statuses.get(task.id) === "reviewed");
  if (isComplete) return "complete";

  const hasSubmitted = tasks.some(
    (task) => statuses.get(task.id) === "submitted"
  );
  if (hasSubmitted) return "review";

  if (weekIndex === 0) return "available";

  const previousWeek = pathway.weeks[weekIndex - 1];
  const previousDone = (previousWeek.tasks ?? []).every((task) =>
    DONE_STATUSES.has(statuses.get(task.id))
  );

  return previousDone ? "available" : "locked";
}

/**
 * The first task the learner can act on, with its week, or null when every task
 * has been submitted or reviewed.
 */
export function getNextTask(pathway, rows) {
  const statuses = statusByTask(rows);

  for (let weekIndex = 0; weekIndex < (pathway?.weeks?.length ?? 0); weekIndex += 1) {
    if (getWeekStatus(pathway, rows, weekIndex) === "locked") continue;

    const week = pathway.weeks[weekIndex];
    const task = (week.tasks ?? []).find(
      (candidate) => !DONE_STATUSES.has(statuses.get(candidate.id))
    );

    if (task) return { task, week, weekIndex };
  }

  return null;
}
