// The site: SolidStart on Vite, prerendered to static files. One alias, the
// app's own source (`build/aliases.ts`); the kit and the other packages are
// imported by name. The build's plugins and its post-build are in `build/`.
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { solidStart } from "@solidjs/start/config"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import { GROUPS } from "./src/pages/docs/groups.ts"
import { ALIASES } from "./build/aliases.ts"
import { siteFacts } from "./build/facts.ts"
import { kitSources } from "./build/kit-sources.ts"
import { runCompiler } from "./build/run-compiler.ts"
import { siteFiles } from "./build/site-files.ts"
import { PLAYER_ROUTE, standaloneScripts } from "./build/standalone.ts"
import { utilityMap } from "./build/utilities.ts"

/** The site's public files. */
const PUBLIC_FILES = fileURLToPath(new URL("./public", import.meta.url))

/** The file a static host serves for an address nothing lives at. */
const MISSING_PAGE = "/404.html"

/** Every docs section's page, from the table the sidebar and the sitemap
 * read: a section is a real file whether or not a link reaches it. */
const DOCS_PAGES = ["/docs", ...GROUPS.flatMap((g) => g.items.map((i) => `/docs/${i.id}`))]

/** Files the pages link to that `build/postbuild.mjs` writes once they
 * stand (it reads the registry off the built Studio): the crawl, which runs
 * before it, leaves them alone, and that script fails without them. */
const MADE_AFTER_THE_PAGES = ["/agent/registry.json"]

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  publicDir: PUBLIC_FILES,
  plugins: [
    siteFacts(),
    solidStart(),
    nitro(),
    tailwindcss(),
    utilityMap(),
    kitSources(),
    runCompiler(),
    siteFiles(),
    standaloneScripts(),
  ],
  resolve: { alias: ALIASES },
  server: { fs: { allow: ["../.."] } },
  nitro: {
    preset: "static",
    // The site's own public files (faces, the trailer, the agent skill).
    publicAssets: [{ dir: PUBLIC_FILES, baseURL: "/" }],
    // Every page a link reaches is a real file, and a link to nothing fails
    // the build. The missing page answers 404, which a prerender does not
    // keep: its one address, a static host's `404.html`, is kept by name.
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: ["/", MISSING_PAGE, PLAYER_ROUTE, ...DOCS_PAGES],
      ignore: MADE_AFTER_THE_PAGES,
    },
    hooks: {
      "prerender:generate"(route) {
        if (route.route === MISSING_PAGE && route.error?.status === 404) delete route.error
      },
    },
  },
})
