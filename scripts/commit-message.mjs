import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const TYPES = [
  "feat",
  "fix",
  "docs",
  "test",
  "refactor",
  "chore",
  "build",
  "ci",
  "perf",
  "style",
];

const SUBJECT = new RegExp(
  `^(${TYPES.join("|")})\\([a-z0-9]+(?:-[a-z0-9]+)*\\): [A-Z].+$`
);

/**
 * Checks a commit message against the project shape.
 * Returns a list of problems. An empty list means the message is acceptable.
 * Merge and revert commits are left alone, because Git writes those subjects.
 */
export function validateCommitMessage(raw) {
  const message = String(raw ?? "").replace(/\r\n/g, "\n").replace(/\n+$/, "");
  const lines = message.split("\n");
  const subject = lines[0] ?? "";

  if (/^(Merge|Revert) /.test(subject)) return [];

  const errors = [];

  if (subject.length > 72) {
    errors.push("Keep the subject line to 72 characters or fewer.");
  }

  if (!SUBJECT.test(subject) || subject.endsWith(".")) {
    errors.push(
      'Start with a subject like "feat(admin): Add the approval queue".'
    );
  }

  const bullets = lines.slice(1).filter((line) => line.trim() !== "");

  if (bullets.length === 0) {
    errors.push("Add at least one bullet sentence under the subject.");
  }

  for (const line of bullets) {
    if (!line.startsWith("- ")) {
      errors.push(`Write body lines as bullets starting with "- ": ${line}`);
      continue;
    }

    const sentence = line.slice(2).trim();
    if (!/[.!?]$/.test(sentence)) {
      errors.push(`End each bullet with a full stop: ${line}`);
    }
  }

  return errors;
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

if (isDirectRun()) {
  const file = process.argv[2];

  if (!file) {
    console.error("Usage: node scripts/commit-message.mjs <message-file>");
    process.exit(1);
  }

  const errors = validateCommitMessage(readFileSync(file, "utf8"));

  if (errors.length > 0) {
    console.error("Commit message rejected.");
    for (const error of errors) console.error(`- ${error}`);
    console.error("The expected shape is documented in docs/guides/committing.md.");
    process.exit(1);
  }
}
