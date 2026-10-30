# EABD documentation

Documentation for the EABD learning platform, organised by kind. If you are new to
the project, read [architecture/overview.md](architecture/overview.md) first, then
come back here for the part you need.

## How this documentation is organised

The layout follows two well-known classifications at once:

- **Diátaxis**, which separates documentation by what a reader is trying to do:
  learning (tutorials and guides), working (how-to guides), looking something up
  (reference), and understanding (explanation).
- **Architecture and operations records**, which keep design decisions, security
  models, and deployment runbooks next to the code they describe.

Each folder below maps to one of those kinds. A document belongs in exactly one
folder, and cross-links replace duplication.

| Folder | Kind | Read it when |
| --- | --- | --- |
| [architecture/](architecture/) | Explanation | You need to understand how the system works or why it is built this way |
| [reference/](reference/) | Reference | You need exact names: tables, columns, functions, routes, components, API contracts |
| [features/](features/) | Specification and behaviour | You need to know what a feature does and what rules it follows |
| [guides/](guides/) | How-to | You need to run, test, or change something |
| [operations/](operations/) | Runbook | You are deploying, provisioning, or responding to an incident |
| [eae/](eae/) | Programme record | You need the dated plan, review, or audit trail for the pilot |

## Architecture

- [overview.md](architecture/overview.md) - system context, containers, data flow, and the technology choices
- [security-and-privacy.md](architecture/security-and-privacy.md) - health data rules, row level security, consent, and document lifecycle
- [design-and-accessibility.md](architecture/design-and-accessibility.md) - design tokens, the adaptation engine, and accessibility requirements

## Reference

- [database-schema.md](reference/database-schema.md) - tables, columns, constraints, triggers, indexes, and storage
- [services-and-contexts.md](reference/services-and-contexts.md) - every module in `src/lib/`, plus `AuthContext` and `LearnerContext`
- [edge-functions-api.md](reference/edge-functions-api.md) - the `extract-document` HTTP contract
- [components-and-routes.md](reference/components-and-routes.md) - route table, guards, and the reusable component catalogue
- [administration.md](reference/administration.md) - the platform admin role, the approval queue, and the audit trail

## Features

- [authentication-and-passkeys.md](features/authentication-and-passkeys.md) - learner and guardian sign-up, sign-in, and passkeys
- [onboarding-and-document-extraction.md](features/onboarding-and-document-extraction.md) - the seven-step flow and human confirmation of suggestions
- [adaptive-dashboard-and-profile.md](features/adaptive-dashboard-and-profile.md) - how the record shapes the screen, and profile editing
- [canva-pathway-and-supervisor-reviews.md](features/canva-pathway-and-supervisor-reviews.md) - pathway progression, the Canva handoff, supervisor review, and the admin queue

## Guides

- [local-development.md](guides/local-development.md) - install, configure, run, and link the Supabase project
- [testing-and-quality.md](guides/testing-and-quality.md) - lint, unit tests, the RLS check, and the Docker review build
- [committing.md](guides/committing.md) - commit message shape, and the Husky check that enforces it
- [enabling-passkeys.md](guides/enabling-passkeys.md) - turn on passkeys for a Supabase project, including the relying party values

## Operations

- [production-rollout.md](operations/production-rollout.md) - live release runbook: a new Supabase project, the migrations, and the Vercel build

## Programme records

- [eae/2026-10-28-learner-record-plan.md](eae/2026-10-28-learner-record-plan.md) - the implementation plan this build follows
- [eae/2026-10-28-code-review.md](eae/2026-10-28-code-review.md) - the code review and gap analysis

## Change log

[CHANGELOG.md](../CHANGELOG.md) records work from 28 October 2026, beginning with the
Vercel rewrite that serves every route from `index.html`. Earlier history belongs to
the platform build that was already in the repository.

## Conventions used in every document

- **Dates** are written in full, for example 28 October 2026.
- **Paths** are repository-relative, for example `src/lib/db/learners.js`.
- **Database tables** are named with their schema, for example `public.learners`.
- **Status words** match the database check constraints exactly: `started`, `submitted`, `reviewed`.
- **Plain language.** No em dashes and no emojis. This applies to the product copy too.

## Keeping documentation current

A change that alters behaviour, schema, routes, or component boundaries should update
the matching document in the same commit. The rule is stated for contributors in
[AGENTS.md](../AGENTS.md).
