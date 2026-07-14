import js from "@eslint/js"
import vue from "eslint-plugin-vue"
import globals from "globals"
import ts from "typescript-eslint"

export default ts.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "ui-laws/**",
      "*.tsbuildinfo",
      "coverage/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  // "essential" = correctness rules (undefined template refs, key misuse,
  // v-model errors) without the stylistic churn of the recommended tier.
  ...vue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: ts.parser } },
    rules: {
      // `<\/script>` inside snippet template literals is required in SFCs —
      // an unescaped closer would terminate the <script> block itself.
      "no-useless-escape": "off",
      // Module-level instance counters (`++uid` in setup) are read by the
      // NEXT component instance — the rule can't see across setup() runs.
      "no-useless-assignment": "off",
    },
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    rules: {
      // TypeScript owns undefined-symbol checking; no-undef misfires on DOM
      // types (HTMLElement, PointerEvent) in <script setup> blocks.
      "no-undef": "off",
      // Deliberate codebase idiom: `cond ? doA() : doB()` as a statement.
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
  {
    rules: {
      // Single-word names (Canvas, Toolbar, Inspector) are fine in an app.
      "vue/multi-word-component-names": "off",
      // TS already enforces unused checks; keep the escape hatch pragmatic.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // The canvas engine intentionally uses `as never` sentinels and
      // constrained `any` in generic plumbing — don't fight it here.
      "@typescript-eslint/no-explicit-any": "off",
    },
  }
)
