# Administration and approvals

## What the approval flow is

A learner works through a pathway and sends a step for review. A supervisor marks
it done or not yet, gives a rating, and writes a comment. That decision is what
"approves" a step: there is no separate approval record, because the review
itself is the record.

```
learner sends step          supervisor reviews            learner sees result
task_progress.submitted  ->  task_reviews (append-only) ->  task_progress.reviewed
                             apply_review() trigger         or back to started
```

Nothing approves automatically. A step sits in `submitted` until a person acting
as a reviewer writes a review.

## Two ways a review happens

| Route | Who | Scope |
| --- | --- | --- |
| `/supervisor` | A supervisor assigned to specific learners | Only learners in `learner_supervisors` for that person |
| `/admin` | A member of the EABD team | Every learner |

Both write to the same `task_reviews` table through `createReview`, so the audit
properties are identical whichever route is used.

## The admin role

`public.platform_admins` holds the role. It is granted in the SQL editor, never
from the client, because there is no insert policy for ordinary users.

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = '<admin email>';
```

The application reads its own row to decide whether to show the Administration
entry in the header menu. The page itself also checks, so a signed-in visitor who
guesses the URL sees a clear "this area is for the EABD team" screen. A later
failure while loading the queue or learner list must not flip that decision; it
is shown as an error on the admin page instead.

## Why the admin role exists rather than widening supervisors

A supervisor is a professional reviewing their own caseload. That boundary should
stay narrow: a therapist should not be able to read every learner in the pilot.
An administrator needs the opposite, broad read and the ability to reassign.

Keeping them separate means the supervisor policies stay exactly as they were.
The admin policies are additive: `admin reads all learners` sits alongside
`learner read`, and Postgres combines permissive policies with OR.

## The audit trail

`public.admin_audit` records administrative actions that are not already captured
by the review table:

| Action | Recorded when |
| --- | --- |
| `review_created` | An admin submits a review from the queue |
| `learner_assigned` | A supervisor is assigned to a learner |
| `learner_unassigned` | An assignment is removed |
| `supervisor_granted` | The supervisor role is granted |
| `supervisor_revoked` | The supervisor role is removed |

Each row stores the actor, the action, the learner, the target user, and a small
JSON detail. Rows are readable only by admins and are never updated or deleted.

Reviews themselves are already append-only with no update or delete policy, so
the combination answers: who submitted what, who decided, when, and why.

A failed audit write is logged but does not fail the action, because an approval
that succeeded should not appear to have failed. That trade-off is deliberate and
is worth revisiting if audit completeness becomes a compliance requirement.

## Best practice this follows

Researched against learning-platform and approval-workflow guidance:

1. **Role-based scoping.** A supervisor sees a caseload; an admin sees everything.
   Separation is enforced in the database, not the interface.
2. **A queue, oldest first.** The admin queue orders by `submitted_at` ascending,
   so nothing is starved.
3. **A rejection needs a reason.** "Not yet" requires a comment; the learner sees
   it and can resubmit.
4. **Accepted records are immutable.** Reviews cannot be edited; a correction is a
   new review.
5. **Every decision is attributed and timestamped.** Both tables carry
   `reviewer_id` or `actor_id` and `created_at`.
6. **Notification on submission.** Not built yet. This is the main gap; see below.
7. **SLAs and escalation.** Not built yet. Recommended before more than a handful
   of learners are active.

## What is deliberately missing

- **No notification.** A supervisor has to open the queue to discover work. The
  research is unambiguous that this is the first thing to add: an email or in-app
  notification on submission, then a reminder, then escalation to a backup.
- **No reassignment UI.** The table and policies support it; the interface does
  not expose it yet.
- **No export.** An audit CSV per learner is recommended for compliance and is not
  built.
- **No bulk approve.** Deliberate. Bulk approval on a record a person has not read
  defeats the point of review.

## Granting access

```sql
-- Admin
insert into public.platform_admins (user_id)
select id from auth.users where email = '<admin email>';

-- Supervisor, then assign to a learner
insert into public.supervisors (user_id)
select id from auth.users where email = '<supervisor email>';

insert into public.learner_supervisors (learner_id, supervisor_id)
select l.id, s.user_id
from public.learners l, public.supervisors s
where l.first_name = '<learner first name>'
  and s.user_id = (select id from auth.users where email = '<supervisor email>');
```

An admin can also assign an existing supervisor from the Learners tab without
touching SQL.
