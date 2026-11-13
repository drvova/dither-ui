# solid-site — the site on SolidStart

## Purpose

The site (landing, docs, Studio, the player page) on SolidJS and
SolidStart: the package the root's `npm run dev`, `build` and `preview`
hand over to, and the one the Pages workflow deploys. Every page is
prerendered to a static file.

## Ownership

- Owns the SolidStart package: `vite.config.ts` (SolidStart 2 as a Vite
  plugin, Nitro's `static` preset, the prerender), `aliases.ts`, the Vite
  plugins at the package root, `scripts/` (the post-build), `src/app.tsx`,
  the entries, `src/routes/`, and the component and site specs in `tests/`.
- Owns how the app is written in Solid (Local Contracts below). What the
  app's layers, pages and widgets must do is owned by `../src/AGENTS.md`
  and its children, which cover `src/` here and `../src/` alike: the
  components live in `src/` at the same FSD paths as their framework-free
  models in `../src/`.
- Does not own the kit (`../dither-kit/`, see `../dither-kit/AGENTS.md`)
  or the site's framework-free modules, which it imports from `../src/`
  through `@/` and never copies.

## Local Contracts

- Node 24 or newer (SolidStart 2 requires it; `package.json` `engines`). The
  root's tooling runs on Node 22: CI gives this package its own job.
- One alias table, `aliases.ts`, for the build and the specs; `tsconfig.json`
  `paths` says the same to the type checker. `@dither-kit` is the kit's
  Solid layer, `@dither-kit/<layer>/<file>` any kit file, `@/` the
  repository's `src/` (framework-free modules only), `~/` this package's
  `src/`.
- One type program: `tsconfig.json` includes this package, `../src`,
  `../tests`, `../scripts`, `../benchmarks`, `../rstack.config.ts` and the
  kit's four layers; the root `tsconfig.json` only references it.
- One Solid: the kit's files sit outside this package, so `ONE_SOLID`
  (`resolve.dedupe`) and the `solid-js` `paths` pin every import to this
  package's copy. A second copy splits reactivity and context.
- One stylesheet: `src/app.css` imports the site's own (`../src/app/styles.css`)
  and tells Tailwind where this app's and the Solid kit's classes are. No
  token or material is restated here.
- Every page is server-rendered to a real file at build (`nitro.prerender`,
  links crawled, a link to nothing fails the build). Components therefore
  render on a server: nothing touches `window`, `document` or a canvas
  outside `onMount`, an effect or an event handler. In the browser the
  app mounts over those bytes (`mount` in `entry-client.tsx`), it does not
  hydrate them.
- The missing page is `src/routes/[...404].tsx`. It answers 404 and is
  `noindex`; the build keeps it as `404.html` for a static host (the one
  route whose 404 the prerender hook lets through, `MISSING_PAGE`).
- `BASE_PATH` sets Vite's `base` for a project-page deploy; the post-build
  reads it too.
- Routes: `routes/index.tsx` (the landing), `routes/studio.tsx`,
  `routes/docs/index.tsx` and `routes/docs/[section].tsx` (one docs
  section a page; the prerender list is derived from `GROUPS`, never kept
  by hand; an unknown id renders the missing page), `routes/[...404].tsx`.
  `routes/play.tsx` is the player (never indexed, outside the site's
  shell; nothing links to it, so the prerender is told: `PLAYER_ROUTE`). A
  page's head is one table, `pages/docs/heads.ts` (`pageTags`, held by
  `tests/site/heads.spec.tsx`), rendered by `PageHead`; a route adds only
  its own theme colour (the Studio also the app's tags, `APP_HEAD`, and
  the worker's registration). The shell (`entry-server.tsx`) carries what
  every site page shares: `data-page` on `<html>` from the request's
  path, the icons, the display face's preload, the page-reveal and rise
  scripts, the speculation rules and the `#page-end` marker.
  `entry-client.tsx` takes the page transition the head script parks, and
  sends a legacy hash address (`/#/docs/<id>`, `/#/studio…`;
  `shared/lib/legacy.ts`) to its page before mounting.
- State: the editor store and the stores around it are `createMutable`;
  `watch` from the editor barrel (`entities/editor/model/watch.ts`) calls
  back once, a microtask after the writes of a turn, which history,
  autosave and the agent's mirror depend on. Stored choices (theme,
  sounds, styling, the Studio's document) are restored in
  `onMount`, never at module load or render.
- A parent's `onMount` runs before its children's: what a child measures
  in its mount is read by the parent in an effect or a microtask later,
  never in its own `onMount`.
- A component's scoped styles are `<Name>.css` beside it, nested under a
  root hook class `<kebab-name>-scope`.
- Docs tooling: each demo's snippet is authored once, in Vue's template
  notation (a fragment or a short `<script setup>` file), and the Solid
  a reader sees is derived from it, never forked by hand:
  `pages/docs/solid.ts` (`toSolidCode`) translates it,
  `@/shared/lib/restyle-rewrite` writes it in the reader's styling
  system (`pages/docs/snippet.ts`: `docsCode`, `docsFiles`). Readers never
  see the authoring notation.
  `widgets/source` shows the files and runs the example in the page
  (`../src/widgets/source/AGENTS.md`).
- The docs' API tables and prose are written in Solid's words (a row's
  names are its component's real props; `tests/site/docs-api.spec.ts`
  type-checks every row against the kit, with its exceptions listed and
  commented).
- The Studio exports a frame as a Solid component: `entities/widget/model/codegen.ts`
  and `entities/chart/model/codegen.ts`, through `entities/artboard/code.ts`
  (`frameCode`: the `.tsx`, and its stylesheet where the styling system has
  one), used by the export dialog and `code.get` alike. `shared/lib/sfc.ts`
  is the ONE path a document value takes into generated code (a hostile
  string stays data; `tests/site/codegen.spec.tsx` proves it against the
  real compiler). `entities/widget/model/model.ts` is the one reading of
  the shared registry's `vmodel` rows as Solid's prop and callback.
- Vite plugins, each a file at the package root: `utilities.ts` (the
  utility map the rewriter reads), `kit-sources.ts` (the kit's own source
  at `kit/src/solid/` with `files.json`, by the one rule and the one
  path, `KIT_SRC`, in `@/shared/lib/kit-sources`), `run-compiler.ts` (what the Solid compiler
  needs to load in a browser). Nitro copies `../public` into the build.
  `site-files.ts` emits the crawler files (`sitemap.xml`, `robots.txt`,
  `llms.txt`, `embed/`, `oembed/`, `og/sections.json`), the install files
  (icons, `studio/app.webmanifest`), the mascot capture and the bridge
  file, each from its builder in `../src/` (the bridge as written), served
  in dev and emitted in a build.
  `standalone.ts` builds the two scripts that stand outside the app as
  nested builds: `sw.js` (the Studio's worker, `@/app/sw`, its install set
  the Studio route's own files from the finished build) and
  `play/player.js` with its stylesheet (one self-contained file the video
  export inlines).
- `npm run build` is `vite build` (into `.output/public`), then
  `scripts/postbuild.mjs`, which needs Chromium (`CHROME_PATH` or a
  standard path) and fails loudly without it: it compiles
  `kit/dither-kit.css` (`../scripts/kit-css.mjs`), builds the share-card
  renderer (`og/index.html`, `scripts/og-page.ts` over
  `scripts/og-shell.html`), draws every card (`og/<id>.png`, `.gif`),
  rewrites each section's embed with the lede its page prints, and writes
  `agent/registry.json` off the mounted Studio. The drawing code is
  `../scripts/cards.ts`. `MADE_AFTER_THE_PAGES` in `vite.config.ts` lists
  the files the crawl must not ask for because the post-build makes them.

## Work Guidance

- Head tags go through `@solidjs/meta`, rendered on the server, never set
  by a script after mount.
- The rules of the look, the copy and the slop bans in `../AGENTS.md` and
  `../DESIGN.md` hold here as written.

## Verification

- `npm run check` (`tsc`, the one type program), `npm test` (Vitest:
  `tests/*.spec.tsx` for the kit, `tests/site/` for the site, in jsdom on
  Solid's browser build; `tests/world.ts` is the browser a spec runs in;
  `tests/site/sandbox.spec.ts` runs in a real Chromium), `npm run build`
  (the static build and the post-build; a prerender error or a failed card
  fails it). All on Node 24. The specs that read the built site
  (`tests/site/heads.spec.tsx`'s built pages) run only when a build
  stands, so the gate runs `npm test` again after the build. Offline use
  and the video export are checked in a browser.
- The kit's Solid layer is also held at the root, by construction, by
  `../tests/solid-kit.spec.ts`; the framework-free specs run there with
  `rs test`.

## Child DOX Index

None.
