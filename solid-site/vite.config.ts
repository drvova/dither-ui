// The Solid site: SolidStart on Vite, prerendered to static files. It
// builds beside the Vue site (`../src`, `../rstack.config.ts`) while the
// kit and the pages move over, then takes its place. One alias table: the
// kit's Solid layer, the engine, and the site's framework-free modules.
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { solidStart } from "@solidjs/start/config"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import { GROUPS } from "../src/pages/docs/groups.ts"
import { ALIASES, ONE_SOLID } from "./aliases.ts"
import { kitSources } from "./kit-sources.ts"
import { runCompiler } from "./run-compiler.ts"
import { siteFiles } from "./site-files.ts"
import { PLAYER_ROUTE, standaloneScripts } from "./standalone.ts"
import { utilityMap } from "./utilities.ts"

/** The site's public files, shared with the Vue site. */
const PUBLIC_FILES = fileURLToPath(new URL("../public", import.meta.url))

/** The file a static host serves for an address nothing lives at. */
const MISSING_PAGE = "/404.html"

/** Every docs section's page, from the table the sidebar and the sitemap
 * read: a section is a real file whether or not a link reaches it. */
const DOCS_PAGES = ["/docs", ...GROUPS.flatMap((g) => g.items.map((i) => `/docs/${i.id}`))]

/** Routes and build files still made only by the Vue site. */
const NOT_YET_PORTED: string[] = []

/** Files the pages link to that `scripts/postbuild.mjs` writes once they
 * stand (it reads the registry off the built Studio): the crawl, which runs
 * before it, leaves them alone, and that script fails without them. */
const MADE_AFTER_THE_PAGES = ["/agent/registry.json"]

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  publicDir: PUBLIC_FILES,
  plugins: [
    solidStart(),
    nitro(),
    tailwindcss(),
    utilityMap(),
    kitSources(),
    runCompiler(),
    siteFiles(),
    standaloneScripts(),
  ],
  resolve: { alias: ALIASES, dedupe: ONE_SOLID },
  server: { fs: { allow: [".."] } },
  nitro: {
    preset: "static",
    // The site's own public files (faces, the trailer, the agent skill),
    // shared with the Vue site until the cutover.
    publicAssets: [{ dir: PUBLIC_FILES, baseURL: "/" }],
    // Every page a link reaches is a real file, and a link to nothing fails
    // the build. The missing page answers 404, which a prerender does not
    // keep: its one address, a static host's `404.html`, is kept by name.
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: ["/", MISSING_PAGE, PLAYER_ROUTE, ...DOCS_PAGES],
      // Pages the landing links to that have not moved over yet: the crawl
      // leaves them alone until their routes exist (then each line goes).
      ignore: [...NOT_YET_PORTED, ...MADE_AFTER_THE_PAGES],
    },
    hooks: {
      "prerender:generate"(route) {
        if (route.route === MISSING_PAGE && route.error?.status === 404) delete route.error
      },
    },
  },
})
