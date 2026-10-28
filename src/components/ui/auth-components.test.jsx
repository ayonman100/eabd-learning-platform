import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PasswordField from "./PasswordField.jsx";
import { ErrorMessage, StatusMessage } from "./StatusBanner.jsx";

describe("PasswordField", () => {
  const baseProps = {
    id: "password",
    name: "password",
    label: "Password",
    value: "",
    onChange: () => {},
  };

  it("renders a labelled password input with a toggle", () => {
    const html = renderToStaticMarkup(createElement(PasswordField, baseProps));

    expect(html).toContain('<label for="password">Password</label>');
    expect(html).toContain('type="password"');
    expect(html).toContain('aria-label="Show password"');
    expect(html).toContain('aria-pressed="false"');
  });

  it("hides the toggle state from assistive technology when pressed", () => {
    const html = renderToStaticMarkup(
      createElement(PasswordField, { ...baseProps, toggleLabel: "password confirmation" })
    );

    expect(html).toContain('aria-label="Show password confirmation"');
  });

  it("links helper text through aria-describedby when provided", () => {
    const html = renderToStaticMarkup(
      createElement(PasswordField, {
        ...baseProps,
        helperId: "password-help",
        helperText: "Use at least 8 characters.",
      })
    );

    expect(html).toContain('aria-describedby="password-help"');
    expect(html).toContain('id="password-help"');
    expect(html).toContain("Use at least 8 characters.");
  });
});

describe("StatusBanner", () => {
  it("renders nothing when empty", () => {
    expect(renderToStaticMarkup(createElement(StatusMessage, null, ""))).toBe("");
    expect(renderToStaticMarkup(createElement(ErrorMessage, null, ""))).toBe("");
  });

  it("announces a status without interrupting", () => {
    const html = renderToStaticMarkup(
      createElement(StatusMessage, null, "Saved in this browser.")
    );

    expect(html).toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });

  it("announces an error assertively", () => {
    const html = renderToStaticMarkup(
      createElement(ErrorMessage, null, "Passwords do not match.")
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Passwords do not match.");
  });
});
