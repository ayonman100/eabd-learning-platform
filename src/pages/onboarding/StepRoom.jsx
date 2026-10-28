import RoomFields from "../../components/fields/RoomFields.jsx";

/**
 * Step 5. Uses the shared room field group.
 */
export default function StepRoom({ value, onChange }) {
  return (
    <>
      <p>
        This helps us understand the equipment and the setting you work in. It
        also shapes the button size and spacing on your dashboard.
      </p>
      <RoomFields value={value} onChange={onChange} idPrefix="onboarding-room" />
    </>
  );
}
