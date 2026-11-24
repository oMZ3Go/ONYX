import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    ".next/**",
    ".cache/**",
    "out/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["experiments/canvas-engine/**/*.{js,jsx,mjs}"],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: Object.fromEntries(
        [
          "fetch",
          "URLSearchParams",
          "window",
          "document",
          "FontFace",
          "Image",
          "FileReader",
          "URL",
          "Blob",
          "XMLSerializer",
          "DOMPoint",
          "requestAnimationFrame",
          "location",
          "performance",
          "crypto",
        ].map((name) => [name, "readonly"]),
      ),
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended],
  },
]);
