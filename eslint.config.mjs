import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "supabase/functions/**",
      "**/*.ts",
      "**/*.tsx",
    ],
  },
  js.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  reactRefresh.configs.vite,
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    plugins: {
      react,
    },
    rules: {
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["error", { allow: ["error", "warn"] }],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },
  {
    // Test files run in Node (or jsdom on top of it) and may read files.
    files: ["**/*.test.{js,jsx}", "vitest.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.js", "eslint.config.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
    },
  },
  {
    // These two React Compiler rules flag ordinary fetch-on-mount and
    // "sync a form once the record arrives" patterns. Both are intentional
    // here and are the reason a page cannot render before its data is ready,
    // so the compiler-driven rewrites they suggest are not wanted.
    files: ["src/**/*.{js,jsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  {
    // Context modules intentionally export the provider component and its hook
    // together, so the pair cannot drift apart.
    files: ["src/context/**/*.jsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
];
