# Agent guidance for this repository

This is a Vite 7 and React 19 single-page application with Supabase behind it. There is no Next.js
here; ignore any older instructions that mention it.

## Read first

- `docs/README.md` for the documentation map.
- `docs/architecture/overview.md` for how the pieces fit together.
- `docs/architecture/security-and-privacy.md` before touching learner records, documents, or reviews.
- `docs/eae/2026-10-28-learner-record-plan.md` for the current build plan.

## Commands

```bash
npm run dev      # Vite dev server
npm run lint     # ESLint flat config
npm test         # Vitest
npm run build    # production bundle
```

## Rules

- Plain sentences in user-facing copy. No em dashes and no emojis.
- Never log learner, health, or document data with `console.log` or `console.info`. The ESLint
  config only permits `console.error` and `console.warn`.
- Keep the Supabase service role key out of the browser. It belongs only to Edge Function secrets
  and the RLS check script environment.
- Reuse the shared building blocks instead of writing new copies:
  - `src/components/ui/` for cross-page primitives such as password fields, status banners,
    person and room summaries, and review feedback.
  - `src/components/fields/` for the person, room, goal, and display field groups, which are shared
    by onboarding, the profile page, and the accessibility panel.
  - `src/lib/db/` for all database access, with errors raised through `src/lib/db/helpers.js`.
- Do not create empty placeholder files. A new file must be imported and used by the change that
  adds it.
- Add or update a Vitest test whenever you add a pure function, and keep `npm run lint`,
  `npm test`, and `npm run build` green.
- Write plain CSS with the tokens in `src/index.css`. Do not hardcode colours; light, dark, and
  high contrast themes all read the same tokens.
- Accessibility is not optional: keyboard reachability, visible focus, labelled controls, live
  regions for errors, and the target sizes set by the accessibility settings.
- Update the relevant document under `docs/` when behaviour, schema, or routes change.
- Write commit messages in the shape documented in `docs/guides/committing.md`. Husky rejects
  any other shape.
