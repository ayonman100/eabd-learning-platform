export const ONBOARDING_STEPS = [
  { key: "who", label: "Who", hint: "Whose record this is" },
  { key: "document", label: "Document", hint: "Optional report" },
  { key: "confirm", label: "Confirm", hint: "Check suggestions" },
  { key: "person", label: "Person", hint: "What they can do" },
  { key: "room", label: "Room", hint: "Device and setting" },
  { key: "goals", label: "Goals", hint: "What they want" },
  { key: "display", label: "Display", hint: "How it looks" },
];

export function stepIndex(stepKey) {
  const index = ONBOARDING_STEPS.findIndex((step) => step.key === stepKey);
  return index === -1 ? 0 : index;
}
