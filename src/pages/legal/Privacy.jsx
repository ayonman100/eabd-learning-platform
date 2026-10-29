import LegalPage from "./LegalPage.jsx";


const CONTENTS = [
  { id: "summary", label: "In short" },
  { id: "controller", label: "Who is responsible" },
  { id: "what", label: "What we collect and why" },
  { id: "health", label: "Health and disability information" },
  { id: "documents", label: "Uploaded documents" },
  { id: "legal-basis", label: "Our lawful basis" },
  { id: "sharing", label: "Who can see it" },
  { id: "retention", label: "How long we keep it" },
  { id: "rights", label: "Your rights" },
  { id: "cookies", label: "Cookies and storage" },
  { id: "complaints", label: "Complaints" },
];

export default function Privacy() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy notice"
      lead="What EABD collects, why, who can see it, and what you can ask us to do with it."
      updated="29 October 2026"
      contents={CONTENTS}
    >
      <div className="notice-card">
        <p className="notice-card-title">Pilot draft, not legal advice</p>
        <p>
          This notice describes what the software does today. It will be reviewed with legal advice, and against the UK GDPR and the Equality Act 2010, before the platform is made generally available. It is not a substitute for that review.
        </p>
      </div>

      <section id="summary">
        <h2>In short</h2>
        <ul>
          <li>We collect what the record needs to work, and nothing more.</li>
          <li>A diagnosis is stored as reported. It never changes what the screen shows.</li>
          <li>Only you, and the supervisor assigned to you, can see your record.</li>
          <li>You can ask to see, correct, export, or delete your record.</li>
          <li>Uploaded documents can be deleted the moment you confirm their suggestions.</li>
        </ul>
      </section>

      <section id="controller">
        <h2>1. Who is responsible</h2>
        <p>
          EABD is responsible for the information described here. During the pilot, requests about
          your information go to the EABD team through the contact details given when you joined.
        </p>
      </section>

      <section id="what">
        <h2>2. What we collect and why</h2>
        <h3>Account information</h3>
        <p>
          Your name, email address, and account type (learner or guardian). This is needed to create
          and secure your account. If you add a passkey, a public key and a device label are stored;
          your face or fingerprint never leaves your device.
        </p>

        <h3>What you tell us about learning</h3>
        <p>
          Your goal, starting point, barriers, support needs, resources, preferred pace, and anything
          else you choose to share. This shapes the pathway and the way the screen behaves.
        </p>

        <h3>The room and equipment</h3>
        <p>
          Device, operating system, screen size, how you point and tap, where you sit, and who is
          usually in the room. This is used to suggest sensible button and text sizes.
        </p>

        <h3>Progress and reviews</h3>
        <p>
          Which steps you have started, sent, and had reviewed, plus the supervisor's comment,
          rating, and any access change they recorded.
        </p>

        <h3>Display choices</h3>
        <p>
          Text size, contrast, spacing, motion, and reading speed. These are stored on your device
          and, when you are signed in, on your record so they follow you to another device.
        </p>
      </section>

      <section id="health">
        <h2>3. Health and disability information</h2>
        <p>
          Some of what you share is health information, which the law treats as more sensitive. We
          treat it that way:
        </p>
        <ul>
          <li>We ask only for what the record needs, and mark optional questions as optional.</li>
          <li>"Not sure" is always an available answer, and stores nothing.</li>
          <li>We never infer a function level from a diagnosis.</li>
          <li>
            Adaptations come from what a person can do and from their own choices, never from a
            diagnosis.
          </li>
          <li>We never write learner or health information to browser logs or analytics.</li>
        </ul>
      </section>

      <section id="documents">
        <h2>4. Uploaded documents</h2>
        <p>
          You can upload a report or letter so the app can suggest answers. If you do:
        </p>
        <ul>
          <li>the file is stored in a private area that only your account can reach;</li>
          <li>it is read to produce suggestions, each with a quote from the document;</li>
          <li>nothing is added to your record until you accept it;</li>
          <li>
            you choose whether to delete the file when you confirm, and deletion is the default;
          </li>
          <li>supervisors never see the uploaded file, only the answers you accepted.</li>
        </ul>
        <p>
          During the pilot the reading step uses a fixed sample rather than sending real documents to
          a third party. If a real extraction provider is connected later, this notice will name it
          and describe its retention terms before any document is sent.
        </p>
      </section>

      <section id="legal-basis">
        <h2>5. Our lawful basis</h2>
        <p>
          For the pilot, we rely on your consent for the information you choose to share, and on
          legitimate interests for keeping the service secure and working. Because some information
          is health information, we also require explicit consent at the point you provide it. You
          can withdraw consent at any time, and the record can then be closed.
        </p>
      </section>

      <section id="sharing">
        <h2>6. Who can see it</h2>
        <ul>
          <li>
            <strong>You.</strong> Your own record, and your progress.
          </li>
          <li>
            <strong>Your guardian,</strong> where a guardian holds the account.
          </li>
          <li>
            <strong>Your assigned supervisor.</strong> The person and room description, your goal,
            your submitted work, and the reviews they write. Not your uploaded documents.
          </li>
          <li>
            <strong>Nobody else.</strong> Access is enforced by the database itself, per row, per
            person. There is no "see everything" account in the application.
          </li>
        </ul>
      </section>

      <section id="retention">
        <h2>7. How long we keep it</h2>
        <p>
          Your record is kept while your account is open. Uploaded documents are deleted when you
          confirm their suggestions, or when you discard them. If you close your account, the
          learner record, its progress, reviews, and stored documents are deleted, except where the
          law or a safeguarding duty requires us to keep something.
        </p>
      </section>

      <section id="rights">
        <h2>8. Your rights</h2>
        <p>You can ask to:</p>
        <ul>
          <li>see a copy of your record;</li>
          <li>correct anything that is wrong;</li>
          <li>receive your record in a portable format;</li>
          <li>have your record deleted;</li>
          <li>withdraw consent, or object to how something is used.</li>
        </ul>
        <p>
          Ask the EABD team and we will respond within the time the law allows. If you are a
          guardian acting for a learner, the learner's own wishes should lead, and we may need to
          involve them.
        </p>
      </section>

      <section id="cookies">
        <h2>9. Cookies and storage</h2>
        <p>
          EABD does not use advertising or tracking cookies. It does store a small amount of data in
          your browser so the site works:
        </p>
        <ul>
          <li>
            a session token, so you stay signed in while you move between pages;
          </li>
          <li>
            your display choices, so the page does not reset every time you open it.
          </li>
        </ul>
        <p>Clearing your browser storage signs you out and resets the display choices.</p>
      </section>

      <section id="complaints">
        <h2>10. Complaints</h2>
        <p>
          If you are unhappy with how your information has been handled, tell the EABD team first so
          it can be put right. You also have the right to complain to the Information Commissioner's
          Office in the United Kingdom.
        </p>
      </section>
    </LegalPage>
  );
}
