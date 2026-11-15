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
  the styling rewriter (`packages/restyle/AGENTS.md`), the tasks its
  build and post-build call (`packages/tasks/AGENTS.md`), the bridge or
  the add command it serves (`packages/bridge/AGENTS.md`,
  `packages/add/AGENTS.md`): it imports each by its
  package name and declares it in `package.json`.

## Local Contracts

- Node 24 or newer (SolidStart 2 requires it; `package.json` `engines`),
  the workspace's one Node.
- One alias, `@/` for this package's `src/` (`build/aliases.ts`, for the
  build and the component specs; the root `tsconfig.json` `paths` says the
  same to the type checker and `rstack.config.ts` to the framework-free
  specs), and the reader's `@dither-kit`, which only the docs' examples
  import (`build/aliases.ts` and `tsconfig.json` make it `@dither-ui/kit`). Every other package is imported by name: `@dither-ui/kit` (the Solid
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
  (`src/app/styles.css`, then its print sheet `src/app/print.css`) and tells Tailwind where this app's and the Solid
  kit's classes are, and what in this package is not a source of classes
  (the framework-free specs, `public/`, the docs beside the source). No
  token or material is restated here.
- Every page is server-rendered to a real file at build (`nitro.prerender`,
  links crawled, a link to nothing fails the build). Components therefore
  render on a server: nothing touches `window`, `document` or a canvas
  outside `onMount`, an effect or an event handler, and nothing a page
  renders there reads the clock or a random source, so a build with no
  change writes the same bytes (the Studio's frame ids stamp the clock only
  in a browser, `entities/artboard/model/factory.ts`). In the browser the
  app takes those bytes over in place (SolidStart's `mount` in
  `entry-client.tsx` hydrates) when the address is the one they were
  rendered at, a static host's trailing slash and any query included
  (`renderedAt` in `shared/lib/routes.ts`; without it every docs section
  was rendered anew over its emptied page); at another address (the
  missing page's file served for an unknown one) it renders the page anew
  over them.
- Islands (the user's call: no script where HTML and CSS can do it). The
  landing and the docs are static pages: their route renders the page
  through `Static` (`src/shared/lib/island.tsx`), handing it the page only
  on a server (`const OnServer = import.meta.env.SSR ? Page : undefined`,
  at the module's top: a condition inside JSX compiles into a memo no
  bundler folds, and the page's code shipped), so the server renders it whole
  without hydration keys and the browser's bundle drops the page's code,
  keeping only its stylesheets (the package declares no module of its own
  side-effectful but a stylesheet and a component file, whose stylesheet
  imports stand where its component is never called, `package.json`
  `sideEffects`: a table only the page reads leaves no code behind, and a
  component file only its stylesheets);
  the browser keeps the
  bytes. What a hand
  or the clock drives on such a page is an island: a default-exporting
  `.tsx` module named in the page's ONE table (`islands({...})`:
  `pages/landing/islands.ts`, `pages/docs/islands.ts`), its props JSON,
  rendered by the server in place inside a `<dither-island>` (laid out as
  if it were not there) with its chunk's stylesheets linked in the head
  (read off SolidStart's client manifest), and hydrated by the browser
  under the id the server rendered it at, inside the table's root (the
  providers the app stands in, `shared/ui/SpriteRoot.tsx`, which both
  sides render around the island), one at a time, when it nears the
  view (`visible`, the default), once the page is idle (`idle`), with the
  page (`load`), or at once under a pointer or focus. What moves on a static
  page's bytes (the rise, the scroll scenes, the press) is their
  stylesheets' alone, classes the server renders. The router
  takes no link (`explicitLinks` in `app.tsx`): every page is a document
  of its own, the page transition dithering between them. The Studio and
  the missing page stay whole apps. `tests/site/budget.spec.ts` holds
  that no script the build ships carries a static page's own words, and
  that each page names its islands.
- The missing page is `src/routes/[...404].tsx`. It answers 404 and is
  `noindex`; the build keeps it as `404.html` for a static host (the one
  route whose 404 the prerender hook lets through, `MISSING_PAGE`).
- `BASE_PATH` sets Vite's `base` for a project-page deploy; the post-build
  reads it too.
- A route imports its page by path (`pages/landing/LandingPage`,
  `pages/docs/DocsPage`, entries `tests/fsd.spec.ts` names), never through
  a slice's index: a barrel whose
  modules import stylesheets keeps every export, so the landing once
  loaded the docs and a docs section the landing. The section route's
  preload ships in every page's entry, so it imports the pack table on
  demand.
- Routes: `routes/index.tsx` (the landing), `routes/studio.tsx`,
  `routes/docs/index.tsx` and `routes/docs/[section].tsx` (one docs
  section a page, each a static page, its pack's chunk asked for by the
  route's preload; the prerender list is derived from `GROUPS`, never kept
  by hand; an unknown id renders the missing page, a lazy part there so a
  section's page never carries it), `routes/[...404].tsx`.
  `routes/play.tsx` is the player (never indexed, outside the site's
  shell; nothing links to it, so the prerender is told: `PLAYER_ROUTE`). A
  page's head is one table, `pages/docs/heads.ts` (`pageTags`, held by
  `tests/site/heads.spec.tsx`), rendered by `PageHead`; a route adds only
  its own theme colour (the Studio also the app's tags, `APP_HEAD`, and
  the worker's registration). The shell (`entry-server.tsx`) carries what
  every site page shares: `data-page` on `<html>` from the request's
  path, the icons, the display face's preload on the pages that set it (`DISPLAY_FACE`), the stored theme on the
  pages that turn with it (`TURNS_WITH_THEME`), the expect link that holds
  the first frame to the `#page-end` marker (the page transition's, which
  is all `app/styles.css`), the speculation rules and the marker. No
  script moves anything (`tests/no-js-motion.spec.ts`).
  `entry-client.tsx` installs the hand (`shared/lib/hand.ts`: what the reader last reached with),
  sends a legacy hash address (`/#/docs/<id>`, `/#/studio…`,
  `/docs#/docs/<id>`; `shared/lib/legacy.ts`, `legacyAt`) to its page,
  and mounts once the page's
  stylesheets stand (`app/sheets-ready.ts`: SolidStart's entry script is
  async and ran ahead of them on a busy load; `tests/sheets-ready.spec.ts`).
- State: the editor store and the stores around it are `createMutable`;
  `watch` from the editor barrel (`entities/editor/model/watch.ts`) calls
  back once, a microtask after the writes of a turn, which history,
  autosave and the agent's mirror depend on. Stored choices (theme,
  sounds, styling, the Studio's document) are restored in
  `onMount`, never at module load or render (the theme is also set on
  the root by the head's script, before the first paint).
- A parent's `onMount` runs before its children's: what a child measures
  in its mount is read by the parent in an effect or a microtask later,
  never in its own `onMount`.
- A component's scoped styles are `<Name>.css` beside it, nested under a
  root hook class `<kebab-name>-scope`.
- Docs tooling: each demo's example is written once, in Solid with
  Tailwind's classes: a module of its own,
  `src/pages/docs/<pack>/examples/<id>.tsx` (a default-exported component
  importing the kit as `@dither-kit`), which the page imports twice, as
  the demo's component and as its text (`./examples/<id>.tsx?raw`) for the
  card's code; or, where the demo is wired to the page (pickers, readouts,
  state the page shares) or says more than its code, a string beside the
  demo (a fragment: JSX with the script it needs as loose lines over or
  under it, or a whole `.tsx` module), held to the demo by
  `tests/site/docs-drift.spec.tsx`. Either way the
  `@dither-ui/restyle` package writes it in the reader's styling system
  (`pages/docs/snippet.ts`: `docsCode`, `docsFiles`; `dataCode` prints an
  example's data from the demo's own values). `widgets/source` completes
  a fragment into the module a reader takes (`asTsx`), shows the files
  and runs the example in the page (`src/widgets/source/AGENTS.md`).
- An example module may export `meta = defineExample({ … })`
  (`src/shared/lib/example.ts`, the site's, never the kit's): what the
  kit's props type cannot say about its component (its Studio row, its
  states), typed against the component's props. `build/catalog.ts` reads
  every example by the TypeScript compiler, the meta as data, resolved
  against the kit's props types (`eachKitProp`, `props.ts`), into
  `virtual-dither-catalog` (the entries, which the Studio's registry
  reads: `src/AGENTS.md`) and `virtual-dither-catalog/sources` (each
  example's text, which the code export reads), and serves every
  example's `?raw` without its meta and that import (`stripMeta`), so the
  card, Run and the zip show the module a reader copies. A `virtual-`
  id, not `virtual:`, because Rspack (the workspace's `rs test`, through
  `exampleCatalogRsbuild` in `rstack.config.ts`) takes `virtual:` for a
  URL scheme. `tests/catalog.spec.ts` holds the type check (a setting the
  props lack, a value its prop does not take), the resolved settings to
  the kit's props (a `story` setting to none of them), and the stripped
  text.
- The docs' API tables are printed off the kit's own props types, never
  typed here: `build/props.ts` reads each component's props by the
  TypeScript compiler (one row a prop the kit declares, in the type's
  order: its `@docs` tag or else its declared type, its `@default` tag or
  else the default the component merges) and serves a component's rows
  as `virtual:dither-props/<Component>` (typed by
  `src/pages/docs/kit-props.d.ts`), which a docs pack imports, so a table
  loads with its pack. A pack's `API` (exported) builds each table with
  `kitTable` (`pages/docs/PropsTable.tsx`): the rows it joins (`a / b`),
  a family's parts (`prop (Item)`), the props a section is about
  (`only`), and rows that are not props (`add`, with the reason beside
  it); a name the kit does not declare, or an added row the kit declares,
  fails the page. A table that documents functions stays literal rows.
  The tables and prose are in Solid's words, and a prop added to the kit
  is in its table with no other edit (`tests/site/docs-api.spec.ts`).
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
- The README's banner (`.github/readme/brand.svg`) is the hero's moment
  (`choreograph`, the hero's staging, the install surface's inks) written
  by `@dither-ui/tasks`'s `brandSvg`: `tests/readme-art.spec.ts` writes it
  (`npm run readme:art` at the root) and fails while the file drifts.
- Vite plugins, each a file in `build/`: `facts.ts` (above), `props.ts`
  (the kit's props for the API tables, above), `catalog.ts` (the docs'
  examples' catalogue, above; also in the player's nested build),
  `utilities.ts` (the utility map
  the rewriter reads, compiled by `@dither-ui/restyle/utility-map` from the folders
  `utility-sources.ts` names, which the workspace's `rstack.config.ts`
  reads too), `kit-sources.ts` (the kit's own source at `kit/src/solid/`
  with `files.json`, read from the `@dither-ui/kit` package wherever the
  workspace keeps it, by the one rule and the one path, `KIT_SRC`, in
  `@/shared/lib/kit-sources`), `kit-add.ts` (`kitAdd`: what the add
  command reads, below), `run-compiler.ts` (what the Solid compiler
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
  export inlines). `chunk-modules.ts` writes `.vite/chunks.json` beside
  Vite's manifest: every browser chunk and the source modules in it.
- The add command (`@dither-ui/add`, `packages/add/AGENTS.md`): `kitAdd`
  serves and emits the script as written at `add/dither-add.mjs`, its
  manifest `add/manifest.json` (`AddManifest`, `addFileList`), the files
  only it reads under `add/files/` (the StyleX twin with its imports of
  `@dither-ui/kit/<layer>/` made relative to the copy, and the Tailwind
  layer's `tailwind/kit.css`) and the kit's standalone stylesheet
  `kit/dither-kit.css` (`buildKitCss`, `@dither-ui/tasks/kit-css`); the
  kit's own files it lists where `kitSources` serves them. Everything is
  derived: the files from `kitFiles` and the twin's folder, the graph off
  each file (TypeScript's `preProcessFile`, a worker's `new URL`, a
  stylesheet's `@import`; an import that resolves to no file of a copy
  fails the build), the components from the kit's and the twin's
  indexes (`isComponentName`). The paths and the line that runs it are
  `src/shared/lib/add-command.ts` (`ADD_FILE`, `ADD_MANIFEST`,
  `ADD_FILES`, `ADD_SITE`, `addCommand`), which imports nothing, so the
  config, the crawler files and the docs read the one table.
- `npm run build` is `vite build` (into `.output/public`), then
  `build/postbuild.mjs`, which needs Chromium (`CHROME_PATH` or a standard
  path) and fails loudly without it: it builds the share-card renderer
  (`og/index.html`, `build/og-page.ts` over `build/og-shell.html`), draws
  every card (`og/<id>.png`, `.gif`), rewrites each section's embed with the
  lede its page prints, and writes `agent/registry.json` off the mounted
  Studio, printing each step's time. The drawing code is the
  `@dither-ui/tasks` package's (`packages/tasks/src/cards.ts`). Each card is
  kept in the root's `node_modules/.cache/dither-ui/og/` under a hash of
  what it is drawn from (`cardKey` there), so a build that changed nothing
  a card shows copies it, byte for byte, and one section's new lede draws
  that card alone; CI and Pages restore the folder with `actions/cache`,
  safe because a stale entry never answers a key. `MADE_AFTER_THE_PAGES` in
  `vite.config.ts` lists the files the crawl must not ask for because the
  post-build makes them.

## Work Guidance

- Head tags go through `@solidjs/meta`, rendered on the server, never set
  by a script after mount, save one: on a static page the docs' theme
  switch (`DocsSwitches`, an island, outside the app's `MetaProvider`)
  tints the rendered `theme-color` as the theme turns.
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
  (`tests/bridge.spec.ts`, `tests/kit-add.spec.ts`: the add command's
  manifest, every component's file set complete in every styling system,
  the twin made relative, and the real script run against it,
  `tests/exports.spec.ts`: no export of the
  site's, the rewriter's or the tasks' modules that nothing in the
  workspace imports, specs counting, a docs example's `meta` and its
  default read by the catalogue instead, `tests/focus-ring.spec.ts`,
  `tests/observer-entries.spec.ts`: every visibility observer in the kit
  and the site reads its newest entry, never only the first,
  `tests/site/stylex-layer.spec.tsx`, `tests/site/paint-law.spec.tsx`: the
  kit's paint law over every component row of the registry, each input
  changed in place against a fresh mount at one directed moment, a
  failure named `<Component>.<input>`; two copies that differ with
  nothing changed fail as `<Component>.<none>`: a timer the kit clock
  does not drive). The kit's component specs are the
  kit's (`packages/dither-kit/tests/solid/`).
- A page's first load (`tests/site/budget.spec.ts`, over the built site):
  the gzipped script the landing's and a docs section's HTML start, with
  every static import, under a budget, neither carrying the other's
  page nor the kit's world engine, model parsers or charts, decided by the
  modules each chunk holds (`.vite/chunks.json`), never a chunk's name, no
  script carrying a static page's own words, and each page naming its
  islands.

## Child DOX Index

- `src/AGENTS.md` — the app's contracts: FSD layers, routing,
  editor/history/persistence contracts, a11y floor
  - `src/pages/AGENTS.md` — landing/docs/studio page conventions
  - `src/widgets/workbench/AGENTS.md` — the docs previews' workbench
  - `src/widgets/source/AGENTS.md` — the docs previews' source files and
    Run
