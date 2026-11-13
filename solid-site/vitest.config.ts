// The Solid kit's component specs (`tests/*.spec.tsx`) and the site's
// (`tests/site/`), in jsdom with Solid's browser build. The framework-free
// specs run with `rs test` at the root.
import solid from "vite-plugin-solid"
import { defineConfig } from "vitest/config"
import { ALIASES, ONE_SOLID } from "./aliases.ts"
import { kitSources } from "./kit-sources.ts"
import { utilityMap } from "./utilities.ts"

export default defineConfig({
  plugins: [solid(), utilityMap(), kitSources()],
  resolve: { alias: ALIASES, dedupe: ONE_SOLID, conditions: ["development", "browser"] },
  test: { environment: "jsdom", include: ["tests/**/*.spec.{ts,tsx}"] },
})
