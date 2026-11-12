# solid-site — the site on SolidStart

## Purpose

The site (landing, docs, Studio) rebuilt on SolidJS and SolidStart, growing
beside the Vue site (`../src`, `../rstack.config.ts`) until it holds all of
it, then taking its place at the repository root (the user's call: move
fully away from Vue). Until then it is a staging app: never deployed, and
the Vue site stays the live one.

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
- `src/routes/index.tsx` is the kit's bench (every ported component, live)
  until the landing moves over.

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
  `npm test` (Vitest: `tests/*.spec.tsx`, in jsdom on Solid's browser build),
  `npm run build` (the static build; a prerender error fails it). All on
  Node 24.
- The port's contract with the Vue kit is held at the root by
  `../tests/solid-kit.spec.ts`.

## Child DOX Index

None.
