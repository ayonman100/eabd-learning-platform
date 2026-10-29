import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Guards against the regression where "High contrast" appeared ticked but did
 * nothing, because the hero used hardcoded colours that bypassed the tokens.
 *
 * These read the stylesheet directly. A unit test cannot compute real contrast
 * ratios without a browser, so the checks are structural: every theme must
 * define the same tokens, and no rule may hardcode a colour.
 */

const cssPath = resolve(process.cwd(), "src/index.css");
const css = readFileSync(cssPath, "utf8");

function tokensFor(selector) {
  const start = css.indexOf(selector);
  if (start < 0) return null;

  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const body = css.slice(open + 1, close);

  const tokens = {};
  for (const match of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

const THEMES = [
  ":root {",
  ':root[data-theme="dark"] {',
  ":root.a11y-high-contrast {",
  ':root[data-theme="dark"].a11y-high-contrast {',
];

const HERO_TOKENS = [
  "hero-text",
  "hero-text-muted",
  "hero-eyebrow",
  "hero-accent",
  "hero-scrim-strong",
  "hero-scrim-mid",
  "hero-scrim-soft",
  "hero-button-bg",
  "hero-button-text",
  "hero-button-border",
  "hero-ghost-bg",
  "hero-ghost-border",
  "hero-ghost-hover",
];

describe("theme tokens", () => {
  it("defines every theme block", () => {
    for (const selector of THEMES) {
      expect(tokensFor(selector), `missing block: ${selector}`).not.toBeNull();
    }
  });

  it("defines the hero tokens in every theme", () => {
    for (const selector of THEMES) {
      const tokens = tokensFor(selector);
      for (const token of HERO_TOKENS) {
        expect(
          tokens[token],
          `${selector} is missing --${token}`
        ).toBeTruthy();
      }
    }
  });

  it("makes high contrast visibly different from the default theme", () => {
    const base = tokensFor(":root {");
    const hc = tokensFor(":root.a11y-high-contrast {");

    // The core surfaces must actually change, not just a couple of accents.
    expect(hc["color-background"]).not.toBe(base["color-background"]);
    expect(hc["color-text"]).not.toBe(base["color-text"]);
    expect(hc["color-border"]).not.toBe(base["color-border"]);
    expect(hc["hero-scrim-strong"]).not.toBe(base["hero-scrim-strong"]);
    expect(hc["hero-text"]).not.toBe(base["hero-text"]);
  });

  it("pins high contrast to black on white", () => {
    const hc = tokensFor(":root.a11y-high-contrast {");
    expect(hc["color-text"].toLowerCase()).toBe("#000000");
    expect(hc["color-background"].toLowerCase()).toBe("#ffffff");
  });

  it("keeps dark high contrast black with white text", () => {
    const hcDark = tokensFor(':root[data-theme="dark"].a11y-high-contrast {');
    expect(hcDark["color-text"].toLowerCase()).toBe("#ffffff");
    expect(hcDark["color-background"].toLowerCase()).toBe("#000000");
  });
});

describe("no hardcoded colours in rules", () => {
  it("uses tokens for all colours outside the theme blocks", () => {
    // Strip the four theme blocks, then look for literal colours in rules.
    let remainder = css;
    for (const selector of THEMES) {
      const start = remainder.indexOf(selector);
      if (start < 0) continue;
      const close = remainder.indexOf("}", start);
      remainder = remainder.slice(0, start) + remainder.slice(close + 1);
    }

    const offenders = [...remainder.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g)]
      .map((match) => match[0])
      // Box shadows and the switch thumb are depth, not colour identity.
      .filter((value) => !value.startsWith("rgba(22, 32, 43"))
      .filter((value) => !value.startsWith("rgba(0, 0, 0"))
      .filter((value) => !value.startsWith("rgba(15, 23, 42"));

    expect(offenders, `hardcoded colours found: ${offenders.join(", ")}`).toEqual([]);
  });
});

describe("high contrast hides the hero film", () => {
  it("removes the video element from the layout", () => {
    expect(css).toMatch(
      /:root\.a11y-high-contrast \.home-hero-video\s*\{\s*display:\s*none;/
    );
  });

  it("replaces the scrim gradient with a flat surface", () => {
    expect(css).toMatch(
      /:root\.a11y-high-contrast \.home-hero-scrim\s*\{\s*background:\s*var\(--hero-scrim-strong\);/
    );
  });
});
