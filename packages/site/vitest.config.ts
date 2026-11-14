// The site's component specs (`tests/site/`), in jsdom with Solid's browser
// build. The framework-free specs beside them (`tests/*.spec.ts`) run with
// `rs test` at the workspace root; the kit's component specs are the kit's.
import solid from "vite-plugin-solid"
import { defineConfig } from "vitest/config"
import { ALIASES } from "./build/aliases.ts"
import { siteFacts } from "./build/facts.ts"
import { kitSources } from "./build/kit-sources.ts"
import { kitProps } from "./build/props.ts"
import { utilityMap } from "./build/utilities.ts"

export default defineConfig({
  plugins: [siteFacts(), kitProps(), solid(), utilityMap(), kitSources()],
  resolve: { alias: ALIASES, conditions: ["development", "browser"] },
  test: { environment: "jsdom", include: ["tests/site/**/*.spec.{ts,tsx}"] },
})
