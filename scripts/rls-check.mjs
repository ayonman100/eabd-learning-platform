#!/usr/bin/env node
/**
 * Row level security checks for the learner record.
 *
 * Signs in as three real accounts and asserts that the database policies stop
 * one learner reading or writing another's record, that a learner cannot
 * approve their own work, and that a supervisor can review a step without
 * gaining access to documents.
 *
 * Required environment variables (put them in scripts/.env or export them):
 *   SUPABASE_URL                 project URL
 *   SUPABASE_PUBLISHABLE_KEY     publishable (anon) key
 *   RLS_LEARNER_A_EMAIL / _PASSWORD
 *   RLS_LEARNER_B_EMAIL / _PASSWORD
 *   RLS_SUPERVISOR_EMAIL / _PASSWORD
 *
 * Create the accounts through the app first, then add the supervisor to
 * public.supervisors and public.learner_supervisors in the SQL editor.
 *
 * Usage: node scripts/rls-check.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const PATHWAY_ID = "canva-design-project";
const TASK_ID = "w1-t1";

function loadEnvFile() {
  const path = new URL("./.env", import.meta.url);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadEnvFile();

const results = [];

function record(name, passed, detail) {
  results.push({ name, passed, detail });
  const label = passed ? "pass" : "FAIL";
  console.log(`${label}  ${name}${detail ? ` (${detail})` : ""}`);
}

function requireEnv(names) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    process.exit(2);
  }
}

async function signIn(email, password) {
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Could not sign in as ${email}: ${error.message}`);
  }

  return client;
}

async function main() {
  requireEnv([
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "RLS_LEARNER_A_EMAIL",
    "RLS_LEARNER_A_PASSWORD",
    "RLS_LEARNER_B_EMAIL",
    "RLS_LEARNER_B_PASSWORD",
    "RLS_SUPERVISOR_EMAIL",
    "RLS_SUPERVISOR_PASSWORD",
  ]);

  const learnerA = await signIn(
    process.env.RLS_LEARNER_A_EMAIL,
    process.env.RLS_LEARNER_A_PASSWORD
  );
  const learnerB = await signIn(
    process.env.RLS_LEARNER_B_EMAIL,
    process.env.RLS_LEARNER_B_PASSWORD
  );
  const supervisor = await signIn(
    process.env.RLS_SUPERVISOR_EMAIL,
    process.env.RLS_SUPERVISOR_PASSWORD
  );

  // 1. Learner A reads their own learner row.
  const { data: ownRows, error: ownError } = await learnerA
    .from("learners")
    .select("id, first_name")
    .eq("owner_id", (await learnerA.auth.getUser()).data.user.id);

  const learnerAId = ownRows?.[0]?.id ?? null;
  record(
    "Learner A reads their own learner row",
    !ownError && Boolean(learnerAId),
    ownError?.message
  );

  if (!learnerAId) {
    console.error("No learner row for account A. Finish onboarding first.");
    process.exit(2);
  }

  // 2. Learner B cannot read learner A's row.
  const { data: crossRows, error: crossError } = await learnerB
    .from("learners")
    .select("id")
    .eq("id", learnerAId);

  record(
    "Learner B sees no rows for learner A",
    !crossError && (crossRows?.length ?? 0) === 0,
    crossError?.message
  );

  // 3. Learner B cannot write a document row against learner A.
  const { error: docInsertError } = await learnerB
    .from("learner_documents")
    .insert({
      learner_id: learnerAId,
      storage_path: `${learnerAId}/intruder.pdf`,
      file_name: "intruder.pdf",
      mime_type: "application/pdf",
      size_bytes: 1024,
      uploaded_by: (await learnerB.auth.getUser()).data.user.id,
      processing_consent_at: new Date().toISOString(),
    });

  record(
    "Learner B cannot insert a document for learner A",
    Boolean(docInsertError),
    docInsertError ? "rejected" : "insert succeeded"
  );

  // 4. Learner B cannot upload into learner A's storage folder.
  const { error: uploadError } = await learnerB.storage
    .from("learner-documents")
    .upload(`${learnerAId}/intruder-${Date.now()}.pdf`, new Blob(["x"]), {
      contentType: "application/pdf",
    });

  record(
    "Learner B cannot upload into learner A's folder",
    Boolean(uploadError),
    uploadError ? "rejected" : "upload succeeded"
  );

  // 5. A learner cannot mark their own step as reviewed.
  const { error: reviewedInsertError } = await learnerA
    .from("task_progress")
    .upsert(
      {
        learner_id: learnerAId,
        pathway_id: PATHWAY_ID,
        task_id: TASK_ID,
        status: "reviewed",
      },
      { onConflict: "learner_id,pathway_id,task_id" }
    );

  record(
    "Learner A cannot set a step to reviewed",
    Boolean(reviewedInsertError),
    reviewedInsertError ? "rejected" : "write succeeded"
  );

  // 6. A learner cannot write a review.
  const { error: reviewInsertError } = await learnerA
    .from("task_reviews")
    .insert({
      learner_id: learnerAId,
      pathway_id: PATHWAY_ID,
      task_id: TASK_ID,
      reviewer_id: (await learnerA.auth.getUser()).data.user.id,
      marked_done: true,
      rating: 5,
      review: "Self approved",
    });

  record(
    "Learner A cannot insert a review",
    Boolean(reviewInsertError),
    reviewInsertError ? "rejected" : "insert succeeded"
  );

  // 7. Nobody can grant themselves the supervisor role from the client.
  const { error: supervisorInsertError } = await learnerA
    .from("supervisors")
    .insert({ user_id: (await learnerA.auth.getUser()).data.user.id });

  record(
    "Client cannot insert into supervisors",
    Boolean(supervisorInsertError),
    supervisorInsertError ? "rejected" : "insert succeeded"
  );

  // 8. The supervisor reads the assigned learner and their progress.
  const { data: supervisedRows, error: supervisedError } = await supervisor
    .from("learners")
    .select("id")
    .eq("id", learnerAId);

  const supervisorAssigned =
    !supervisedError && (supervisedRows?.length ?? 0) === 1;

  record(
    "Supervisor reads the assigned learner",
    supervisorAssigned,
    supervisedError?.message
  );

  // 9. The supervisor cannot read documents.
  const { data: supervisorDocs, error: supervisorDocError } = await supervisor
    .from("learner_documents")
    .select("id")
    .eq("learner_id", learnerAId);

  record(
    "Supervisor sees no documents",
    !supervisorDocError && (supervisorDocs?.length ?? 0) === 0,
    supervisorDocError?.message
  );

  if (!supervisorAssigned) {
    console.log("\nSkipping review checks: supervisor is not assigned to learner A.");
    return summarise();
  }

  // 10. The supervisor writes a review, which sets the step to reviewed.
  const { error: supervisorReviewError } = await supervisor
    .from("task_reviews")
    .insert({
      learner_id: learnerAId,
      pathway_id: PATHWAY_ID,
      task_id: TASK_ID,
      reviewer_id: (await supervisor.auth.getUser()).data.user.id,
      marked_done: true,
      rating: 4,
      review: "Clear poster with readable text.",
    });

  record(
    "Supervisor inserts a review",
    !supervisorReviewError,
    supervisorReviewError?.message
  );

  const { data: progressRows } = await learnerA
    .from("task_progress")
    .select("status")
    .eq("learner_id", learnerAId)
    .eq("pathway_id", PATHWAY_ID)
    .eq("task_id", TASK_ID)
    .maybeSingle();

  record(
    "The review sets the step to reviewed",
    progressRows?.status === "reviewed",
    progressRows?.status ?? "no row"
  );

  summarise();
}

function summarise() {
  const failed = results.filter((result) => !result.passed);
  console.log(
    `\n${results.length - failed.length} of ${results.length} checks passed.`
  );
  if (failed.length > 0) {
    console.log("Failed checks:");
    for (const result of failed) {
      console.log(`  - ${result.name}${result.detail ? `: ${result.detail}` : ""}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
