import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  deriveAdaptations,
  resolveSettings,
} from "./adaptations.js";

const adaeze = {
  reported_diagnosis: "Cerebral palsy",
  macs: 2,
  pointer: "One finger",
  vision: "Glasses for close work",
  fatigue: "Tires after about 30 minutes",
};

const chinedu = {
  reported_diagnosis: "Cerebral palsy as reported",
  macs: 3,
  pointer: "Finger. Pinch to select fails.",
};

const fatima = {
  reported_diagnosis: "Cerebral palsy as reported",
  macs: 1,
};

describe("deriveAdaptations", () => {
  it("keeps standard targets for a person who manages most objects", () => {
    const derived = deriveAdaptations(adaeze);
    expect(derived.targetSize).toBe("standard");
    expect(derived.highContrast).toBe(false);
    expect(derived.extraTime).toBe(true);
  });

  it("raises target size and spacing when handling objects is difficult", () => {
    const derived = deriveAdaptations(chinedu);
    expect(derived.targetSize).toBe("large");
    expect(derived.extraSpacing).toBe(true);
  });

  it("does not change the screen for a diagnosis alone", () => {
    const derived = deriveAdaptations(fatima);
    expect(derived.targetSize).toBe("standard");
    expect(derived.oneThingAtATime).toBe(false);
    expect(derived.highContrast).toBe(false);
  });

  it("uses the largest targets and one step at a time at MACS 4 or 5", () => {
    const derived = deriveAdaptations({ macs: 4 });
    expect(derived.targetSize).toBe("extra-large");
    expect(derived.oneThingAtATime).toBe(true);
    expect(derived.extraSpacing).toBe(true);
  });

  it("reacts to a pointer description that mentions pinch or a switch", () => {
    expect(deriveAdaptations({ pointer: "Uses a switch" }).targetSize).toBe(
      "large"
    );
    expect(deriveAdaptations({ pointer: "PINCH fails" }).targetSize).toBe(
      "large"
    );
  });

  it("never lowers a target size set by another rule", () => {
    const derived = deriveAdaptations({ macs: 5, pointer: "Mouse" });
    expect(derived.targetSize).toBe("extra-large");
  });

  it("responds to low vision and glare", () => {
    const derived = deriveAdaptations({ vision: "Low vision, glare is hard" });
    expect(derived.textSize).toBe("large");
    expect(derived.highContrast).toBe(true);
  });

  it("adds one thing at a time for communication support needs", () => {
    expect(deriveAdaptations({ cfcs: 3 }).oneThingAtATime).toBe(true);
    expect(deriveAdaptations({ cfcs: 2 }).oneThingAtATime).toBe(false);
  });

  it("adds extra time whenever fatigue is described", () => {
    expect(deriveAdaptations({ fatigue: "Needs a break" }).extraTime).toBe(true);
    expect(deriveAdaptations({ fatigue: "" }).extraTime).toBe(false);
  });

  it("starts from the default settings for an empty record", () => {
    expect(deriveAdaptations(null)).toEqual(DEFAULT_SETTINGS);
    expect(deriveAdaptations({})).toEqual(DEFAULT_SETTINGS);
  });
});

describe("resolveSettings", () => {
  it("lets a person's own choice beat a derived setting", () => {
    const derived = { ...DEFAULT_SETTINGS, targetSize: "large" };
    const resolved = resolveSettings(derived, { targetSize: "standard" });
    expect(resolved.targetSize).toBe("standard");
  });

  it("keeps derived values that were not overridden", () => {
    const derived = { ...DEFAULT_SETTINGS, extraSpacing: true };
    const resolved = resolveSettings(derived, { targetSize: "large" });
    expect(resolved.extraSpacing).toBe(true);
    expect(resolved.targetSize).toBe("large");
  });

  it("returns the derived settings when there are no overrides", () => {
    const derived = { ...DEFAULT_SETTINGS, textSize: "large" };
    expect(resolveSettings(derived, {})).toEqual(derived);
    expect(resolveSettings(derived, null)).toEqual(derived);
  });
});
