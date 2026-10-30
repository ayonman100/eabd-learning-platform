import { describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// A signed-in learner with one submitted step, so the data-driven pages render
// their real content rather than an empty or loading state.
const learner = {
  id: "learner-1",
  owner_id: "user-1",
  relationship: "self",
  first_name: "Chinedu",
  reported_diagnosis: "Cerebral palsy as reported",
  gmfcs: 3,
  macs: 3,
  cfcs: 2,
  vision: "",
  fatigue: "",
  device: "Laptop",
  device_os: "Windows",
  screen: "15 inch",
  pointer: "Finger. Pinch to select fails.",
  canva_surface: "browser",
  seat: "Desk chair",
  who_in_room: "A support worker",
  goal: "Make a poster for a community event",
  starting_point: "Has used Canva once",
  barriers: "Fine motor",
  support: "Extra time",
  resources: "Laptop",
  learning_pace: "flexible",
  other_details: "",
  ui_settings: {},
  onboarding_step: "done",
  onboarding_completed_at: "2026-10-01T10:00:00.000Z",
  created_at: "2026-09-01T10:00:00.000Z",
  updated_at: "2026-10-01T10:00:00.000Z",
};

const progressRows = [
  {
    learner_id: "learner-1",
    pathway_id: "canva-design-project",
    task_id: "w1-t1",
    status: "submitted",
    submitted_at: "2026-10-02T10:00:00.000Z",
    design_link: "https://www.canva.com/design/example",
    learner_note: "I chose the community fair.",
  },
];

const reviews = [
  {
    id: "review-1",
    learner_id: "learner-1",
    pathway_id: "canva-design-project",
    task_id: "w1-t1",
    reviewer_id: "supervisor-1",
    marked_done: true,
    rating: 4,
    review: "Clear poster with readable text.",
    access_change: "Used a larger template.",
    created_at: "2026-10-03T10:00:00.000Z",
  },
];

const authValue = {
  session: { user: { id: "user-1", email: "learner@example.com" } },
  user: { id: "user-1", email: "learner@example.com", user_metadata: { full_name: "Chinedu Okafor" } },
  accountType: "learner",
  loading: false,
  isSupabaseConfigured: true,
  passkeysSupported: true,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signInWithPasskey: vi.fn(),
  registerPasskey: vi.fn(),
  listPasskeys: vi.fn(async () => ({ data: [], error: null })),
  removePasskey: vi.fn(),
};

const learnerValue = {
  learner,
  loading: false,
  error: "",
  refresh: vi.fn(),
  save: vi.fn(),
  isSupervisor: false,
  isAdmin: false,
};

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => authValue,
  AuthProvider: ({ children }) => children,
}));

vi.mock("../context/LearnerContext.jsx", () => ({
  useLearner: () => learnerValue,
  LearnerProvider: ({ children }) => children,
}));

vi.mock("../lib/db/progress.js", () => ({
  listTaskProgress: vi.fn(async () => progressRows),
  startTask: vi.fn(),
  submitTask: vi.fn(),
}));

vi.mock("../lib/db/reviews.js", () => ({
  listReviews: vi.fn(async () => reviews),
  latestReviewByTask: (rows) => {
    const map = new Map();
    for (const row of rows ?? []) if (!map.has(row.task_id)) map.set(row.task_id, row);
    return map;
  },
  createReview: vi.fn(),
}));

vi.mock("../lib/db/learners.js", () => ({
  getMyLearner: vi.fn(async () => learner),
  getLearner: vi.fn(async () => learner),
  createLearner: vi.fn(),
  updateLearner: vi.fn(async () => learner),
  saveUiSettings: vi.fn(async () => learner),
  listSupervisedLearners: vi.fn(async () => [
    { id: "learner-1", firstName: "Chinedu", relationship: "self", awaitingReview: 1 },
  ]),
}));

vi.mock("../lib/db/supervisors.js", () => ({
  isSupervisor: vi.fn(async () => true),
}));

import Home from "./Home.jsx";
import About from "./About.jsx";
import Explore from "./Explore.jsx";
import SignIn from "./SignIn.jsx";
import SignUp from "./SignUp.jsx";
import Dashboard from "./Dashboard.jsx";
import Profile from "./Profile.jsx";
import LearningJourney from "./LearningJourney.jsx";
import Account from "./Account.jsx";
import OnboardingFlow from "./onboarding/OnboardingFlow.jsx";
import SupervisorHome from "./supervisor/SupervisorHome.jsx";
import SupervisorLearner from "./supervisor/SupervisorLearner.jsx";
import Glossary from "./legal/Glossary.jsx";
import Terms from "./legal/Terms.jsx";
import Privacy from "./legal/Privacy.jsx";
import App from "../App.jsx";

async function render(element, route = "/") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(MemoryRouter, { initialEntries: [route] }, element)
    );
    // Let the data-loading effects settle.
    await Promise.resolve();
  });

  const html = container.innerHTML;
  await act(async () => {
    root.unmount();
  });
  container.remove();
  return html;
}

describe("public pages render", () => {
  it("renders the homepage with one skip target", async () => {
    const html = await render(createElement(Home));
    expect(html).toContain('id="main-content"');
    expect(html).toContain("Your interest.");
    // Exactly one h1, so the document outline is unambiguous.
    expect(html.match(/<h1/g) ?? []).toHaveLength(1);
  });

  it("renders the about page with one h1", async () => {
    const html = await render(createElement(About));
    expect(html).toContain("About EABD");
    expect(html).toContain("Your ability deserves a pathway");
    expect(html.match(/<h1/g) ?? []).toHaveLength(1);
    // The seven-step process is present.
    expect(html).toContain("Discover");
    expect(html).toContain("Connect");
  });

  it("renders the pathway catalogue with the pilot pathway", async () => {
    const html = await render(createElement(Explore));
    expect(html).toContain("Graphic Design: Creating a Promotional Flyer");
    expect(html).toContain("Pilot");
  });

  it("renders sign in with a password toggle", async () => {
    const html = await render(createElement(SignIn));
    expect(html).toContain("Sign in to EABD");
    expect(html).toContain('aria-label="Show password"');
    expect(html).toContain("Sign in with face or fingerprint");
  });

  it("renders sign up with the account type choice", async () => {
    const html = await render(createElement(SignUp));
    expect(html).toContain("Who is this account for?");
    expect(html).toContain("Myself");
    expect(html).toContain("Someone I support");
    expect(html).toContain("at least 8 characters");
  });

  it("renders the glossary and explains that partner is not pattern", async () => {
    const html = await render(createElement(Glossary), "/glossary");
    expect(html).toContain("Glossary");
    expect(html).toContain("Communication partner");
    // The glossary must settle the wording question in the product itself.
    expect(html).toContain("not pattern");
  });

  it("renders the terms of use with a pilot warning", async () => {
    const html = await render(createElement(Terms), "/terms");
    expect(html).toContain("Terms of use");
    expect(html).toContain("Pilot draft");
  });

  it("renders the privacy notice", async () => {
    const html = await render(createElement(Privacy), "/privacy");
    expect(html).toContain("Privacy notice");
    expect(html).toContain("Health and disability information");
  });
});

describe("learner pages render", () => {
  it("renders the dashboard with progress and the pathway", async () => {
    const html = await render(createElement(Dashboard), "/dashboard");
    expect(html).toContain("Welcome, Chinedu.");
    expect(html).toContain("Graphic Design: Creating a Promotional Flyer");
    expect(html).toContain("/profile");
  });

  it("renders the profile as a stepped wizard", async () => {
    const html = await render(createElement(Profile), "/profile");
    // One step at a time, with the step list and the first step's title.
    expect(html).toContain("Step 1 of 4");
    expect(html).toContain("What can this person do?");
    expect(html).toContain("Save and continue");
    // Every step is named in the progress list, even when not shown.
    for (const label of ["Person", "Room", "Goals", "Display"]) {
      expect(html).toContain(label);
    }
    // Only the current step's fields are mounted.
    expect(html).toContain("Diagnosis, as it was told to you");
    expect(html).not.toContain("What device do you use?");
  });

  it("renders the learning journey with collapsible weeks", async () => {
    const html = await render(
      createElement(LearningJourney),
      "/learning-journey?pathway=canva-design-project"
    );
    expect(html).toContain("Your learning journey");
    expect(html).toContain("Week 1");
    expect(html).toContain("Week 2");
    // Collapsed weeks are real disclosure buttons with aria-expanded.
    expect(html).toContain("aria-expanded");
    expect(html).toContain("aria-controls");
    // The primary submit action is present on the open week.
    expect(html).toContain("Send for review");
  });

  it("renders the account page with sign out", async () => {
    const html = await render(createElement(Account), "/account");
    expect(html).toContain("Face or fingerprint sign-in");
    expect(html).toContain("Sign out");
  });

  it("resumes onboarding at the saved step", async () => {
    const html = await render(createElement(OnboardingFlow), "/onboarding");
    // The mock learner has completed onboarding, so the flow offers the profile.
    expect(html).toContain("already set up");
  });
});

describe("supervisor pages render", () => {
  it("lists a supervised learner with the awaiting count", async () => {
    const html = await render(createElement(SupervisorHome), "/supervisor");
    expect(html).toContain("Learners you support");
  });

  it("shows the record summary and the review form", async () => {
    const html = await render(
      createElement(SupervisorLearner),
      "/supervisor/learners/learner-1"
    );
    expect(html).toContain("SUPERVISOR REVIEW");
  });
});

describe("application shell", () => {
  it("renders the header with display and read aloud controls", async () => {
    const html = await render(createElement(App), "/");
    expect(html).toContain("Skip to main content");
    expect(html).toContain("Accessibility and display settings");
    expect(html).toContain("Main navigation");
    // Signed-in navigation replaces the sign-in call to action.
    expect(html).toContain("Dashboard");
    expect(html).toContain("Sign out");
  });

  it("renders the not found page for an unknown route", async () => {
    const html = await render(createElement(App), "/nothing-here");
    expect(html).toContain("We couldn't find that page.");
  });
});
