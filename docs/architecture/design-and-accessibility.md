# Design system and accessibility

The interface has to work for people with a wide range of movement, vision, attention, and
communication needs. This document describes the tokens, the adaptation engine, and the
requirements that every screen meets.

## Design tokens

All colour comes from custom properties on `:root` in `src/index.css`. There is no
hardcoded colour in a component, and a test in `src/styles/themes.test.js` fails if one
is introduced.

| Token | Purpose |
| --- | --- |
| `--color-primary` | Violet from the wheelchair figure, at full vibrancy. 6.23:1 on white |
| `--color-primary-strong` | Pressed states and headings |
| `--color-primary-soft` | Selected rows, active pill background |
| `--color-secondary` | Deep teal. 6.06:1, safe for text |
| `--color-secondary-bright` | Decorative teal only, never text |
| `--color-tertiary` / `--color-tertiary-bright` | Amber from the star. Deep for text, bright for fills |
| `--color-background` / `--color-surface` | Page and card surfaces |
| `--color-text` / `--color-muted` | 17.6:1 and 7.0:1 |
| `--color-border` / `--color-hover` | Hairlines and hover fills |
| `--color-focus` | Focus ring |
| `--color-success-*` / `--color-warning-*` / `--color-danger-*` | Status surfaces and text |
| `--tint-violet` / `--tint-teal` / `--tint-amber` | Section band backgrounds |
| `--hero-*` | Everything drawn over the homepage film |

### Why the brights are separate tokens

Canva's palette is vivid, and two of its signature colours fail contrast badly: its teal is
2.15:1 on white and its amber is also 2.15:1. So each hue exists twice: a readable shade for
text and button fills, and a `-bright` shade for decoration. The brights are never used for
text. The violet is the exception: Canva's own purple passes at 6.23:1, so the primary is the
genuinely vibrant one.

### The hero tokens

The homepage puts text over a photograph, which is the hardest case for contrast. Rather
than hardcoding white and a dark scrim, the hero reads `--hero-*` tokens. High contrast
sets the scrim to solid white and hides the video entirely, so no text sits over an image.
This is what the `themes.test.js` guard protects.

## The adaptation engine

`src/lib/adaptations.js` has two pure functions.

```js
deriveAdaptations(learner);          // what the record suggests
resolveSettings(derived, overrides); // the person's own choices win, key by key
```

Derived rules, all from function levels and descriptions, never from a diagnosis:

| Input | Setting |
| --- | --- |
| MACS 3 | `targetSize: large`, `extraSpacing: true` |
| MACS 4 or 5 | `targetSize: extra-large`, `extraSpacing: true`, `oneThingAtATime: true` |
| Pointer mentions pinch, drag, tremor, or switch | at least `targetSize: large` |
| CFCS 3 to 5 | `oneThingAtATime: true` |
| Vision mentions low vision or glare | `textSize: large`, `highContrast: true` |
| Fatigue has any text | `extraTime: true` |

Target size only ever increases: a rule that suggests `large` cannot lower an `extra-large`
set by another rule. `resolveSettings` then applies the person's overrides, which are stored
in `learners.ui_settings` and in `localStorage` so the panel works before sign-in.

Tests in `src/lib/adaptations.test.js` cover the three sample learners from the pilot design,
the diagnosis-only case, and override precedence.

## Accessibility requirements

### Structure

- One `main` element per page with `id="main-content"` and `tabIndex="-1"`, so the skip link
  in the header reaches real content on every route, including the homepage.
- One `h1` per page. Sections use `h2`, and cards use `h3`.
- Each form control has a real `label` with a matching `for`, or is wrapped in a `label`.

### Focus

- `:focus-visible` draws a 3px ring in `--color-focus`, with an offset, from
  `src/styles/accessibility.css`. This file loads after `index.css` so it wins.
- The onboarding step heading takes focus on every step change, so a screen reader announces
  the new question.
- The display panel closes on Escape and returns focus to the control that opened it.
- The display panel also closes on a click outside it, and opening the learning menu closes
  it. Only one surface is open at a time.
- Every switch row is a real checkbox whose input covers the whole row, so the label is part
  of the target and the visible switch is decorative.
- No focus trap exists, because no modal dialog is used.

### Keyboard and pointer targets

- Every control is a real `button`, `a`, `input`, `select`, or `textarea`. There are no click
  handlers on `div` elements.
- The minimum interactive size is 44 by 44 CSS pixels.
- With `targetSize: large`, targets become at least 64px; with `extra-large`, at least 88px.
  Both rules live in `index.css` under `:root.a11y-targets-large` and
  `:root.a11y-targets-xl`.
- Header tool buttons stay at 44px at every viewport, including below 420px.

### Announcements

- Errors use `role="alert"` through `ErrorMessage`.
- Confirmations use `role="status"` through `StatusMessage`.
- A disabled submit button changes its text ("Saving...") rather than relying on colour.

### Motion

- `prefers-reduced-motion` disables transitions and animations globally.
- The homepage hero video pauses when the system prefers reduced motion or the in-app
  reduce-animation setting is on. It does not resume on its own until motion is allowed again.

### Read aloud

- Uses the browser's speech synthesis, preferring an English voice.
- Voices load asynchronously in most browsers, so the header listens for `voiceschanged`
  before the first read.
- Reading speed is adjustable from 0.5x to 1.5x and is remembered per device.

## Reusable presentation components

The accessibility promises are easier to keep when the markup exists once.

| Component | Path | Where it is used |
| --- | --- | --- |
| `PasswordField` | `src/components/ui/PasswordField.jsx` | Sign in, both sign-up password fields |
| `StatusBanner` | `src/components/ui/StatusBanner.jsx` | Every form in the app |
| `PersonRoomSummary` | `src/components/ui/PersonRoomSummary.jsx` | Supervisor learner page |
| `ReviewFeedbackCard` | `src/components/ui/ReviewFeedbackCard.jsx` | Dashboard, learning journey, supervisor page |
| `PersonFields` | `src/components/fields/PersonFields.jsx` | Onboarding step 4, profile |
| `RoomFields` | `src/components/fields/RoomFields.jsx` | Onboarding step 5, profile |
| `GoalFields` | `src/components/fields/GoalFields.jsx` | Onboarding step 6, profile |
| `DisplaySettingsFields` | `src/components/fields/DisplaySettingsFields.jsx` | Onboarding step 7, profile, header panel |
| `FieldPrimitives` | `src/components/fields/FieldPrimitives.jsx` | The three field groups above |

A field group is controlled: it receives `value` and `onChange` and holds no state. That is
what makes it safe to mount in three different pages.
