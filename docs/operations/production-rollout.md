# Production rollout runbook

This is a checklist for the person deploying the learner record to a real Supabase project.
Nothing here should be run against production without the project owner present.

## Before you start

Have ready:

- Access to the production Supabase project, and its project reference.
- Access to the Vercel project.
- The decision on the extraction provider, including its data processing terms.
- The list of supervisors and which learners each one supports.
- Written consent arrangements for any under-18 learner.

## 1. Database

```bash
npx supabase link --project-ref <production ref>
npx supabase db push
```

Confirm in the dashboard:

- Seven tables exist: `profiles`, `supervisors`, `learners`, `learner_supervisors`,
  `learner_documents`, `task_progress`, `task_reviews`.
- Row level security is enabled on all seven.
- The bucket `learner-documents` exists and is **private**.
- The `on_auth_user_created` trigger exists on `auth.users`.

## 2. Authentication settings

| Setting | Value |
| --- | --- |
| Site URL | `https://<your production domain>` |
| Redirect URLs | `https://<your production domain>/**` |
| Email confirmation | On |
| WebAuthn relying party | The production domain, not localhost |
| Password minimum | 8 characters or more |

Changing the relying party invalidates existing passkeys, so do it before anyone enrols a device.

## 3. Environment variables

In Vercel, for the production environment:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | The production project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The production publishable key |

Never add a service role key here. It is published to every browser.

Redeploy after changing them, because Vite inlines the values at build time.

## 4. Edge Function

```bash
npx supabase functions deploy extract-document --project-ref <production ref>
npx supabase secrets set EXTRACTION_PROVIDER=<mock or the chosen provider> --project-ref <production ref>
```

If a real provider is chosen, also set `OPENAI_API_KEY` and confirm the retention terms in
writing before a health document is sent.

## 5. Supervisors

After each supervisor has signed up, run the two inserts from
[the schema reference](../reference/database-schema.md#supervisor-provisioning). Then check that
the account can reach `/supervisor` and cannot reach another learner's record.

## 6. Verify the policies in production

Run the RLS check against production with the three production test accounts, then delete those
accounts:

```bash
node scripts/rls-check.mjs
```

If any assertion fails, stop and roll back before inviting anyone.

## 7. Smoke test in production

1. Sign up as a learner and complete onboarding.
2. Open a pathway step and submit it.
3. Sign in as the supervisor and review it.
4. Confirm the learner sees the feedback.
5. Add a passkey and sign in with it on a second device.
6. Turn on high contrast and the largest target size, and confirm every control is usable.

## Rollback

| Situation | Action |
| --- | --- |
| The migration is wrong | Restore the database from the pre-deploy backup, then fix forward |
| The Edge Function is misbehaving | `npx supabase functions delete extract-document`; onboarding falls back to typing answers |
| A policy is too permissive | Revert the policy in a new migration, redeploy, and re-run the RLS check |
| The bundle is broken | Redeploy the previous Vercel build |

There is no data migration to undo: every table is new. The only irreversible step is deleting a
document from storage, and the browser only does that after a person confirms their suggestions.

## Privacy checks before inviting a real learner

- [ ] The extraction provider decision is recorded, with retention terms attached.
- [ ] Consent arrangements for the learner are recorded offline.
- [ ] The supervisor list is confirmed, and each assignment is deliberate.
- [ ] Someone has read the record with `reports` consent and confirmed the fields match what the
      person agreed to share.
- [ ] Document deletion on confirm has been observed working at least once in production.

## Ongoing checks

| Cadence | Check |
| --- | --- |
| After every deploy | Run the smoke test above |
| Monthly | Review the `supervisors` and `learner_supervisors` rows for anyone who should no longer have access |
| Monthly | Confirm no document has been retained past its confirmation without a reason |
| Per change | `npm run lint`, `npm test`, `npm run build`, and the RLS check |
