import DisplaySettingsFields from "../../components/fields/DisplaySettingsFields.jsx";

/**
 * Step 7. Shows the settings suggested by the answers, and lets the person
 * change any of them before finishing.
 */
export default function StepDisplay({ value, onChange, derived }) {
  const derivedForDisplay = Object.entries(derived ?? {})
    .filter(([, settingValue]) => settingValue === true)
    .map(([key]) => key);

  return (
    <>
      <p>
        These settings are suggested from your answers. Change anything that
        does not suit you. Your choices are kept and can be edited later from
        your account.
      </p>

      {derivedForDisplay.length > 0 && (
        <p className="auth-help">
          Suggested for you because of what you told us. You can change all of
          it below.
        </p>
      )}

      <DisplaySettingsFields
        value={value}
        onChange={onChange}
        idPrefix="onboarding-display"
      />
    </>
  );
}
