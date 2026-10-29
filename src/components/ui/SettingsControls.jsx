import { Check } from "lucide-react";

/**
 * A labelled switch row for the display panel.
 *
 * The whole row is the control, so the target is at least 44px tall and the
 * label is part of the click area. Uses a real checkbox so screen readers and
 * keyboard behave as expected; the visual switch is drawn from that state.
 */
export function SwitchRow({ id, label, hint, checked, onChange, disabled = false }) {
  return (
    <label className={`switch-row${checked ? " is-on" : ""}`} htmlFor={id}>
      <span className="switch-copy">
        <span className="switch-label">{label}</span>
        {hint && <span className="switch-hint">{hint}</span>}
      </span>

      <span className="switch-control" aria-hidden="true">
        <span className="switch-track">
          <span className="switch-thumb" />
        </span>
      </span>

      {/* The input is positioned over the whole row, so the row is the target
          and the visible switch is purely decorative. */}
      <input
        id={id}
        type="checkbox"
        className="switch-input"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
      />
    </label>
  );
}

/**
 * A single-choice row group, drawn as segmented buttons but announced as a
 * radio group.
 */
export function SegmentedChoice({ legend, hint, name, value, options, onChange, disabled = false }) {
  return (
    <fieldset className="choice-group">
      <legend className="choice-legend">{legend}</legend>
      {hint && <p className="choice-hint">{hint}</p>}

      <div className="segmented-options" role="radiogroup" aria-label={legend}>
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className="segmented-option"
              disabled={disabled}
              onClick={() => onChange(option.value)}
            >
              {selected && <Check size={15} aria-hidden="true" />}
              {option.label}
            </button>
          );
        })}
      </div>
      {/* Hidden native radios keep form semantics for assistive tech. */}
      <span className="visually-hidden">
        {options.map((option) => (
          <input
            key={option.value}
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            disabled={disabled}
            tabIndex={-1}
            aria-hidden="true"
          />
        ))}
      </span>
    </fieldset>
  );
}
