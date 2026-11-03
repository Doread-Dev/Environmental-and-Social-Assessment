const js = require("@eslint/js");
const globals = require("globals");
const prettier = require("eslint-config-prettier");

module.exports = [
  { ignores: ["node_modules/", "uploads/", "exports/"] },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^(_|next$|req$|res$)" }],
    },
  },
  {
    files: ["tests/**/*.js", "**/*.mjs"],
    languageOptions: { sourceType: "module" },
  },
  prettier,
];
