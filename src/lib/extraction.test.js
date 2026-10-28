import { describe, expect, it } from "vitest";
import {
  EXTRACTABLE_FIELDS,
  acceptedFieldValues,
  validateExtraction,
} from "./extraction.js";

const sample = {
  fields: {
    reported_diagnosis: {
      value: "Spastic diplegic cerebral palsy",
      evidence: "Diagnosis: spastic diplegic cerebral palsy",
    },
    gmfcs: { value: 3, evidence: "GMFCS level III" },
    macs: null,
    cfcs: null,
    vision: null,
    fatigue: {
      value: "Tires after about 20 minutes of fine motor work",
      evidence: "Fatigues after 20 minutes",
    },
    support: {
      value: "Larger touch targets; extra time",
      evidence: "Recommendations: larger targets",
    },
  },
};

describe("validateExtraction", () => {
  it("accepts the documented sample", () => {
    const result = validateExtraction(sample);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.fields.gmfcs).toEqual({ value: 3, evidence: "GMFCS level III" });
  });

  it("treats a missing key as not suggested", () => {
    const result = validateExtraction({ fields: { vision: null } });
    expect(result.ok).toBe(true);
    for (const key of EXTRACTABLE_FIELDS) {
      if (key === "vision") continue;
      expect(result.fields[key]).toBeNull();
    }
  });

  it("rejects an unknown key", () => {
    const result = validateExtraction({
      fields: { diagnosis_code: { value: "G80", evidence: "G80" } },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("diagnosis_code");
  });

  it("rejects a level outside 1 to 5", () => {
    const result = validateExtraction({
      fields: { gmfcs: { value: 6, evidence: "GMFCS level VI" } },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("1 to 5");
  });

  it("rejects a fractional level", () => {
    const result = validateExtraction({
      fields: { macs: { value: 2.5, evidence: "MACS II-III" } },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a value with no evidence", () => {
    const result = validateExtraction({
      fields: { support: { value: "Extra time", evidence: "" } },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("quote");
  });

  it("rejects a field that is a bare value instead of an object", () => {
    const result = validateExtraction({ fields: { vision: "Low vision" } });
    expect(result.ok).toBe(false);
  });

  it("rejects a payload that is not an object", () => {
    expect(validateExtraction(null).ok).toBe(false);
    expect(validateExtraction("text").ok).toBe(false);
  });

  it("accepts a flat payload without the fields wrapper", () => {
    const result = validateExtraction({
      vision: { value: "Low vision", evidence: "Reports low vision" },
    });
    expect(result.ok).toBe(true);
    expect(result.fields.vision.value).toBe("Low vision");
  });
});

describe("acceptedFieldValues", () => {
  it("keeps only the accepted fields", () => {
    const { fields } = validateExtraction(sample);
    const values = acceptedFieldValues(fields, ["macs", "gmfcs"]);
    expect(values).toEqual({ gmfcs: 3 });
  });
});
