/**
 * Shared field building blocks.
 *
 * Every form in the app is a controlled component: it receives `value` and
 * `onChange` and owns no state. That is what lets onboarding, the profile page,
 * and the accessibility panel mount the same field groups without copying any
 * markup or labels.
 */

export function Fieldset({ legend, hint, children }) {
  return (
    <fieldset className="field-group">
      <legend>{legend}</legend>
      {hint && <p className="field-hint">{hint}</p>}
      {children}
    </fieldset>
  );
}

export function TextField({
  id,
  label,
  hint,
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholder,
  required = false,
  disabled = false,
  type = "text",
  autoComplete,
}) {
  const shared = {
    id,
    value: value ?? "",
    placeholder,
    required,
    disabled,
    onChange: (event) => onChange(event.target.value),
  };

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea {...shared} rows={rows} />
      ) : (
        <input {...shared} type={type} autoComplete={autoComplete} />
      )}
      {hint && (
        <small id={`${id}-hint`} className="auth-help">
          {hint}
        </small>
      )}
    </div>
  );
}

export function OptionGroup({ legend, hint, name, value, onChange, options }) {
  return (
    <fieldset className="onboarding-fieldset">
      <legend>{legend}</legend>
      {hint && <p className="field-hint">{hint}</p>}
      {options.map((option) => (
        <label className="onboarding-option" key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span>
            <strong>{option.label}</strong>
            {option.hint && <small>{option.hint}</small>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
