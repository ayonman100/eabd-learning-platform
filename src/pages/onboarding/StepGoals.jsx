import GoalFields from "../../components/fields/GoalFields.jsx";

/**
 * Step 6. Uses the shared goal field group.
 */
export default function StepGoals({ value, onChange }) {
  return (
    <>
      <p>
        Start with what matters to you. There is no right answer, and every
        question apart from your goal can be left blank.
      </p>
      <GoalFields
        value={value}
        onChange={onChange}
        idPrefix="onboarding-goal"
        required
      />
    </>
  );
}
