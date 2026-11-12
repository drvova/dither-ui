# solid-site — the site on SolidStart

## Purpose

The site (landing, docs, Studio, the player page) on SolidJS and
SolidStart, standing beside the Vue site (`../src`, `../rstack.config.ts`)
until the cutover, then taking its place at the repository root (the
user's call: move fully away from Vue). Every page is ported; what the Vue
build still makes alone is the build pipeline's part (share cards, the
sitemap and crawler files, the agent registry, the Studio's service worker,
manifest and icons, the single-file player bundle). Until those exist here
it is a staging app: never deployed, and the Vue site stays the live one.

## Ownership

- Owns the SolidStart app: `vite.config.ts` (SolidStart 2 as a Vite plugin,
  Nitro's `static` preset, the prerender), `aliases.ts`, `src/app.tsx`, the
  entries, `src/routes/` and the Solid component specs in `tests/`.
- Does not own the kit (`../dither-kit/solid/`, see `../dither-kit/AGENTS.md`)
  or the site's framework-free modules, which it imports from `../src/`
  through `@/` and never copies.

## Local Contracts

- Node 24 or newer (SolidStart 2 requires it; `package.json` `engines`). The
  rest of the repository still runs on Node 22: CI gives this app its own
  job.
- One alias table, `aliases.ts`, for the build and the specs; `tsconfig.json`
  `paths` says the same to the type checker. `@dither-kit` is the kit's
  Solid layer, `@dither-kit/<layer>/<file>` any kit file, `@/` the Vue
  site's `src/` (framework-free modules only: a `.vue` file or a module
  that imports `vue` is ported, never imported), `~/` this app's `src/`.
- One Solid: the kit's files sit outside this package, so `ONE_SOLID`
  (`resolve.dedupe`) and the `solid-js` `paths` pin every import to this
  package's copy. A second copy splits reactivity and context.
- One stylesheet: `src/app.css` imports the site's own (`../src/app/styles.css`)
  and tells Tailwind where this app's and the Solid kit's classes are. No
  token or material is restated here.
- Every page is server-rendered to a real file at build (`nitro.prerender`,
  links crawled, a link to nothing fails the build). Components therefore
  render on a server: nothing touches `window`, `document` or a canvas
  outside `onMount`, an effect or an event handler.
- The missing page is `src/routes/[...404].tsx`. It answers 404 and is
  `noindex`; the build keeps it as `404.html` for a static host (the one
  route whose 404 the prerender hook lets through, `MISSING_PAGE`).
- `BASE_PATH` sets Vite's `base` for a project-page deploy, as it does for
  the Vue site.
- Routes: `routes/index.tsx` (the landing), `routes/studio.tsx`,
  `routes/docs/index.tsx` and `routes/docs/[section].tsx` (one docs
  section a page; the prerender list is derived from `GROUPS`, never kept
  by hand; an unknown id renders the missing page), `routes/[...404].tsx`.
  A route sets its title (`@/shared/config/titles`), its own theme colour
  and its head through `@solidjs/meta`; the shell (`entry-server.tsx`)
  names none.
- Layout mirrors the Vue site's FSD layers at the same paths under `src/`
  (`shared`, `entities`, `features`, `widgets`, `pages`): a Vue-bound file's
  twin sits at its path under the same name. A framework-free module of
  `../src` that itself reaches a Vue-bound one cannot be shared through
  `@/`: it is copied line for line with its imports re-pointed, says so in
  its first line, and a spec holds the copy to its source.
- State: the editor store and the stores around it are `createMutable`,
  read and written as the Vue reactive ones were; `watch` from the editor
  barrel gives Vue's watch timing (once, a microtask after the writes),
  which history, autosave and the agent's mirror depend on. Stored choices
  (theme, sounds, styling, framework, the Studio's document) are restored
  in `onMount`, never at module load or render.
- A parent's `onMount` runs before its children's (the reverse of Vue):
  what a child measures in its mount is read by the parent in an effect or
  a microtask later, never in its own `onMount`.
- A component's scoped styles are `<Name>.css` beside it, nested under a
  root hook class `<kebab-name>-scope`.
- Docs tooling: each demo's snippet is authored once (the Vue-style
  fragment, carried verbatim from the Vue docs) and every flavour is
  derived from it, never forked by hand: `pages/docs/solid.ts`
  (`toSolidCode`) for Solid, the shared `@/pages/docs/svelte-code` for
  Svelte; `@/shared/lib/restyle-rewrite` writes either in the reader's
  styling system. `widgets/source` shows the files and runs a Solid example
  in the page: it compiles the `.tsx` with `@babel/standalone` and
  `babel-preset-solid`, loaded only on a reader's first Run, against the
  page's own Solid and kit. Readers choose Solid or Svelte; Svelte has no
  Run, as before.
- Vite plugins, each a file at the package root: `utilities.ts` (the
  utility map the rewriter reads), `kit-sources.ts` (the kits' own source
  at `kit/src/<solid|svelte>/` with `files.json`, by the one rule in
  `@/shared/lib/kit-sources`), `run-compiler.ts` (what the Solid compiler
  needs to load in a browser). Nitro copies `../public` into the build.
- `NOT_YET_PORTED` in `vite.config.ts` lists what the crawl leaves alone
  because the pipeline does not make it yet; an entry goes when its file
  is built here.

## Work Guidance

- A page is ported whole with what it needs, behaviour for behaviour, and
  its specs with it; a behaviour the Vue page has and the Solid page lacks
  is said in the route's opening comment until it lands.
- Head tags go through `@solidjs/meta`, rendered on the server, never set
  by a script after mount.
- The rules of the look, the copy and the slop bans in `../AGENTS.md` and
  `../DESIGN.md` hold here as written.

## Verification

- `npm run check` (`tsc`, which also checks `../dither-kit/solid/`),
  `npm test` (Vitest: `tests/*.spec.tsx` for the kit, `tests/site/` for
  the site, in jsdom on Solid's browser build; `tests/world.ts` is the
  browser a spec runs in),
  `npm run build` (the static build; a prerender error fails it). All on
  Node 24.
- The port's contract with the Vue kit is held at the root by
  `../tests/solid-kit.spec.ts`.

## Child DOX Index

None.
