import { describe, expect, it } from "vitest";
import {
  FUNCTION_SCALES,
  NOT_SURE,
  describeScaleValue,
  optionToScaleValue,
  scaleValueToOption,
} from "./levels.js";

describe("function scales", () => {
  it("covers getting around, using hands, and communicating", () => {
    expect(FUNCTION_SCALES.map((scale) => scale.key)).toEqual([
      "gmfcs",
      "macs",
      "cfcs",
    ]);
  });

  it("gives every scale five word pictures", () => {
    for (const scale of FUNCTION_SCALES) {
      expect(scale.options).toHaveLength(5);
      expect(scale.options.map((option) => option.value)).toEqual([
        1, 2, 3, 4, 5,
      ]);
    }
  });
});

describe("scale conversion", () => {
  it("keeps a stored level as the selected option", () => {
    expect(scaleValueToOption(3)).toBe("3");
  });

  it("shows not sure for an empty value", () => {
    expect(scaleValueToOption(null)).toBe(NOT_SURE);
    expect(scaleValueToOption(undefined)).toBe(NOT_SURE);
    expect(scaleValueToOption("")).toBe(NOT_SURE);
  });

  it("stores null when not sure is chosen", () => {
    expect(optionToScaleValue(NOT_SURE)).toBeNull();
    expect(optionToScaleValue("")).toBeNull();
  });

  it("stores a number for a chosen level", () => {
    expect(optionToScaleValue("4")).toBe(4);
  });

  it("round trips a level", () => {
    expect(optionToScaleValue(scaleValueToOption(2))).toBe(2);
  });
});

describe("describeScaleValue", () => {
  it("names the level and its word picture", () => {
    expect(describeScaleValue("macs", 3)).toBe(
      "Level 3: Handles objects with difficulty, needs help to prepare or modify activities"
    );
  });

  it("says not sure when the level is missing", () => {
    expect(describeScaleValue("gmfcs", null)).toBe("Not sure");
  });

  it("returns nothing for an unknown scale", () => {
    expect(describeScaleValue("unknown", 1)).toBe("");
  });
});
