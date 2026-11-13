# tasks

## Purpose

The repository's tasks: Node scripts that are neither a package's source
nor the site's build, run through the workspace root's scripts or called
by the site's post-build. Paths here are from this package's root.

## Ownership

- `src/kit-css.mjs` (types in `kit-css.d.mts`): `buildKitCss()` compiles
  the kit's standalone stylesheet from `dither-kit/tailwind/kit.css` with
  Tailwind's compiler and scanner, the kit's folders the only sources. Run
  alone it writes the file it is given (`npm run build:css` at the root
  writes `kit/dither-kit.css` into the site's build).
- `src/cards.ts`: what the site's post-build does in a browser once the
  pages stand: the Chromium it draws with (`findChromium`), the server it
  draws from (`listen`), every share card (`renderOgCards`), each
  section's embed with its own lede (`refineEmbed`) and the agent registry
  (`writeAgentRegistry`).
- `src/index.ts`: the package's entry, those two modules' exports.
- `src/render-frames.mjs` (`npm run frames`): a composition as PNG frames
  or an MP4, in Chromium, WebKit or Firefox, without CDP.
- `src/agent-demo.mjs` (`npm run demo:agent`): records the Studio's agent
  panel driving the user's own harness into a video.

## Local Contracts

- Depends on `dither-kit` only, for the stylesheet's entry, found through
  the kit's `exports`. It never imports the site: the site's post-build
  imports this package and hands it the folder and the browser to work in
  (`tests/workspace.spec.ts` at the root).
- `cards.ts` and `index.ts` are loaded by Node as they are (type
  stripping): erasable syntax only, relative imports with their extension.
- The recorders take a URL or a file and write where they are told; the
  agent demo runs where the harness is signed in, never with borrowed
  credentials.
- A missing Chromium is an error, never a skip.

## Work Guidance

## Verification

- `tests/kit-css.spec.ts` (`npx rs test` at the root): the compiled
  stylesheet's tokens, scoped base and utilities.
- The drawing code's pure parts are held where they run, by the site
  (`packages/site/tests/site/cards.spec.ts`), and its browser parts by the
  site's build, which fails when a card or the registry does.

## Child DOX Index

- none
