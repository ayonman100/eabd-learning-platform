import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * A disclosure panel for a section that is long enough to collapse: a pathway
 * week, a profile group, a help section.
 *
 * Built on a real button with aria-expanded and aria-controls, so it works with
 * a keyboard and is announced correctly. The summary stays visible when closed,
 * which is the point: a learner scans weeks without scrolling past every task.
 */
export default function CollapsiblePanel({
  title,
  summary,
  leading,
  status,
  meta,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  id,
}) {
  const generatedId = useId();
  const panelId = `${id ?? generatedId}-panel`;
  const buttonId = `${id ?? generatedId}-button`;

  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  function toggle() {
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <div className={`panel${open ? " panel-open" : ""}`}>
      <h3 className="panel-heading">
        <button
          type="button"
          id={buttonId}
          className="panel-trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggle}
        >
          {leading && <span className="panel-leading">{leading}</span>}

          <span className="panel-titles">
            <span className="panel-title">{title}</span>
            {summary && <span className="panel-summary">{summary}</span>}
          </span>

          <span className="panel-meta">
            {status}
            {meta && <span className="panel-count">{meta}</span>}
          </span>

          <ChevronDown
            className="panel-chevron"
            size={20}
            aria-hidden="true"
          />
        </button>
      </h3>

      {open && (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="panel-body">
          {children}
        </div>
      )}
    </div>
  );
}
