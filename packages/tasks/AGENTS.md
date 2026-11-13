# tasks

## Purpose

The repository's tasks: Node scripts that are neither a package's source
nor the site's build, run through the workspace root's scripts or called
by the site's post-build. Paths here are from this package's root.

## Ownership

- `src/kit-css.mjs` (types in `kit-css.d.mts`): `buildKitCss()` compiles
  the kit's standalone stylesheet from `@dither-ui/kit/tailwind/kit.css` with
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
- `src/walk.mjs` (`npm run walk -- --engine chromium|webkit|firefox`): the
  browser walk over a built site, one walk for every engine. It serves the
  build itself and visits the landing, `/docs/`, every docs section the
  build lists (`og/sections.json`), the Studio, the player (bare, then
  given a frame of the Studio's document) and an address nothing answers.
  A page's record: what it threw, logged or was refused; in a docs section
  every demo card revealed and every canvas painted (a blank one is given
  a pointer first), each Code tab's files read, each example edited and
  Run (every example runs as written: one that stops on a name it never
  declares, prints an elision, asks for an address the site does not
  hold or renders no visible box is a finding); in the Studio a frame added, selected, changed, undone, redone and
  search opened. It lists the registry's components no docs example
  renders. Out: `<out>/<engine>.json`, `<engine>.md` and `shots/<engine>/`.
- `src/walk-drivers.mjs`: what the walk stands on: the static server (a
  recorder first in every page's head, the theme set before the app reads
  it), the one driver shape (`go`, `run`, `shot`, `drain`, `close`) over
  Playwright for Chromium and plain W3C WebDriver for WebKit
  (`WebKitWebDriver` + `MiniBrowser`) and
  Firefox (`geckodriver`), each window on an Xvfb display of its own where
  the machine has one (a window under another stops its frames, and
  headless Firefox has no GL without a GPU), and the PNG reader for its
  screenshots.

## Local Contracts

- Depends on `@dither-ui/kit` only, for the stylesheet's entry, found through
  the kit's `exports`. It never imports the site: the site's post-build
  imports this package and hands it the folder and the browser to work in
  (`tests/workspace.spec.ts` at the root).
- `cards.ts` and `index.ts` are loaded by Node as they are (type
  stripping): erasable syntax only, relative imports with their extension.
- The recorders take a URL or a file and write where they are told; the
  agent demo runs where the harness is signed in, never with borrowed
  credentials.
- A missing Chromium is an error, never a skip.
- The walk is run by hand, never by a build or the gate. Its checks are
  scripts run in the page, so they hold over WebDriver; it installs no
  browser: `--executable` and `--driver` name the ones a machine has.
  What a machine without a GPU says (`ENVIRONMENT`), a media file the
  build holds that the engine cannot play, and the refusals a
  page makes by design (`KNOWN_REFUSALS`) are named in `walk.mjs` and
  counted apart; anything else is a finding and the exit code is 1. A step
  over 8s is kept with its page, and a page that stalled and then showed
  an empty canvas is walked once more, its first walk kept in the record.

## Work Guidance

## Verification

- `tests/kit-css.spec.ts` (`npx rs test` at the root): the compiled
  stylesheet's tokens, scoped base and utilities.
- The drawing code's pure parts are held where they run, by the site
  (`packages/site/tests/site/cards.spec.ts`), and its browser parts by the
  site's build, which fails when a card or the registry does.

## Child DOX Index

- none
