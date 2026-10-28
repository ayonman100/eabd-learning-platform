import { describe, expect, it } from "vitest";
import { formatPasskeyDate, passkeyErrorMessage } from "./passkeys.js";

describe("passkeyErrorMessage", () => {
  it("explains a cancelled ceremony", () => {
    expect(passkeyErrorMessage({ name: "NotAllowedError" })).toBe(
      "The face or fingerprint check was cancelled or timed out. Try again when you are ready."
    );
  });

  it("treats an aborted ceremony code as cancelled", () => {
    expect(passkeyErrorMessage({ code: "ERROR_CEREMONY_ABORTED" })).toBe(
      "The face or fingerprint check was cancelled or timed out. Try again when you are ready."
    );
  });

  it("explains a device that is already registered", () => {
    expect(
      passkeyErrorMessage({ code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED" })
    ).toBe("This device is already set up for face or fingerprint sign-in.");
  });

  it("explains an expired challenge", () => {
    expect(passkeyErrorMessage({ code: "webauthn_challenge_expired" })).toBe(
      "That took too long. Please try again."
    );
  });

  it("falls back to the provider message when it is known", () => {
    expect(passkeyErrorMessage({ message: "Something specific" })).toBe(
      "Something specific"
    );
  });

  it("falls back to a plain sentence without a message", () => {
    expect(passkeyErrorMessage(null)).toBe(
      "Face or fingerprint sign-in didn't work. Please try again."
    );
  });
});

describe("formatPasskeyDate", () => {
  it("returns an empty string for a missing date", () => {
    expect(formatPasskeyDate("")).toBe("");
    expect(formatPasskeyDate(null)).toBe("");
  });

  it("formats a valid timestamp with a year", () => {
    const formatted = formatPasskeyDate("2026-03-04T10:00:00.000Z");
    expect(formatted).toContain("2026");
    expect(formatted.length).toBeGreaterThan(4);
  });
});
