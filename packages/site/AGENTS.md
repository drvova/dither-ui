# site — the site on SolidStart

## Purpose

The site (landing, docs, Studio, the player page) on SolidJS and
SolidStart: the package the root's `npm run dev`, `build` and `preview`
run, and the one the Pages workflow deploys. Every page is prerendered to
a static file. Paths here are from this package's root; another package's
are from the repository's.

## Ownership

- Owns the SolidStart package: `vite.config.ts` (SolidStart 2 as a Vite
  plugin, Nitro's `static` preset, the prerender), `build/` (the alias
  table, the Vite plugins, the post-build), `public/` (the static files a
  build copies as they are), `src/app.tsx`, the entries, `src/routes/`,
  and the specs in `tests/`.
- Owns how the app is written in Solid (Local Contracts below). What the
  app's layers, pages and widgets must do is owned by `src/AGENTS.md` and
  its children. `src/` is ONE tree: a component and the framework-free
  model it stands on sit at the same FSD path (`X.tsx` beside `x.ts`), and
  a framework-free module (no Solid, no DOM at load) is what the
  workspace's `rs test` can import.
- Does not own the kit (`packages/dither-kit/AGENTS.md`), its StyleX twin,
  the styling rewriter (`packages/restyle/AGENTS.md`) or the tasks its
  post-build calls (`packages/tasks/AGENTS.md`): it imports each by its
  package name and declares it in `package.json`.

## Local Contracts

- Node 24 or newer (SolidStart 2 requires it; `package.json` `engines`),
  the workspace's one Node.
- One alias, `@/` for this package's `src/` (`build/aliases.ts`, for the
  build and the component specs; the root `tsconfig.json` `paths` says the
  same to the type checker and `rstack.config.ts` to the framework-free
  specs). Every other package is imported by name: `@dither-ui/kit` (the Solid
  layer), `@dither-ui/kit/engine` (the engine's API, what a framework-free
  module takes values from; a type may come from `@dither-ui/kit`),
  `@dither-ui/kit/<layer>/<file>` with its extension, `@dither-ui/kit-stylex`,
  `@dither-ui/restyle`, `@dither-ui/tasks`. `tests/workspace.spec.ts` at the root holds it.
- One type program, the root's `tsconfig.json`: this package has none of
  its own.
- One Solid: the workspace installs one `solid-js`, which the kit and the
  app both resolve. `seroval` and `seroval-plugins` are declared here
  because SolidStart's prerender imports them from the app's own folder,
  and Solid's older copy would answer otherwise.
- One stylesheet: `src/app.css` imports the site's own
  (`src/app/styles.css`) and tells Tailwind where this app's and the Solid
  kit's classes are, and what in this package is not a source of classes
  (the framework-free specs, `public/`, the docs beside the source). No
  token or material is restated here.
- Every page is server-rendered to a real file at build (`nitro.prerender`,
  links crawled, a link to nothing fails the build). Components therefore
  render on a server: nothing touches `window`, `document` or a canvas
  outside `onMount`, an effect or an event handler. In the browser the
  app takes those bytes over in place (SolidStart's `mount` in
  `entry-client.tsx` hydrates) when the address is the one they were
  rendered at, a static host's trailing slash included (`renderedAt` in
  `shared/lib/routes.ts`; without it every docs section was rendered anew
  over its emptied page); at another address (the missing page's file
  served for an unknown one) it renders the page anew over them.
- The missing page is `src/routes/[...404].tsx`. It answers 404 and is
  `noindex`; the build keeps it as `404.html` for a static host (the one
  route whose 404 the prerender hook lets through, `MISSING_PAGE`).
- `BASE_PATH` sets Vite's `base` for a project-page deploy; the post-build
  reads it too.
- A route imports its page by path (`pages/landing/LandingPage`,
  `pages/docs/DocsPage`), never through a slice's index: a barrel whose
  modules import stylesheets keeps every export, so the landing once
  loaded the docs and a docs section the landing. The section route's
  preload ships in every page's entry, so it imports the pack table on
  demand.
- Routes: `routes/index.tsx` (the landing), `routes/studio.tsx`,
  `routes/docs/index.tsx` and `routes/docs/[section].tsx` (one docs
  section a page; the prerender list is derived from `GROUPS`, never kept
  by hand; an unknown id renders the missing page, a lazy part there so a
  section's page never carries it), `routes/[...404].tsx`.
  `routes/play.tsx` is the player (never indexed, outside the site's
  shell; nothing links to it, so the prerender is told: `PLAYER_ROUTE`). A
  page's head is one table, `pages/docs/heads.ts` (`pageTags`, held by
  `tests/site/heads.spec.tsx`), rendered by `PageHead`; a route adds only
  its own theme colour (the Studio also the app's tags, `APP_HEAD`, and
  the worker's registration). The shell (`entry-server.tsx`) carries what
  every site page shares: `data-page` on `<html>` from the request's
  path, the icons, the display face's preload on the pages that set it (`DISPLAY_FACE`), the page-reveal and rise
  scripts, the speculation rules and the `#page-end` marker.
  `entry-client.tsx` takes the page transition the head script parks,
  installs the press (`shared/lib/press.ts`, one listener for every page),
  sends a legacy hash address (`/#/docs/<id>`, `/#/studio…`;
  `shared/lib/legacy.ts`) to its page, and mounts once the page's
  stylesheets stand (`app/sheets-ready.ts`: SolidStart's entry script is
  async and ran ahead of them on a busy load; `tests/sheets-ready.spec.ts`).
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
- Docs tooling: each demo's snippet is written once, in Solid with
  Tailwind's classes (a fragment: JSX with the script it needs as loose
  lines over or under it, or a whole `.tsx` module), and the
  `@dither-ui/restyle` package writes it in the reader's styling system
  (`pages/docs/snippet.ts`: `docsCode`, `docsFiles`; `dataCode` prints an
  example's data from the demo's own values). `widgets/source` completes
  a fragment into the module a reader takes (`asTsx`), shows the files
  and runs the example in the page (`src/widgets/source/AGENTS.md`).
- The docs' API tables and prose are written in Solid's words (a row's
  names are its component's real props; `tests/site/docs-api.spec.ts`
  type-checks every row against the kit, with its exceptions listed and
  commented).
- The Studio exports a frame as a Solid component: `entities/widget/model/codegen.ts`
  and `entities/chart/model/codegen.ts`, through `entities/artboard/code.ts`
  (`frameCode`: the `.tsx`, and its stylesheet where the styling system has
  one), used by the export dialog and `code.get` alike. A component's
  props are written as the canvas binds them (`boundProps`, after its
  row's mapping; a setting off or empty at its default left out), so the
  file says what the Studio renders and type-checks against the kit
  (`tests/site/registry-props.spec.ts`, every row). `shared/lib/sfc.ts`
  is the ONE path a document value takes into generated code (a hostile
  string stays data; `tests/site/codegen.spec.tsx` proves it against the
  real compiler). `entities/widget/model/model.ts` is the one reading of
  the shared registry's `model` rows as Solid's prop and callback.
- The figures the site states (the kit's `Dither*` components, the docs'
  sections and each family's size) are counted once, in `build/facts.ts`,
  and every module takes them as `#dither-facts` (this package's
  `imports`): under Node (the configs, the post-build, `rs test`) the
  module itself, counting as it loads; in Vite (the build, dev and the
  component specs) its plugin, `siteFacts`, answers with the numbers
  inlined, so the landing carries three numbers, never the docs table.
  The landing's facts and hub, the heads, the share cards and the Studio's
  film read them; adding a component or a section touches no count. Text
  shipped as written (the README, `public/agent/SKILL.md`) keeps its
  figures, pinned to them by `tests/landing-facts.spec.ts`.
- Vite plugins, each a file in `build/`: `facts.ts` (above), `utilities.ts` (the utility map
  the rewriter reads, compiled by `@dither-ui/restyle/utility-map` from the folders
  `utility-sources.ts` names, which the workspace's `rstack.config.ts`
  reads too), `kit-sources.ts` (the kit's own source at `kit/src/solid/`
  with `files.json`, read from the `@dither-ui/kit` package wherever the
  workspace keeps it, by the one rule and the one path, `KIT_SRC`, in
  `@/shared/lib/kit-sources`), `run-compiler.ts` (what the Solid compiler
  needs to load in a browser). Nitro copies `public/` into the build.
  `site-files.ts` emits the crawler files (`sitemap.xml`, `robots.txt`,
  `llms.txt`, `embed/`, `oembed/`, `og/sections.json`), the install files
  (icons, `studio/app.webmanifest`), the mascot capture and the bridge
  file, each from its builder in `src/` (the bridge as the `@dither-ui/bridge`
  package exports it, as written), served in dev and emitted in a build.
  `standalone.ts` builds the two scripts that stand outside the app as
  nested builds: `sw.js` (the Studio's worker, `@/app/sw`, its install set
  the Studio route's own files from the finished build) and
  `play/player.js` with its stylesheet (one self-contained file the video
  export inlines).
- `npm run build` is `vite build` (into `.output/public`), then
  `build/postbuild.mjs`, which needs Chromium (`CHROME_PATH` or a standard
  path) and fails loudly without it: it compiles `kit/dither-kit.css`
  (`buildKitCss` of the `@dither-ui/tasks` package), builds the share-card renderer
  (`og/index.html`, `build/og-page.ts` over `build/og-shell.html`), draws
  every card (`og/<id>.png`, `.gif`), rewrites each section's embed with the
  lede its page prints, and writes `agent/registry.json` off the mounted
  Studio. The drawing code is the `@dither-ui/tasks` package's
  (`packages/tasks/src/cards.ts`). `MADE_AFTER_THE_PAGES` in
  `vite.config.ts` lists the files the crawl must not ask for because the
  post-build makes them.

## Work Guidance

- Head tags go through `@solidjs/meta`, rendered on the server, never set
  by a script after mount.
- The rules of the look, the copy and the slop bans in the root `AGENTS.md` and
  `DESIGN.md` hold here as written.

## Verification

- At the root: `npm run typecheck` (`tsc`, the one type program) and
  `npx rs test` (Rstest: this package's framework-free specs,
  `tests/*.spec.ts`, with every other package's).
- Here: `npm test` (Vitest: `tests/site/`, in jsdom on Solid's browser
  build; `@dither-ui/kit/testing/world.ts` is the browser a spec runs in;
  `tests/site/sandbox.spec.ts` runs in a real Chromium) and
  `npm run build` (the static build and the post-build; a prerender error
  or a failed card fails it). The specs that read the built site
  (`tests/site/heads.spec.tsx`'s built pages, and
  `tests/site/page-reading.spec.tsx`: the site's pages, the player and each
  docs family's first section read as a screen reader reads them, by the
  walk's `auditA11y`) run only when a build stands, so the gate runs
  `npm test` again after the build. Offline use
  and the video export are checked in a browser.
- A spec that crosses packages lives here, the highest package it touches
  (`tests/bridge.spec.ts`, `tests/focus-ring.spec.ts`,
  `tests/site/stylex-layer.spec.tsx`, `tests/site/paint-law.spec.tsx`: the
  kit's paint law over every component row of the registry, each input
  changed in place against a fresh mount at one directed moment, a
  failure named `<Component>.<input>`; two copies that differ with
  nothing changed fail as `<Component>.<none>`: a timer the kit clock
  does not drive). The kit's component specs are the
  kit's (`packages/dither-kit/tests/solid/`).
- A page's first load (`tests/site/budget.spec.ts`, over the built site):
  the gzipped script the landing's and a docs section's HTML start, with
  every static import, under a budget, and neither carrying the other's
  page nor the kit's world engine, model parsers or charts.

## Child DOX Index

- `src/AGENTS.md` — the app's contracts: FSD layers, routing,
  editor/history/persistence contracts, a11y floor
  - `src/pages/AGENTS.md` — landing/docs/studio page conventions
  - `src/widgets/workbench/AGENTS.md` — the docs previews' workbench
  - `src/widgets/source/AGENTS.md` — the docs previews' source files and
    Run
