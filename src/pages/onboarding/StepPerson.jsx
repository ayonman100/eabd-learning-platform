import PersonFields from "../../components/fields/PersonFields.jsx";

/**
 * Step 4. Uses the shared person field group, so the same questions and word
 * pictures appear on the profile page.
 */
export default function StepPerson({ value, onChange }) {
  return (
    <>
      <p>
        These questions describe what you can do day to day. Answer only what
        you want to. &ldquo;Not sure&rdquo; is always a good answer.
      </p>
      <PersonFields value={value} onChange={onChange} idPrefix="onboarding-person" />
    </>
  );
}
