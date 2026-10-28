import { describeScaleValue } from "../../lib/levels.js";

const PERSON_ROWS = [
  { key: "reported_diagnosis", label: "Diagnosis, as reported" },
  { key: "vision", label: "Vision" },
  { key: "fatigue", label: "Tiredness" },
];

const ROOM_ROWS = [
  { key: "device", label: "Device" },
  { key: "device_os", label: "System" },
  { key: "screen", label: "Screen" },
  { key: "pointer", label: "Pointing and tapping" },
  { key: "canva_surface", label: "Opens Canva in" },
  { key: "seat", label: "Seat" },
  { key: "who_in_room", label: "Usually in the room" },
];

function display(value) {
  if (value === null || value === undefined || value === "") return "Not given";
  if (value === "app") return "The Canva app";
  if (value === "browser") return "Canva in a web browser";
  return String(value);
}

/**
 * Read-only view of the person and room fields.
 *
 * Used by the supervisor's learner page and by any learner-facing summary, so
 * the wording and the "Not given" fallback are defined once.
 */
export default function PersonRoomSummary({ learner, section = "both" }) {
  if (!learner) return null;

  const showPerson = section === "both" || section === "person";
  const showRoom = section === "both" || section === "room";

  return (
    <div className="person-room-summary">
      {showPerson && (
        <section aria-labelledby="summary-person-heading">
          <h2 id="summary-person-heading">Person</h2>
          <dl className="summary-list">
            {PERSON_ROWS.map((row) => (
              <div key={row.key}>
                <dt>{row.label}</dt>
                <dd>{display(learner[row.key])}</dd>
              </div>
            ))}
            <div>
              <dt>Getting around</dt>
              <dd>{describeScaleValue("gmfcs", learner.gmfcs)}</dd>
            </div>
            <div>
              <dt>Using hands</dt>
              <dd>{describeScaleValue("macs", learner.macs)}</dd>
            </div>
            <div>
              <dt>Communicating</dt>
              <dd>{describeScaleValue("cfcs", learner.cfcs)}</dd>
            </div>
          </dl>
        </section>
      )}

      {showRoom && (
        <section aria-labelledby="summary-room-heading">
          <h2 id="summary-room-heading">Room</h2>
          <dl className="summary-list">
            {ROOM_ROWS.map((row) => (
              <div key={row.key}>
                <dt>{row.label}</dt>
                <dd>{display(learner[row.key])}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
