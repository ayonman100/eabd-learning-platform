# Committing changes

Every commit on this repository uses the same shape. Husky checks it in
`.husky/commit-msg` before the commit is created. The checker is
`scripts/commit-message.mjs`, and its rules are covered by
`scripts/commit-message.test.js`.

## The shape

```
type(scope): Subject in the imperative
- Sentence explaining why this change exists.
- Sentence naming the limit, the risk, or the behaviour someone should know.
```

A real example:

```
docs(ui): Document the vibrant palette and display panel behaviour
- The palette is derived from the logo, so a later colour change has a recorded reason.
- The display panel closes on an outside click, which the previous notes did not mention.
```

| Part | Rule |
| --- | --- |
| `type` | `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build`, `ci`, `perf`, or `style` |
| `scope` | A short lowercase noun, with hyphens if needed: `admin`, `auth`, `docker`, `ui` |
| Subject | Imperative, starts with a capital letter, no full stop, 72 characters or fewer for the whole line |
| Bullets | One or more lines starting with `- `, each a complete sentence |
| Blank line | Allowed between the subject and the first bullet, and not required |

`feat` adds behaviour. `fix` corrects behaviour. `docs` changes documentation only.
`test` changes tests only. `refactor` changes structure without changing behaviour.
`chore` is tooling. `build` is the bundle, Docker, or dependency wiring. `ci` is the
pipeline. `perf` is a measured speed change. `style` is formatting only.

## One change per commit

A commit should be readable on its own. Group files that have to land together, such as
a route, the page it mounts, and the document that lists that route. Leave unrelated
files for the next commit.

The subject says what changed. The bullets say why, and any limit a reviewer should
not have to discover in the diff. Schema, route, and behaviour changes update the
matching document under `docs/` in the same commit.

## What stays out

Environment files, service role keys, and anything under `.env*` stay uncommitted.
The publishable key is already read from `.env.local` at build time. It does not
belong in a commit message either.

Git writes `Merge` and `Revert` subjects itself. The checker leaves those alone.

## How the check runs

`npm install` runs the `prepare` script, which points Git at `.husky`. The
`commit-msg` hook reads the message file and exits with an error when the shape
is wrong. Rewrite the message and commit again. The hook is part of the review,
so it stays enabled.

Run the checker tests with the rest of the suite:

```bash
npm test
npx vitest run scripts/commit-message.test.js
```
