// The Solid kit's component specs (`tests/*.spec.tsx`), in jsdom with
// Solid's browser build. The framework-free specs stay with `rs test` at
// the root until the cutover.
import solid from "vite-plugin-solid"
import { defineConfig } from "vitest/config"
import { ALIASES, ONE_SOLID } from "./aliases.ts"
import { utilityMap } from "./utilities.ts"

export default defineConfig({
  plugins: [solid(), utilityMap()],
  resolve: { alias: ALIASES, dedupe: ONE_SOLID, conditions: ["development", "browser"] },
  test: { environment: "jsdom", include: ["tests/**/*.spec.{ts,tsx}"] },
})
