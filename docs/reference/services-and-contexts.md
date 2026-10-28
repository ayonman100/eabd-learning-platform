# Services and contexts reference

Everything the browser uses to reach data or rules lives in `src/lib/` or `src/context/`.
Nothing else in the app talks to Supabase directly.

## `src/lib/db/helpers.js`

Shared plumbing so no data module repeats it.

| Export | Purpose |
| --- | --- |
| `requireSupabaseClient()` | Returns the client, or throws the configuration message |
| `raiseUserSafeError(logLabel, userMessage, error)` | Logs the provider message, throws a plain sentence |
| `requireUserId()` | Returns the signed-in user id, or throws |
| `unwrap(response, logLabel, userMessage)` | Returns `data`, or throws a safe message when `error` is set |

The contract every data function follows: it resolves with plain objects, or throws an
`Error` whose `message` is safe to display. The raw provider error is logged with
`console.error` and never includes learner data.

## `src/lib/db/learners.js`

| Function | Returns |
| --- | --- |
| `getMyLearner()` | The signed-in account's learner row, oldest first, or null |
| `getLearner(learnerId)` | One learner row the caller is allowed to read, or null |
| `createLearner({ relationship, firstName, guardianConsent })` | The new row, with `onboarding_step` set to `document` |
| `updateLearner(learnerId, patch)` | The updated row. `patch` keys are column names |
| `saveUiSettings(learnerId, uiSettings)` | The updated row, touching only `ui_settings` |
| `listSupervisedLearners()` | `[{ id, firstName, relationship, awaitingReview }]` for the signed-in supervisor |

## `src/lib/db/documents.js`

| Export | Purpose |
| --- | --- |
| `DOCUMENT_BUCKET`, `MAX_DOCUMENT_BYTES`, `ALLOWED_MIME_TYPES` | Shared limits, also used by the upload form |
| `validateDocumentFile(file)` | Returns a message or null |
| `uploadLearnerDocument(learnerId, file)` | Uploads to storage, inserts the row with a consent timestamp, returns the row |
| `requestExtraction(documentId)` | Calls the Edge Function and returns its response body |
| `getDocument(documentId)` | One document row for the caller |
| `confirmExtraction(documentId, acceptedFields, { deleteFile })` | Writes accepted fields, marks confirmed, deletes the file when asked |
| `discardExtraction(documentId)` | Marks discarded and deletes the file |

`confirmExtraction` tolerates an empty `acceptedFields` object: the document is still marked
confirmed and the file can still be deleted.

## `src/lib/db/progress.js`

| Function | Returns |
| --- | --- |
| `listTaskProgress(learnerId, pathwayId)` | Every task row for that learner and pathway |
| `startTask(learnerId, pathwayId, taskId)` | The existing row if there is one, otherwise a new `started` row |
| `submitTask(learnerId, pathwayId, taskId, { designLink, note })` | The row upserted to `submitted` with `submitted_at` |

`startTask` deliberately keeps an existing row: a step already submitted or reviewed must not
be reset by opening it again.

## `src/lib/db/reviews.js`

| Function | Returns |
| --- | --- |
| `listReviews(learnerId, pathwayId)` | Every review, newest first |
| `latestReviewByTask(reviews)` | A `Map` of task id to newest review |
| `createReview({ learnerId, pathwayId, taskId, markedDone, rating, review, accessChange })` | The inserted row |

`createReview` validates the rating (whole number 1 to 5) and requires a non-empty comment
before it calls the database, so the failure message is specific.

## `src/lib/db/supervisors.js`

| Function | Returns |
| --- | --- |
| `isSupervisor()` | `true` when the caller has a `supervisors` row. Never throws; a failure returns `false` and logs |

## `src/lib/adaptations.js`

| Export | Purpose |
| --- | --- |
| `DEFAULT_SETTINGS` | The seven display keys and their defaults |
| `deriveAdaptations(learner)` | Settings suggested by function levels and descriptions |
| `resolveSettings(derived, overrides)` | Overrides win, key by key |
| `settingsToClasses(settings)` | The `a11y-*` class list for the document root |

## `src/lib/levels.js`

| Export | Purpose |
| --- | --- |
| `FUNCTION_SCALES` | GMFCS, MACS, and CFCS with their five word pictures and question text |
| `NOT_SURE` | The sentinel option value for "Not sure" |
| `scaleValueToOption(value)` | Stored number to radio value |
| `optionToScaleValue(option)` | Radio value to stored number or null |
| `describeScaleValue(key, value)` | Readable label for summaries |

## `src/lib/extraction.js`

| Export | Purpose |
| --- | --- |
| `EXTRACTABLE_FIELDS` | The seven allowed keys |
| `FIELD_LABELS` | Human labels used by the confirm step |
| `validateExtraction(payload)` | `{ ok, fields, errors }`, with every allowed key present |
| `acceptedFieldValues(fields, acceptedKeys)` | The values to write onto the learner row |

The mirror of this contract on the server is `supabase/functions/_shared/extraction-schema.ts`.

## `src/lib/passkeys.js`

| Export | Purpose |
| --- | --- |
| `passkeyErrorMessage(error)` | Short sentence for a WebAuthn or provider error |
| `formatPasskeyDate(value)` | Localised date for a passkey row |

## `src/lib/supabase.js`

Creates the client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. It exports
`isSupabaseConfigured` so the app can degrade to a clear message rather than crashing when
the environment is incomplete.

## `src/utils/progress.js`

Pure functions over task rows. No storage, no network.

| Function | Returns |
| --- | --- |
| `getProgressSummary(pathway, rows)` | `{ totalTasks, doneCount, submittedCount, reviewedCount, remainingCount, percentage }` |
| `getWeekStatus(pathway, rows, weekIndex)` | `locked`, `available`, `review`, or `complete` |
| `getNextTask(pathway, rows)` | `{ task, week, weekIndex }` or null |

Rule: a week is available when every task in the previous week is `submitted` or `reviewed`.
A step sent back by a review returns to `started`, which locks the next week again.

## `src/data/learningPaths.js`

| Export | Purpose |
| --- | --- |
| `learningPaths` | The pathway definitions, currently one |
| `DEFAULT_PATHWAY_ID` | The first pathway id |
| `getPathwayById(id)` | The matching pathway or null |
| `getPathwayOrFirst(id)` | The matching pathway, or the first |
| `getPathwayTasks(pathway)` | Every task across the weeks |

## `AuthContext`

| Value | Meaning |
| --- | --- |
| `session`, `user` | Supabase session and user, or null |
| `accountType` | `learner` or `guardian`, from user metadata |
| `loading` | True until the first session read resolves |
| `isSupabaseConfigured` | Whether the environment is complete |
| `passkeysSupported` | Secure context with WebAuthn available |
| `signUp({ name, email, password, accountType, emailRedirectTo })` | Creates the account with metadata |
| `signIn({ email, password })`, `signOut()` | Session management |
| `signInWithPasskey()`, `registerPasskey()`, `listPasskeys()`, `removePasskey(id)` | Passkey management |

Every function is memoised, so including one in a dependency array is safe.

## `LearnerContext`

| Value | Meaning |
| --- | --- |
| `learner` | The signed-in account's learner row, or null |
| `loading` | Auth still resolving, or the record for this user has not arrived |
| `error` | A safe message when the record could not be loaded |
| `refresh()` | Reloads the record and the supervisor role |
| `save(patch)` | Writes a patch and updates the cached record |
| `isSupervisor` | Whether the account holds the supervisor role |

`loading` is derived rather than set in an effect: it stays true until there is a record whose
`userId` matches the current user. That is what prevents a page from acting on an empty
record during sign-in.
