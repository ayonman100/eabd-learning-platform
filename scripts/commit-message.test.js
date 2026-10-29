import { describe, expect, it } from "vitest";
import { validateCommitMessage } from "./commit-message.mjs";

const valid = `feat(admin): Add the approval queue
- Supervisors only see their own learners, so the team needs a separate role.
- A failed list query must not hide the page from someone who already has the role.`;

describe("validateCommitMessage", () => {
  it("accepts a subject and bullet sentences", () => {
    expect(validateCommitMessage(valid)).toEqual([]);
  });

  it("accepts a blank line between the subject and the bullets", () => {
    const message = `docs(test): Explain how the unit tests run

- The suite already covers pure rules and page smoke tests.
- A new pure function needs a test in the same change.`;
    expect(validateCommitMessage(message)).toEqual([]);
  });

  it("leaves merge and revert subjects alone", () => {
    expect(validateCommitMessage("Merge branch 'feature/learner-record'\n")).toEqual([]);
    expect(validateCommitMessage("Revert \"feat(admin): Add the approval queue\"\n")).toEqual([]);
  });

  it("rejects a subject without a type and scope", () => {
    const errors = validateCommitMessage("Add the approval queue\n- Because the team needs it.");
    expect(errors.some((error) => error.includes("feat(admin)"))).toBe(true);
  });

  it("rejects a subject that ends with a full stop", () => {
    const errors = validateCommitMessage("feat(admin): Add the approval queue.\n- Because the team needs it.");
    expect(errors.some((error) => error.includes("feat(admin)"))).toBe(true);
  });

  it("rejects a subject longer than 72 characters", () => {
    const subject = `feat(admin): ${"A".repeat(60)}`;
    const errors = validateCommitMessage(`${subject}\n- Because the team needs it.`);
    expect(errors.some((error) => error.includes("72"))).toBe(true);
  });

  it("rejects a message with no bullets", () => {
    const errors = validateCommitMessage("feat(admin): Add the approval queue\n");
    expect(errors.some((error) => error.includes("bullet"))).toBe(true);
  });

  it("rejects a bullet that is not a sentence", () => {
    const errors = validateCommitMessage("feat(admin): Add the approval queue\n- the team needs it");
    expect(errors.some((error) => error.includes("full stop"))).toBe(true);
  });

  it("rejects a body line that is not a bullet", () => {
    const errors = validateCommitMessage("feat(admin): Add the approval queue\nThis explains the change.");
    expect(errors.some((error) => error.includes("bullets"))).toBe(true);
  });
});
