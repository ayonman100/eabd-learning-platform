
const STORAGE_PREFIX = "eabd-learning-progress-v1";

function getStorageKey(userId, pathwayId) {
  return `${STORAGE_PREFIX}:${userId}:${pathwayId}`;
}

function createEmptyProgress(pathway) {
  return {
    pathwayId: pathway.id,
    completedTasks: [],
    reviewFlags: {},
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeProgress(saved, pathway) {
  const validTaskIds = new Set(
    pathway.weeks.flatMap((week) => week.tasks.map((task) => task.id))
  );

  const completedTasks = Array.isArray(saved?.completedTasks)
    ? [...new Set(saved.completedTasks.filter((id) => validTaskIds.has(id)))]
    : [];

  const reviewFlags = {};

  if (saved?.reviewFlags && typeof saved.reviewFlags === "object") {
    for (const [taskId, flag] of Object.entries(saved.reviewFlags)) {
      if (
        validTaskIds.has(taskId) &&
        flag &&
        typeof flag === "object" &&
        ["pending", "cleared"].includes(flag.status)
      ) {
        reviewFlags[taskId] = {
          status: flag.status,
          note: typeof flag.note === "string" ? flag.note : "",
        };
      }
    }
  }

  return {
    pathwayId: pathway.id,
    completedTasks,
    reviewFlags,
    updatedAt:
      typeof saved?.updatedAt === "string"
        ? saved.updatedAt
        : new Date().toISOString(),
  };
}

export function loadProgress(userId, pathway) {
  if (!userId || !pathway?.id || !Array.isArray(pathway.weeks)) {
    return createEmptyProgress(pathway);
  }

  try {
    const raw = localStorage.getItem(getStorageKey(userId, pathway.id));

    if (!raw) return createEmptyProgress(pathway);

    return sanitizeProgress(JSON.parse(raw), pathway);
  } catch {
    return createEmptyProgress(pathway);
  }
}

export function saveProgress(userId, pathway, progress) {
  if (!userId || !pathway?.id) {
    return {
      ok: false,
      error: "A learner and learning pathway are required.",
    };
  }

  try {
    const safeProgress = sanitizeProgress(progress, pathway);

    safeProgress.updatedAt = new Date().toISOString();

    localStorage.setItem(
      getStorageKey(userId, pathway.id),
      JSON.stringify(safeProgress)
    );

    return { ok: true, progress: safeProgress };
  } catch {
    return {
      ok: false,
      error: "Progress could not be saved in this browser.",
    };
  }
}

export function getProgressSummary(pathway, progress) {
  const tasks = pathway.weeks.flatMap((week) => week.tasks);
  const completedIds = new Set(progress.completedTasks);
  const completedCount = tasks.filter((task) => completedIds.has(task.id)).length;

  return {
    totalTasks: tasks.length,
    completedCount,
    remainingCount: tasks.length - completedCount,
    percentage:
      tasks.length === 0
        ? 0
        : Math.round((completedCount / tasks.length) * 100),
  };
}

export function getWeekStatus(pathway, progress, weekIndex) {
  const week = pathway.weeks[weekIndex];

  if (!week) return "locked";

  const completedIds = new Set(progress.completedTasks);

  const hasPendingReview = week.tasks.some(
    (task) => progress.reviewFlags[task.id]?.status === "pending"
  );

  if (hasPendingReview) return "review";

  const isComplete = week.tasks.every((task) => completedIds.has(task.id));

  if (isComplete) return "complete";

  if (weekIndex === 0) return "available";

  const previousWeekStatus = getWeekStatus(
    pathway,
    progress,
    weekIndex - 1
  );

  return previousWeekStatus === "complete" ? "available" : "locked";
}

export function updateTaskCompletion(pathway, progress, taskId, completed) {
  const taskExists = pathway.weeks.some((week) =>
    week.tasks.some((task) => task.id === taskId)
  );

  if (!taskExists) {
    return { ok: false, error: "This task does not exist in the pathway." };
  }

  const weekIndex = pathway.weeks.findIndex((week) =>
    week.tasks.some((task) => task.id === taskId)
  );

  if (getWeekStatus(pathway, progress, weekIndex) === "locked") {
    return {
      ok: false,
      error: "Complete the previous week before starting this week.",
    };
  }

  if (progress.reviewFlags[taskId]?.status === "pending") {
    return {
      ok: false,
      error: "This task is awaiting review and cannot be changed yet.",
    };
  }

  const completedTasks = new Set(progress.completedTasks);

  if (completed) {
    completedTasks.add(taskId);
  } else {
    completedTasks.delete(taskId);
  }

  return {
    ok: true,
    progress: {
      ...progress,
      completedTasks: [...completedTasks],
      updatedAt: new Date().toISOString(),
    },
  };
}

export function flagTaskForReview(pathway, progress, taskId, note = "") {
  const taskExists = pathway.weeks.some((week) =>
    week.tasks.some((task) => task.id === taskId)
  );

  if (!taskExists) {
    return { ok: false, error: "This task does not exist in the pathway." };
  }

  const weekIndex = pathway.weeks.findIndex((week) =>
    week.tasks.some((task) => task.id === taskId)
  );

  if (getWeekStatus(pathway, progress, weekIndex) === "locked") {
    return {
      ok: false,
      error: "This week is locked until the previous week is complete.",
    };
  }

  return {
    ok: true,
    progress: {
      ...progress,
      reviewFlags: {
        ...progress.reviewFlags,
        [taskId]: {
          status: "pending",
          note: note.trim(),
        },
      },
      updatedAt: new Date().toISOString(),
    },
  };
}

export function clearTaskReview(pathway, progress, taskId) {
  if (progress.reviewFlags[taskId]?.status !== "pending") {
    return {
      ok: false,
      error: "This task does not have a pending review.",
    };
  }

  return {
    ok: true,
    progress: {
      ...progress,
      reviewFlags: {
        ...progress.reviewFlags,
        [taskId]: {
          ...progress.reviewFlags[taskId],
          status: "cleared",
        },
      },
      updatedAt: new Date().toISOString(),
    },
  };
}
