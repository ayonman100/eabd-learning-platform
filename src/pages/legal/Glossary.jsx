import LegalPage from "./LegalPage.jsx";

const GROUPS = [
  {
    id: "people",
    label: "People and roles",
    entries: [
      {
        term: "Learner",
        meaning:
          "The young person the record is about. A learner may hold their own account, or an adult may hold the account on their behalf.",
        where: "Used throughout the dashboard, journey, and profile.",
      },
      {
        term: "Guardian",
        meaning:
          "A parent, legal guardian, or carer who holds an account for a learner. Consent is recorded on the record before it is saved.",
        where: "Chosen at sign-up, and confirmed in the first onboarding step.",
      },
      {
        term: "Supervisor",
        meaning:
          "The person who marks a learner's steps as done or not yet, and writes a comment. A supervisor is added by the EABD team, not by signing up.",
        where: "The Supervisor area, and the feedback shown on a step.",
      },
      {
        term: "Communication partner",
        meaning:
          "Anyone the learner communicates with. A familiar partner is someone they know well, such as family or a regular support worker. An unfamiliar partner is someone new.",
        where:
          "The Communicating question. The five levels describe how well the learner is understood by familiar and unfamiliar partners. The word is partner, not pattern: the scale is about people, not habits.",
      },
    ],
  },
  {
    id: "disability",
    label: "Disability and function",
    entries: [
      {
        term: "GMFCS",
        meaning:
          "Gross Motor Function Classification System. Five word pictures describing how a person moves around, from walking without limitation to being transported in a manual wheelchair.",
        where: "The Getting around question in the person section.",
      },
      {
        term: "MACS",
        meaning:
          "Manual Ability Classification System. Five word pictures describing how a person handles objects, from handling them easily to not handling objects.",
        where: "The Using your hands question. It influences button and target sizes.",
      },
      {
        term: "CFCS",
        meaning:
          "Communication Function Classification System. Five word pictures describing how effectively a person communicates with familiar and unfamiliar partners.",
        where: "The Communicating question.",
      },
      {
        term: "Diagnosis, as reported",
        meaning:
          "The diagnosis written in the person's own words, or as it was told to them. It is stored as reported and never changes the screen.",
        where:
          "The person section. Adaptations come from function levels and the person's own choices only.",
      },
    ],
  },
  {
    id: "pathway",
    label: "Pathway and progress",
    entries: [
      {
        term: "Pathway",
        meaning:
          "A structured course of practical learning. The pilot pathway is the four-week Canva Design Project.",
        where: "Explore, and the learning journey.",
      },
      {
        term: "Week",
        meaning:
          "A group of tasks inside a pathway. The next week opens when every task in the current week has been sent for review or reviewed.",
        where: "The collapsible panels on the learning journey.",
      },
      {
        term: "Step, or task",
        meaning:
          "One piece of work inside a week, such as creating a first poster draft. Step and task mean the same thing.",
        where: "Inside an open week.",
      },
      {
        term: "Started",
        meaning: "The learner has opened the step. Opening it does not send it anywhere.",
        where: "The status pill on a task.",
      },
    ],
  },
  {
    id: "review",
    label: "Review",
    entries: [
      {
        term: "With supervisor, or submitted",
        meaning:
          "The learner has sent the step for review. They cannot change it until a supervisor responds.",
        where: "The status pill, and the dashboard.",
      },
      {
        term: "Reviewed, or marked done",
        meaning:
          "A supervisor looked at the step and marked it done. The step becomes read-only, and the review is kept as a permanent record.",
        where: "The status pill, and the feedback card.",
      },
      {
        term: "Not yet",
        meaning:
          "A supervisor decided a step needs another attempt. It returns to started, with a reason, so the learner can try again.",
        where: "The feedback card.",
      },
      {
        term: "Access change",
        meaning:
          "A short note from a supervisor describing what made a step possible, such as a larger template or extra time. It records the adjustment, never a judgement of the person.",
        where: "The optional field on a supervisor review.",
      },
    ],
  },
  {
    id: "access",
    label: "Access and display",
    entries: [
      {
        term: "Display settings",
        meaning:
          "The controls for text size, button size, contrast, spacing, motion, and reading aloud. Some are suggested from the record, and every one can be changed by hand.",
        where: "The Display button in the header.",
      },
      {
        term: "One step at a time",
        meaning:
          "A display setting that replaces the dashboard's week overview with a single next step.",
        where: "Display settings. Suggested when handling objects is difficult.",
      },
      {
        term: "High contrast",
        meaning:
          "A display setting that sets plain black text on a white background and hides the homepage film, so no text sits over a photograph.",
        where: "Display settings.",
      },
    ],
  },
  {
    id: "documents",
    label: "Documents and extraction",
    entries: [
      {
        term: "Extraction",
        meaning:
          "Reading an uploaded report to suggest answers. Suggestions are never saved until a person accepts them, and each one shows the words it came from.",
        where: "The optional document step in onboarding.",
      },
    ],
  },
  {
    id: "accounts",
    label: "Accounts and sign-in",
    entries: [
      {
        term: "Passkey",
        meaning:
          "Sign-in with the face or fingerprint check already on the person's own device. EABD never receives the face or fingerprint itself.",
        where: "The account page, and the sign-in page.",
      },
      {
        term: "Newsletter",
        meaning:
          "An occasional email about new pathways and pilot updates, sent no more than once a month.",
        where: "The footer of every public page.",
      },
    ],
  },
];

const CONTENTS = [
  { id: "why", label: "Why this page exists" },
  ...GROUPS.map((group) => ({ id: group.id, label: group.label })),
];

export default function Glossary() {
  return (
    <LegalPage
      eyebrow="Reference"
      title="Glossary"
      lead="Plain-language definitions for the terms used across EABD. If a word on the site is unclear, it should be here."
      updated="29 October 2026"
      contents={CONTENTS}
    >
      <section id="why">
        <h2>Why this page exists</h2>
        <p>
          This product uses some clinical and administrative words. A young person, a parent, and a
          supervisor should all be able to understand the same screen. Where a term has a precise
          meaning, this page explains it without jargon.
        </p>
        <p>
          If a term is missing, that is a fault in the product rather than in your understanding.
          Tell the EABD team and it will be added.
        </p>
      </section>

      {GROUPS.map((group) => (
        <section key={group.id} id={group.id}>
          <h2>{group.label}</h2>
          <div className="glossary-list">
            {group.entries.map((entry) => (
              <div className="glossary-entry" key={entry.term}>
                <h3 className="glossary-term">{entry.term}</h3>
                <p className="glossary-meaning">{entry.meaning}</p>
                <p className="glossary-where">Where you see it: {entry.where}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </LegalPage>
  );
}
