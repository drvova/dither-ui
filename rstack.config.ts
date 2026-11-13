// The workspace's toolchain in one file, run through the Rstack CLI (`rs`):
// the framework-free specs of every package (Rstest: `rs test`, each
// package's `tests/*.spec.ts` and the workspace's own in `tests/`), the lint
// (Rslint: `rs lint`) and the formatter (`rs fmt`). The specs that render a
// component run on Vitest in their package (`packages/dither-kit`,
// `packages/site`); the site builds on Vite with its own config.
// Guide: https://rstack.rs/guide/configuration
import { resolve } from "node:path"
import { define } from "rstack"
import { utilityMap } from "@dither-ui/restyle/utility-map"
import { UTILITY_SOURCES } from "./packages/site/build/utility-sources.ts"

const root = import.meta.dirname
const at = (path: string) => resolve(root, path)

define.test({
  include: ["tests/*.spec.ts", "packages/*/tests/*.spec.ts"],
  // A spec that needs a DOM opts into jsdom per file (`// @rstest-environment
  // jsdom` docblock).
  testEnvironment: "node",
  setupFiles: ["./packages/dither-kit/tests/support/setup.ts"],
  // The utility map the styling rewriter reads (`virtual-dither-utilities`),
  // compiled from the vocabulary the site's build compiles it from.
  plugins: [utilityMap(UTILITY_SOURCES)],
  // The site's one alias, for its own specs; packages name each other.
  resolve: { alias: { "@": at("packages/site/src") } },
})

/* Rslint lints the TypeScript and JavaScript of every package, the site's
   and the kit's `.tsx` included. */
define.lint(({ js, ts }) => [
  {
    ignores: [
      "dist/**",
      // the site's build output (Nitro's and Vite's)
      "packages/site/.output/**",
      "packages/site/.nitro/**",
      "node_modules/**",
      "**/node_modules/**",
      "ui-laws/**",
      // local scratch tooling (bake scripts, one-shot verifiers) — not
      // product source, and CJS require() there is intentional.
      ".scratch/**",
      // agent worktrees: whole checkouts of the repo, not more source.
      ".claude/**",
      // gitignored local material that CI's checkout never contains — the
      // lint surface must match CI or the local gate lies.
      "ghostai-ref/**",
      ".rpiv/**",
      "coverage/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    rules: {
      // TypeScript owns undefined-symbol checking.
      "no-undef": "off",
      // Deliberate codebase idiom: `cond ? doA() : doB()` as a statement.
      "@typescript-eslint/no-unused-expressions": "off",
      // TS already enforces unused checks; keep the escape hatch pragmatic.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // The canvas engine intentionally uses `as never` sentinels and
      // constrained `any` in generic plumbing.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
])

/* `rs fmt` (Prettier options): the house style — no semicolons, double
   quotes, trailing commas, 120 columns. Hand-wrapped prose (Markdown), the
   HTML shells, public assets and local scratch stay as they are. */
define.fmt({
  semi: false,
  printWidth: 120,
  ignorePatterns: [
    "packages/site/public/**",
    "**/*.md",
    "packages/site/build/og-shell.html",
    ".scratch/**",
    ".claude/**",
    "packages/site/.output/**",
    "packages/site/.nitro/**",
  ],
})
