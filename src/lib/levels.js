/**
 * Word pictures for the function classification scales.
 *
 * These are the questions the person answers about what they can do, not
 * clinical labels. Every scale allows "Not sure", which stores null.
 */

export const FUNCTION_SCALES = [
  {
    key: "gmfcs",
    label: "Getting around",
    question: "Which of these sounds most like how you move around?",
    options: [
      { value: 1, label: "Walks without limitations" },
      { value: 2, label: "Walks with limitations" },
      { value: 3, label: "Walks using a hand-held mobility device" },
      {
        value: 4,
        label: "Self-mobility with limitations, may use powered mobility",
      },
      { value: 5, label: "Transported in a manual wheelchair" },
    ],
  },
  {
    key: "macs",
    label: "Using your hands",
    question: "Which of these sounds most like how you handle objects?",
    options: [
      { value: 1, label: "Handles objects easily and successfully" },
      {
        value: 2,
        label: "Handles most objects, with somewhat reduced quality or speed",
      },
      {
        value: 3,
        label: "Handles objects with difficulty, needs help to prepare or modify activities",
      },
      {
        value: 4,
        label: "Handles a limited selection of easily managed objects in adapted situations",
      },
      { value: 5, label: "Does not handle objects" },
    ],
  },
  {
    key: "cfcs",
    label: "Communicating",
    question: "Which of these sounds most like how you communicate?",
    options: [
      {
        value: 1,
        label: "Effective sender and receiver with unfamiliar and familiar partners",
      },
      {
        value: 2,
        label: "Effective but slower with unfamiliar or familiar partners",
      },
      { value: 3, label: "Effective with familiar partners" },
      { value: 4, label: "Inconsistent with familiar partners" },
      { value: 5, label: "Seldom effective even with familiar partners" },
    ],
  },
];

export const NOT_SURE = "not-sure";

/**
 * Converts a stored value into the radio value used by the form.
 */
export function scaleValueToOption(value) {
  if (value === null || value === undefined || value === "") return NOT_SURE;
  return String(value);
}

/**
 * Converts a chosen radio value back to the number stored in the database.
 */
export function optionToScaleValue(option) {
  if (option === NOT_SURE || option === "" || option === null) return null;
  const parsed = Number.parseInt(option, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * The readable label for a stored level, used in read-only summaries.
 */
export function describeScaleValue(key, value) {
  const scale = FUNCTION_SCALES.find((item) => item.key === key);
  if (!scale) return "";
  if (value === null || value === undefined) return "Not sure";

  const option = scale.options.find((item) => item.value === Number(value));
  return option ? `Level ${option.value}: ${option.label}` : "Not sure";
}
