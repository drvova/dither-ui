// The Solid site: SolidStart on Vite, prerendered to static files. It
// builds beside the Vue site (`../src`, `../rstack.config.ts`) while the
// kit and the pages move over, then takes its place. One alias table: the
// kit's Solid layer, the engine, and the site's framework-free modules.
import tailwindcss from "@tailwindcss/vite"
import { solidStart } from "@solidjs/start/config"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import { ALIASES, ONE_SOLID } from "./aliases.ts"
import { utilityMap } from "./utilities.ts"

/** The file a static host serves for an address nothing lives at. */
const MISSING_PAGE = "/404.html"

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [solidStart(), nitro(), tailwindcss(), utilityMap()],
  resolve: { alias: ALIASES, dedupe: ONE_SOLID },
  server: { fs: { allow: [".."] } },
  nitro: {
    preset: "static",
    // Every page a link reaches is a real file, and a link to nothing fails
    // the build. The missing page answers 404, which a prerender does not
    // keep: its one address, a static host's `404.html`, is kept by name.
    prerender: { crawlLinks: true, failOnError: true, routes: ["/", MISSING_PAGE] },
    hooks: {
      "prerender:generate"(route) {
        if (route.route === MISSING_PAGE && route.error?.status === 404) delete route.error
      },
    },
  },
})
