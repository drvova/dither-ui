// The root toolchain in one file, run through the Rstack CLI (`rs`): the
// tests of the framework-free code (Rstest: `rs test`), the lint (Rslint:
// `rs lint`) and the formatter (`rs fmt`). The site itself is `solid-site/`,
// on Vite with its own config.
// Guide: https://rstack.rs/guide/configuration
import { resolve } from "node:path"
import { define } from "rstack"
import { utilityMap } from "./src/shared/lib/utility-map.ts"

const root = import.meta.dirname
const at = (path: string) => resolve(root, path)

define.test({
  include: ["tests/**/*.spec.ts"],
  // A spec that needs a DOM opts into jsdom per file (`// @rstest-environment
  // jsdom` docblock).
  testEnvironment: "node",
  setupFiles: ["./tests/setup.ts"],
  // The utility map the styling rewriter reads (`virtual-dither-utilities`).
  plugins: [utilityMap(root)],
  // `@dither-kit` is the engine's public API here (nothing at the root
  // renders a component); `@dither-kit/<layer>/…` any kit file.
  resolve: {
    alias: { "@": at("src"), "@dither-kit$": at("dither-kit/engine/api.ts"), "@dither-kit": at("dither-kit") },
  },
})

/* Rslint lints the TypeScript and JavaScript, the Solid site's and the
   kit's `.tsx` included. */
define.lint(({ js, ts }) => [
  {
    ignores: [
      "dist/**",
      // the Solid site's build output (Nitro's and Vite's)
      "solid-site/.output/**",
      "solid-site/.nitro/**",
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
    "public/**",
    "**/*.md",
    "*/index.html",
    "solid-site/scripts/og-shell.html",
    ".scratch/**",
    ".claude/**",
    "**/*.svelte",
    "solid-site/.output/**",
    "solid-site/.nitro/**",
  ],
})
