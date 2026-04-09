import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

/**
 * ESLint flat config — Next.js 16 + Airbnb-style rules + Prettier
 *
 * Why no FlatCompat + eslint-config-airbnb?
 * Next.js 16 ships eslint-config-next as native flat config and pre-registers
 * the jsx-a11y, react, react-hooks, and import plugins. FlatCompat also
 * registers those same plugins when converting the legacy Airbnb config,
 * causing ESLint v9 to throw "Cannot redefine plugin". The solution is to
 * use Next.js as the base (which already includes all those plugins) and
 * layer the Airbnb rules we care about directly in the rules block.
 */
const eslintConfig = defineConfig([
  // ── Base: Next.js (includes @typescript-eslint, react, react-hooks,
  //         jsx-a11y, import, @next/next plugins)
  ...nextVitals,
  ...nextTs,

  // ── Airbnb-style rules + project overrides ──────────────────────────────
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      // --- Variables ---
      "no-var": "error",
      "prefer-const": "error",
      "no-unused-vars": "off", // delegated to @typescript-eslint below
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-use-before-define": "off",
      "@typescript-eslint/no-use-before-define": ["error", { functions: false, classes: true }],

      // --- Console / debugging ---
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",

      // --- Functions ---
      "prefer-arrow-callback": "error",
      "arrow-body-style": ["error", "as-needed"],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],

      // --- Imports ---
      "import/prefer-default-export": "off", // named exports are idiomatic in App Router
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: ["**/*.config.*", "**/*.test.*", "**/*.spec.*", "**/test/**"],
        },
      ],
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      // --- React ---
      "react/react-in-jsx-scope": "off", // not needed with React 17+ JSX transform
      "react/jsx-filename-extension": ["warn", { extensions: [".tsx"] }],
      "react/jsx-props-no-spreading": "off", // common in Next.js layouts/pages
      "react/prop-types": "off", // TypeScript covers this
      "react/require-default-props": "off", // TypeScript covers this
      "react/function-component-definition": [
        "error",
        { namedComponents: "function-declaration", unnamedComponents: "arrow-function" },
      ],

      // --- Accessibility ---
      "jsx-a11y/anchor-is-valid": [
        "error",
        {
          components: ["Link"],
          specialLink: ["hrefLeft", "hrefRight"],
          aspects: ["invalidHref", "preferButton"],
        },
      ],
    },
  },

  // ── Prettier: disables style rules that conflict, then enforces formatting
  prettierConfig,
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      "prettier/prettier": "error",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "postcss.config.mjs",
  ]),
]);

export default eslintConfig;
