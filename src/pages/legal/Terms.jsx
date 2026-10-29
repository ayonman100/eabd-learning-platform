import LegalPage from "./LegalPage.jsx";


const CONTENTS = [
  { id: "status", label: "Status of these terms" },
  { id: "who", label: "Who this covers" },
  { id: "accounts", label: "Accounts and sign-in" },
  { id: "acceptable", label: "Using the service fairly" },
  { id: "content", label: "Your content" },
  { id: "reviews", label: "Supervisor reviews" },
  { id: "availability", label: "Availability and changes" },
  { id: "ending", label: "Ending an account" },
  { id: "contact", label: "Contact" },
];

export default function Terms() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of use"
      lead="The agreement between you and EABD for using this website and the learning record."
      updated="29 October 2026"
      contents={CONTENTS}
    >
      <div className="notice-card">
        <p className="notice-card-title">Pilot draft, not legal advice</p>
        <p>
          EABD is a pilot. These terms describe how the service works today and will be reviewed with legal advice before the platform is made generally available. If anything here is unclear, ask before relying on it.
        </p>
      </div>

      <section id="status">
        <h2>1. Status of these terms</h2>
        <p>
          This is a pilot service for a small number of participants. The features described on the
          site are being tested and may change or be withdrawn. Nothing on this site is a promise
          that a particular pathway, adjustment, or outcome will be available.
        </p>
      </section>

      <section id="who">
        <h2>2. Who this covers</h2>
        <p>
          You may use EABD as a learner, as a guardian acting for a learner, or as a supervisor who
          has been added by the EABD team. Where a guardian holds the account, the guardian is
          responsible for the accuracy of what is recorded and for the learner's agreement to share
          it.
        </p>
        <p>
          You must be able to enter into this agreement, or have a parent, guardian, or carer do so
          with you.
        </p>
      </section>

      <section id="accounts">
        <h2>3. Accounts and sign-in</h2>
        <ul>
          <li>Keep your password private. Do not share your account.</li>
          <li>
            A passkey is tied to the device where it was set up. If you lose that device, remove the
            passkey from your account.
          </li>
          <li>
            You are responsible for activity under your account, so tell the EABD team straight away
            if you think someone else has access.
          </li>
          <li>Do not create accounts for other people without their agreement.</li>
        </ul>
      </section>

      <section id="acceptable">
        <h2>4. Using the service fairly</h2>
        <p>Please do not:</p>
        <ul>
          <li>upload a document that is not yours to share, or that you have no permission to send;</li>
          <li>attempt to access another person's record;</li>
          <li>use the service to harass, threaten, or discriminate against anyone;</li>
          <li>try to break, overload, or probe the security of the service;</li>
          <li>copy or resell any part of the service or its pathway content.</li>
        </ul>
      </section>

      <section id="content">
        <h2>5. Your content</h2>
        <p>
          The information you put into your record, including any document you upload, remains
          yours. You give EABD permission to store and display it so the service can work: showing
          your progress, sending a step to a supervisor, and shaping the display.
        </p>
        <p>
          Uploaded documents are read only to suggest answers. Each suggestion must be accepted by a
          person before it is saved, and you can choose to have the document deleted as soon as you
          confirm.
        </p>
      </section>

      <section id="reviews">
        <h2>6. Supervisor reviews</h2>
        <p>
          A supervisor marks a step done or not yet, gives a rating, and writes a comment. Reviews
          are kept as a permanent record and cannot be edited or deleted afterwards, so that the
          learner's history stays accurate. A later review is added rather than changing an earlier
          one.
        </p>
        <p>
          A review is one person's professional judgement at a moment in time. It is not a formal
          qualification, and it does not certify that someone is competent to work unsupervised.
        </p>
      </section>

      <section id="availability">
        <h2>7. Availability and changes</h2>
        <p>
          The service is provided as it is during the pilot. It may be unavailable while it is being
          changed, and data may be reset during testing. We will give notice where we can. These
          terms, and the features they describe, may change; the date at the top of this page shows
          when they last did.
        </p>
      </section>

      <section id="ending">
        <h2>8. Ending an account</h2>
        <p>
          You can ask the EABD team to close your account at any time. Closing the learner record
          removes its progress, reviews, and any stored documents. Some records may be kept where
          the law or safeguarding requires it, and we will explain if that applies.
        </p>
        <p>
          We may suspend an account that breaks these terms, or where keeping it open would put
          someone at risk. We will say why, unless doing so would put someone else at risk.
        </p>
      </section>

      <section id="contact">
        <h2>9. Contact</h2>
        <p>
          Questions about these terms, or a request about your record, should go to the EABD team
          through the contact details given when you joined the pilot. Read the{" "}
          <a href="/privacy">privacy notice</a> for how information is handled.
        </p>
      </section>
    </LegalPage>
  );
}
