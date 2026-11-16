// The site's component specs (`tests/site/`), in jsdom with Solid's browser
// build. The framework-free specs beside them (`tests/*.spec.ts`) run with
// `rs test` at the workspace root; the kit's component specs are the kit's.
import solid from "vite-plugin-solid"
import { defineConfig } from "vitest/config"
import { ALIASES } from "./build/aliases.ts"
import { exampleCatalog } from "./build/catalog.ts"
import { siteFacts } from "./build/facts.ts"
import { kitSources } from "./build/kit-sources.ts"
import { kitProps } from "./build/props.ts"
import { utilityMap } from "./build/utilities.ts"

/** SolidStart's manifest module, which only its own plugin serves: an
 * island reads its chunk's stylesheets from it on a server, and in a
 * browser (these specs) renders as a lazy part, reading none. */
const startManifest = {
  name: "solid-start-manifest",
  resolveId: (id: string) => (id === "solid-start:get-manifest" ? "\0solid-start-manifest" : undefined),
  load: (id: string) =>
    id === "\0solid-start-manifest" ? "export const getManifest = () => ({ getAssets: async () => [] })" : undefined,
}

export default defineConfig({
  plugins: [siteFacts(), kitProps(), exampleCatalog(), solid(), utilityMap(), kitSources(), startManifest],
  resolve: { alias: ALIASES, conditions: ["development", "browser"] },
  test: { environment: "jsdom", include: ["tests/site/**/*.spec.{ts,tsx}"] },
})
