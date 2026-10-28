import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Labelled password input with a show and hide control.
 *
 * Used for sign-in, both password fields on sign-up, and any future password
 * entry, so the accessible toggle is written once.
 */
export default function PasswordField({
  id,
  label,
  name,
  value,
  onChange,
  autoComplete = "current-password",
  helperId,
  helperText,
  minLength,
  required = true,
  disabled = false,
  toggleLabel = "password",
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-control">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          minLength={minLength}
          aria-describedby={helperId}
          required={required}
          disabled={disabled}
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${toggleLabel}` : `Show ${toggleLabel}`}
          aria-pressed={visible}
          disabled={disabled}
        >
          {visible ? (
            <EyeOff aria-hidden="true" size={20} />
          ) : (
            <Eye aria-hidden="true" size={20} />
          )}
        </button>
      </div>
      {helperText && (
        <small id={helperId} className="auth-help">
          {helperText}
        </small>
      )}
    </div>
  );
}
