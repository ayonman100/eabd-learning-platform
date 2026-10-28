export const ONBOARDING_STEPS = [
  { key: "who", label: "Who this record is for" },
  { key: "document", label: "A document, if you have one" },
  { key: "confirm", label: "Check suggested answers" },
  { key: "person", label: "What you can do" },
  { key: "room", label: "Your room and equipment" },
  { key: "goals", label: "Your goal" },
  { key: "display", label: "Your display" },
];

export function stepIndex(stepKey) {
  const index = ONBOARDING_STEPS.findIndex((step) => step.key === stepKey);
  return index === -1 ? 0 : index;
}
