# Security and privacy

This document is the reference for anyone touching learner records, documents, or
reviews. The data is health-adjacent and belongs to a young person, so the rules below
are not stylistic preferences.

## The four rules

1. **Collect only what the record needs.** Every field has a purpose. Optional questions
   say they are optional, and "Not sure" stores nothing.
2. **Store the diagnosis as reported.** The field is labelled "Diagnosis, as it was told
   to you". The application never infers a condition, a level, or a capability from a
   diagnosis.
3. **A diagnosis never changes the screen.** Only function levels (GMFCS, MACS, CFCS), the
   pointer description, the vision description, and fatigue drive adaptations. This is
   enforced by construction: `deriveAdaptations` never reads `reported_diagnosis`, and a
   test asserts that a diagnosis alone leaves the settings at their defaults.
4. **A person confirms every suggested field.** Document reading produces suggestions with
   quoted evidence. Nothing is written to the learner row until the person accepts it.

## What must never be logged

- Learner names, goals, barriers, support needs, or any free-text answer.
- Document contents, file names, or extracted values.
- Access tokens or session details.

The ESLint configuration allows only `console.error` and `console.warn`, and code review
enforces that even those carry no learner data. The one exception is a short label plus a
provider error message in `src/lib/db/helpers.js`.

## Identity and ownership model

```mermaid
erDiagram
  auth_users ||--o| profiles : "one profile"
  auth_users ||--o{ learners : "owns"
  auth_users ||--o| supervisors : "may be"
  learners ||--o{ learner_documents : "has"
  learners ||--o{ task_progress : "has"
  learners ||--o{ task_reviews : "receives"
  learners ||--o{ learner_supervisors : "assigned to"
  supervisors ||--o{ learner_supervisors : "reviews"
```

- An `auth.users` row owns zero or more `learners` rows through `owner_id`.
- A learner account is an owner whose learner row has `relationship = 'self'`. A unique
  index allows exactly one such row.
- A guardian owns learner rows with a relationship of `parent`, `guardian`, `carer`, or
  `other`, and each of those rows requires `guardian_consent_at`.
- A supervisor is a user with a row in `public.supervisors`, created in the SQL editor only.
  Assignment to a learner is a row in `public.learner_supervisors`.

## Row level security

Every table has row level security enabled and deny-by-default behaviour. The policies use
three `security definer` helpers so a policy never recurses through the row level security
of the table it inspects:

| Helper | Question it answers |
| --- | --- |
| `is_supervisor()` | Does the caller hold the supervisor role? |
| `owns_learner(id)` | Does the caller own this learner row? |
| `supervises_learner(id)` | Is this learner assigned to the caller as supervisor? |

What each role can do:

| Table | Owner (learner or guardian) | Supervisor |
| --- | --- | --- |
| `profiles` | read and update their own row | read and update their own row |
| `supervisors` | read their own row, which reveals the role | read their own row |
| `learners` | read, insert, update, delete their own rows | read rows assigned to them |
| `learner_supervisors` | read assignments for their learners | read their own assignments |
| `learner_documents` | full access to their learners' documents | no access |
| `task_progress` | read, insert, update, but never set `reviewed` | read assigned learners' progress |
| `task_reviews` | read | read assigned, insert with `reviewer_id` set to themselves |

Notes that matter when changing a policy:

- The learner's update policy on `task_progress` has `status <> 'reviewed'` in `USING` and
  `status in ('started','submitted')` in `WITH CHECK`. Both halves are needed: the first
  stops editing a reviewed row, the second stops writing `reviewed` directly.
- `task_reviews` is append-only. There is no update or delete policy, so a review is a
  permanent record of what a supervisor said.
- Storage policies check the first path segment against `owns_learner_path(text)`. The
  comparison is textual so a malformed folder name denies access instead of raising a cast
  error.

## Document lifecycle

```mermaid
stateDiagram-v2
  [*] --> pending : upload with consent timestamp
  pending --> extracted : the function stored valid suggestions
  pending --> failed : unreadable, provider error, or invalid output
  extracted --> confirmed : a person accepted at least one field
  extracted --> discarded : a person chose to discard
  confirmed --> [*] : file deleted when the delete box was ticked
  discarded --> [*] : file deleted
```

Rules:

- `processing_consent_at` is required at insert. The browser collects the tick box first.
- The bucket is private, with a 10 MB limit and a MIME allow list of PDF, PNG, and JPEG.
- The browser validates type and size before uploading, and the database constraint repeats
  the limits so a direct API call cannot bypass them.
- `confirmExtraction` writes the accepted fields, marks the document `confirmed`, and, when
  the box is ticked, removes the stored object and sets `file_deleted_at`. Deletion is best
  effort: a failure is logged and the record still records the intent.
- Supervisors never see documents. They see the fields the person chose to keep.

## Authentication

- Email and password through Supabase Auth. Passwords require at least 8 characters in the
  client, and the project's own policy applies server side.
- WebAuthn passkeys are offered only when `window.isSecureContext` is true and
  `PublicKeyCredential` exists, so the control never appears where it cannot work.
- A passkey can be added or removed from the Account page. Removal requires confirmation.
- Passkey errors are translated into short sentences in `src/lib/passkeys.js`, which has unit
  tests, rather than surfacing provider text.

## Threat notes for reviewers

| Scenario | Control |
| --- | --- |
| A learner edits another learner's record | Row level security on ownership, verified by `scripts/rls-check.mjs` |
| A learner approves their own work | No insert policy on `task_reviews` for non-supervisors, and `status <> 'reviewed'` on progress updates |
| A user grants themselves supervisor rights | `supervisors` has no insert policy, so only the SQL editor can add a row |
| A signed URL leaks a document | Documents use policies rather than public URLs, and the file is deleted on confirmation |
| A malformed storage path crashes a policy | Path ownership compares text, so a bad path returns false |
| Health data reaches analytics or logs | Only `console.error` is permitted, and it carries labels rather than values |

## What still needs a decision

These are recorded as open decisions in the implementation plan and are not solved by the
current build:

- Which extraction provider to use for real documents, and its retention terms.
- Whether under-18 learners may sign up for themselves, or whether a guardian account is
  required for the pilot.
- Which real people act as supervisors and which learners each one sees.
