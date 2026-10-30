// The whole toolchain in one file, run through the Rstack CLI (`rs`): the app
// (Rsbuild: `rs dev`, `rs build`, `rs preview`), the tests (Rstest:
// `rs test`), the lint (Rslint: `rs lint`) and the formatter (`rs fmt`).
// Guide: https://rstack.rs/guide/configuration
import { resolve, sep } from "node:path"
import { define } from "rstack"
import type { RsbuildPlugin } from "rstack/app"
import { PAGE_END_ID, PAGE_REVEAL_SCRIPT } from "./src/app/page-reveal.ts"

const root = import.meta.dirname
const at = (path: string) => resolve(root, path)

/* The routes. An entry's name is its HTML's path in dist, so the canonical
   URLs (`/`, `/docs/`, `/studio/`, `/play/`) are plain directories. */
const SITE_MAIN = "src/app/main.ts"
const PAGES: Record<string, { html: string; main: string }> = {
  index: { html: "index.html", main: SITE_MAIN },
  "docs/index": { html: "docs/index.html", main: SITE_MAIN },
  "studio/index": { html: "studio/index.html", main: SITE_MAIN },
  "play/index": { html: "play/index.html", main: "src/pages/play/main.ts" },
}

/* The docs deep links are the site's indexable surface beyond the route
   entries. All three crawler files (sitemap, robots, llms.txt) are generated
   from the same GROUPS/SITE_URL sources the app renders — new sections are
   never hand-registered, and a dead reference fails the build. Emitted as
   assets of the web build only (tests and the player never see them). */
function crawlFiles(): RsbuildPlugin {
  return {
    name: "crawl-files",
    setup(api) {
      api.processAssets({ stage: "additional", environments: ["web"] }, async ({ sources, compilation }) => {
        const crawl = await import("./src/pages/docs/crawler-files.ts")
        const emit = (name: string, text: string) => compilation.emitAsset(name, new sources.RawSource(text))
        emit("sitemap.xml", crawl.sitemapXml())
        emit("robots.txt", crawl.robotsTxt())
        emit("llms.txt", crawl.llmsTxt())
        // The og engine's surface: the 1200x630 card renderer + the section
        // manifest (also the prerender's data contract for per-section pages),
        // and per card its Discord component embed and oEmbed photo (the
        // prerender draws the PNG and GIF they point at).
        emit("og/index.html", crawl.ogCardPage())
        emit("og/sections.json", crawl.sectionsManifest())
        for (const card of crawl.shareCards()) {
          emit(`embed/${card.id}.json`, crawl.componentEmbed(card))
          emit(`oembed/${card.id}.json`, crawl.oembed(card))
        }
      })
    },
  }
}

/* The kits' own source, served beside the site for the docs' source panel:
   every .vue/.svelte/.ts/.css file of both kits at `kit/src/<vue|svelte>/`
   plus a `files.json` listing them — what a reader reads, edits, runs and
   downloads is the file in this repo, never a copy kept by hand. */
function kitSources(): RsbuildPlugin {
  const KITS = { vue: "dither-kit", svelte: "dither-kit-svelte" }
  return {
    name: "kit-sources",
    setup(api) {
      api.processAssets({ stage: "additional", environments: ["web"] }, async ({ sources, compilation }) => {
        const { readdir, readFile } = await import("node:fs/promises")
        for (const [flavor, dir] of Object.entries(KITS)) {
          const files = (await readdir(at(dir), { recursive: true }))
            .map((f) => f.split(sep).join("/"))
            .filter((f) => /\.(vue|svelte|ts|css)$/.test(f) && !f.startsWith("node_modules/"))
            .sort()
          for (const f of files)
            compilation.emitAsset(
              `kit/src/${flavor}/${f}`,
              new sources.RawSource(await readFile(at(`${dir}/${f}`), "utf8")),
            )
          compilation.emitAsset(`kit/src/${flavor}/files.json`, new sources.RawSource(JSON.stringify(files)))
        }
      })
    },
  }
}

/* The kit's raster benchmark (`benchmarks/`) is a page for `rs dev` only,
   never built or deployed. */
const DEV_PAGES: typeof PAGES = {
  "benchmarks/index": { html: "benchmarks/index.html", main: "benchmarks/raster.ts" },
}

define.app(async ({ command }) => {
  const pages = command === "dev" ? { ...PAGES, ...DEV_PAGES } : PAGES
  const [{ pluginVue }, { pluginTailwindcss }, { utilityMap }] = await Promise.all([
    import("@rsbuild/plugin-vue"),
    import("@rsbuild/plugin-tailwindcss"),
    import("./src/shared/lib/utility-map.ts"),
  ])
  return {
    plugins: [pluginVue(), pluginTailwindcss(), utilityMap(root), crawlFiles(), kitSources()],
    // `@dither-kit` is the Tailwind layer's index; `@dither-kit/<layer>/…` any kit file.
    resolve: {
      alias: { "@": at("src"), "@dither-kit$": at("dither-kit/tailwind/index.ts"), "@dither-kit": at("dither-kit") },
    },
    server: {
      // `/` on dither-ui.com (public/CNAME); BASE_PATH=/dither-ui/ only for
      // a GitHub Pages project-URL deploy.
      base: process.env.BASE_PATH ?? "/",
      port: 5173,
      historyApiFallback: {
        rewrites: ["docs", "studio", "play", "benchmarks"].map((page) => ({
          from: new RegExp(`^/${page}`),
          to: `/${page}/index.html`,
        })),
      },
    },
    html: {
      template: ({ entryName }) => at(pages[entryName].html),
      // The site's routes take a page transition over before their first
      // frame (src/app/page-reveal.ts).
      tags: (tags, { entryName }) =>
        pages[entryName].main === SITE_MAIN
          ? [
              { tag: "script", children: PAGE_REVEAL_SCRIPT, head: true, append: false },
              ...tags,
              { tag: "span", attrs: { id: PAGE_END_ID, hidden: true }, head: false, append: true },
            ]
          : tags,
    },
    environments: {
      web: {
        source: { entry: Object.fromEntries(Object.entries(pages).map(([name, page]) => [name, `./${page.main}`])) },
        // compiler-sfc's browser build (the docs' Run, a lazy chunk) keeps
        // `require` hooks for Sass/Less/Stylus that Run never calls — it
        // compiles plain CSS only.
        tools: { rspack: { ignoreWarnings: [{ module: /@vue[\\/]compiler-sfc/, message: /Critical dependency/ }] } },
      },
      /* The player as ONE classic script + one stylesheet. A HyperFrames
         composition exported by the Studio must render with no network at
         render time, so it carries the player inline — Vue, the kit and the
         Studio's renderers in a single file, every asset a data URI. The web
         build cannot produce that (its entries share chunks), so this
         environment builds it beside the `/play/` route the same entry
         serves. */
      player: {
        source: { entry: { player: { import: "./src/pages/play/main.ts", html: false } } },
        output: {
          distPath: { root: "dist/play", js: "", css: "" },
          filename: { js: "[name].js", css: "[name].css" },
          cleanDistPath: false,
          dataUriLimit: Number.MAX_SAFE_INTEGER,
          legalComments: "inline",
        },
        splitChunks: false,
        tools: { rspack: { output: { asyncChunks: false } } },
      },
    },
  }
})

define.test({
  include: ["tests/**/*.spec.ts"],
  // Component specs opt into jsdom per file (`// @rstest-environment
  // jsdom` docblock).
  testEnvironment: "node",
  setupFiles: ["./tests/components/setup.ts"],
  // The docs' Run ships compiler-sfc's browser build; under the node target
  // the bundle would take its CJS build instead, whose consolidate.js
  // requires ~40 template engines that are not installed. Test what ships.
  resolve: { alias: { "@vue/compiler-sfc$": at("node_modules/@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js") } },
})

/* Rslint lints the TypeScript and JavaScript. It has no Vue SFC parser, so
   `.vue` files stay on ESLint + eslint-plugin-vue (eslint.config.js); `npm
   run lint` runs both. */
define.lint(({ js, ts }) => [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "**/node_modules/**",
      "ui-laws/**",
      // local scratch tooling (bake scripts, one-shot verifiers) — not
      // product source, and CJS require() there is intentional.
      ".scratch/**",
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
   HTML route templates (Rsbuild template syntax), public assets and local
   scratch stay as they are. */
define.fmt({
  semi: false,
  printWidth: 120,
  ignorePatterns: ["public/**", "**/*.md", "*.html", "*/index.html", ".scratch/**", "**/*.svelte"],
})
