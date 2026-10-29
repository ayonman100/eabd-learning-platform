# Routes and component reference

## Routes

Defined in `src/App.jsx`.

| Path | Component | Guard | Purpose |
| --- | --- | --- | --- |
| `/` | `Home` | public | Marketing entry point |
| `/about` | `About` | public | How EABD works |
| `/explore` | `Explore` | public | Pathway catalogue |
| `/signin` | `SignIn` | public | Email, password, and passkey sign-in |
| `/signup` | `SignUp` | public | Learner or guardian account |
| `/onboarding` | `OnboardingFlow` | `ProtectedRoute` | Seven-step record setup |
| `/dashboard` | `Dashboard` | `ProtectedRoute` | Next step and progress, shaped by the record |
| `/profile` | `Profile` | `ProtectedRoute` | Edit person, room, goal, and display |
| `/learning-journey` | `LearningJourney` | `ProtectedRoute` | Weeks, Canva handoff, submission |
| `/account` | `Account` | `ProtectedRoute` | Passkeys and sign out |
| `/glossary` | `Glossary` | public | Terms used on the site, including clinical scales |
| `/terms` | `Terms` | public | Terms of use for the pilot |
| `/privacy` | `Privacy` | public | What the pilot stores and who can see it |
| `/supervisor` | `SupervisorHome` | `SupervisorRoute` | Learners awaiting review |
| `/supervisor/learners/:learnerId` | `SupervisorLearner` | `SupervisorRoute` | Record, submissions, and the review form |
| `/admin` | `AdminHome` | `AdminRoute` | Approval queue, every learner, and the audit trail |
| `*` | inline `NotFound` | public | 404 with two ways back |

Query parameters:

| Parameter | Read by | Meaning |
| --- | --- | --- |
| `pathway` | `SignUp`, `Dashboard`, `Profile`, `LearningJourney`, `SupervisorHome`, `SupervisorLearner` | Which pathway to show. Resolved with `getPathwayOrFirst`, so a missing or unknown value falls back to the first pathway |

## Guards

| Guard | File | Behaviour |
| --- | --- | --- |
| `ProtectedRoute` | `src/components/ProtectedRoute.jsx` | Shows a polite loading page while auth or the learner record resolves, redirects to `/signin` with the intended location, otherwise renders the child route |
| `SupervisorRoute` | `src/components/SupervisorRoute.jsx` | The same, plus a clear "this area is for supervisors" page when the account has no supervisor role |
| `AdminRoute` | `src/components/AdminRoute.jsx` | Redirects a signed-out visitor to `/signin`. The page itself checks `platform_admins`, because row level security is the real gate |

`ProtectedRoute` and `SupervisorRoute` wait for `LearnerContext.loading` to be false, so a
child page never mounts with an empty record. `AdminRoute` waits for auth only. `AdminHome`
then checks the admin role and shows a clear refusal when the account does not hold it.

## Layout

`SiteHeader` renders above the route table in `App.jsx`. Each page renders its own `main`
element with `id="main-content"`. `SiteFooter` renders under the routes on the public pages
only: home, about, explore, sign-in, sign-up, glossary, terms, and privacy. Signed-in
learning pages leave it out so the marketing links do not compete with the learner's own
navigation. The header shows Administration inside My learning when `isAdmin` is true.

## Reusable components

| Component | Path | Props | Used by |
| --- | --- | --- | --- |
| `PasswordField` | `ui/PasswordField.jsx` | `id`, `label`, `name`, `value`, `onChange`, `autoComplete`, `helperId`, `helperText`, `minLength`, `required`, `disabled`, `toggleLabel` | `SignIn`, `SignUp` |
| `StatusMessage` / `ErrorMessage` | `ui/StatusBanner.jsx` | `children`, `className` | Every form |
| `PersonRoomSummary` | `ui/PersonRoomSummary.jsx` | `learner`, `section` (`both`, `person`, `room`) | `SupervisorLearner` |
| `ReviewFeedbackCard` | `ui/ReviewFeedbackCard.jsx` | `review`, `heading` | `Dashboard`, `LearningJourney`, `SupervisorLearner` |
| `PersonFields` | `fields/PersonFields.jsx` | `value`, `onChange`, `disabled`, `idPrefix` | `StepPerson`, `Profile` |
| `RoomFields` | `fields/RoomFields.jsx` | `value`, `onChange`, `disabled`, `idPrefix` | `StepRoom`, `Profile` |
| `GoalFields` | `fields/GoalFields.jsx` | `value`, `onChange`, `disabled`, `idPrefix`, `required` | `StepGoals`, `Profile` |
| `DisplaySettingsFields` | `fields/DisplaySettingsFields.jsx` | `value`, `onChange`, `disabled`, `idPrefix` | `StepDisplay`, `Profile`, `SiteHeader` |
| `Fieldset`, `TextField`, `OptionGroup` | `fields/FieldPrimitives.jsx` | see the file | The field groups above |
| `OnboardingStep` | `pages/onboarding/OnboardingStep.jsx` | `stepKey`, `title`, `intro`, `error`, `onSubmit`, `submitting`, `submitLabel`, `onBack`, `secondaryAction`, `showBack` | Every onboarding step |

### Rules for field groups

- Controlled: they receive `value` and `onChange`, and hold no state of their own.
- `idPrefix` keeps element ids unique when two groups appear on one page.
- Labels and hints are written once, so the same question reads identically in onboarding and
  on the profile page.

### Rules for new components

Before adding a component, check whether one of the above already covers the case. If a
second page needs a variation, add a prop rather than a copy. A component that is used once
and is specific to one page belongs in that page's folder, not in `ui/`.

## Page component notes

| Page | Owns | Shared pieces it mounts |
| --- | --- | --- |
| `OnboardingFlow` | Draft answers, the current step, upload and confirm state | `OnboardingStep`, all four field groups, `StepDocument`, `StepConfirm`, `StatusBanner` |
| `Profile` | One draft object per section and a status message per section | The four field groups inside a local `ProfileSection` wrapper |
| `Dashboard` | Progress rows and reviews for the active pathway | `ReviewFeedbackCard`, `StatusBanner`, `getNextTask` |
| `LearningJourney` | Progress rows, reviews, the pending Canva task, the submit form state | `ReviewFeedbackCard`, `StatusBanner`, a local `SubmitPanel` used twice |
| `SupervisorLearner` | The learner, their progress, their reviews, and one form per task | `PersonRoomSummary`, `ReviewFeedbackCard`, `StatusBanner` |

`SubmitPanel` is local to `LearningJourney` because it belongs to that page's interaction
model. If a third surface needs it, promote it to `ui/`.

## CSS organisation

| File | Scope |
| --- | --- |
| `src/index.css` | Tokens, themes, shared layout, public pages, footer, legal pages, administration, onboarding, dashboard, profile, supervisor, review, and journey |
| `src/styles/accessibility.css` | Skip link, global focus ring, visually hidden helper. Loaded after `index.css` |
| `src/components/Navbar.css` | Header and the display panel |

Class naming is plain and page-prefixed (`dashboard-`, `profile-`, `learning-`, `supervisor-`,
`onboarding-`). There is no CSS-in-JS and no utility framework, so a class in a component
should be findable by name in one of the files above.
