import { describe, expect, it } from "vitest";
import {
  getNextTask,
  getProgressSummary,
  getWeekStatus,
} from "./progress.js";

const pathway = {
  id: "p1",
  weeks: [
    {
      id: "w1",
      title: "Week 1",
      tasks: [{ id: "t1" }, { id: "t2" }],
    },
    {
      id: "w2",
      title: "Week 2",
      tasks: [{ id: "t3" }, { id: "t4" }],
    },
    {
      id: "w3",
      title: "Week 3",
      tasks: [{ id: "t5" }],
    },
  ],
};

function row(taskId, status) {
  return { task_id: taskId, status };
}

describe("getWeekStatus", () => {
  it("makes week 1 available with no rows", () => {
    expect(getWeekStatus(pathway, [], 0)).toBe("available");
  });

  it("locks week 2 until every week 1 task is submitted or reviewed", () => {
    expect(getWeekStatus(pathway, [row("t1", "started")], 1)).toBe("locked");
    expect(
      getWeekStatus(pathway, [row("t1", "submitted"), row("t2", "started")], 1)
    ).toBe("locked");
    expect(
      getWeekStatus(pathway, [row("t1", "submitted"), row("t2", "submitted")], 1)
    ).toBe("available");
  });

  it("treats a reviewed task as complete for unlocking", () => {
    expect(
      getWeekStatus(pathway, [row("t1", "reviewed"), row("t2", "submitted")], 1)
    ).toBe("available");
  });

  it("locks the next week again when a review sends a task back", () => {
    const rows = [row("t1", "submitted"), row("t2", "started")];
    expect(getWeekStatus(pathway, rows, 1)).toBe("locked");
  });

  it("reports a week as in review while any of its tasks is submitted", () => {
    expect(
      getWeekStatus(pathway, [row("t1", "submitted"), row("t2", "started")], 0)
    ).toBe("review");
  });

  it("reports a week as complete when every task is reviewed", () => {
    expect(
      getWeekStatus(pathway, [row("t1", "reviewed"), row("t2", "reviewed")], 0)
    ).toBe("complete");
  });

  it("locks an unknown week", () => {
    expect(getWeekStatus(pathway, [], 9)).toBe("locked");
    expect(getWeekStatus(null, [], 0)).toBe("locked");
  });
});

describe("getProgressSummary", () => {
  it("counts reviewed and submitted tasks as done", () => {
    const rows = [
      row("t1", "reviewed"),
      row("t2", "submitted"),
      row("t3", "started"),
      row("t4", "started"),
    ];
    const summary = getProgressSummary(pathway, rows);
    expect(summary).toEqual({
      totalTasks: 5,
      doneCount: 2,
      submittedCount: 1,
      reviewedCount: 1,
      remainingCount: 3,
      percentage: 40,
    });
  });

  it("counts nothing for an empty pathway without dividing by zero", () => {
    const summary = getProgressSummary({ weeks: [] }, []);
    expect(summary.percentage).toBe(0);
    expect(summary.totalTasks).toBe(0);
  });

  it("handles missing rows", () => {
    const summary = getProgressSummary(pathway, null);
    expect(summary.doneCount).toBe(0);
    expect(summary.remainingCount).toBe(5);
  });
});

describe("getNextTask", () => {
  it("returns the first task when nothing has started", () => {
    expect(getNextTask(pathway, []).task.id).toBe("t1");
  });

  it("moves past submitted tasks to the next task that needs work", () => {
    const next = getNextTask(pathway, [row("t1", "submitted"), row("t2", "started")]);
    expect(next.task.id).toBe("t2");
    expect(next.weekIndex).toBe(0);
  });

  it("returns nothing when the pathway is finished", () => {
    const rows = ["t1", "t2", "t3", "t4", "t5"].map((id) => row(id, "reviewed"));
    expect(getNextTask(pathway, rows)).toBeNull();
  });
});
