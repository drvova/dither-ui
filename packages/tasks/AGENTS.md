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
- `src/chromium.ts`: the ONE list of where a Chromium stands
  (`chromiumCandidates`: `CHROME_PATH`, the standard installs on Linux,
  macOS and Windows, Chrome before Edge, then Playwright's
  `/opt/pw-browsers/chromium`), the first that stands (`chromiumPath`) and
  the build's, which throws without one (`findChromium`): the post-build,
  the walk, the frame renderer, the agent demo (the last three after their
  `--executable`) and the site's browser specs read it. The Discord
  service keeps a copy (`packages/discord/AGENTS.md`), held to it by the
  workspace's `tests/chromium.spec.ts`.
- `src/cards.ts`: what the site's post-build does in a browser once the
  pages stand: the server it draws from (`listen`), every share card (`renderOgCards`), each
  section's embed with its own lede (`refineEmbed`) and the agent registry
  (`writeAgentRegistry`).
- `src/index.ts`: the package's entry, those three modules' exports.
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
  Run in every styling system the docs' switch offers (`--styles`, all
  four by default: every example runs as written in each; one that stops
  on a name it never declares, prints an elision, asks for an address the
  site does not hold or renders no visible box is a finding); in the
  Studio a frame added, selected, changed, undone, redone and search
  opened. Every section walks again in light (`--light all`, or a number
  for the first few of each family and one in eight of the rest). It
  lists the registry's components no docs example renders. Every page in
  the dark has its keyboard and screen-reader pass (`--a11y`, below).
  Flags: `--jobs`, `--only`, `--run`, `--styles`, `--light`, `--phone`,
  `--contrast`, `--a11y`. Out: `<out>/<engine>.json`, `<engine>.md` and
  `shots/<engine>/`.
- `src/walk-checks.mjs`: the walk's audits of what a reader sees. `PHONE`
  (`--phone on`: every page again in the dark at an iPhone's size, 390x844,
  touch and its user agent in Chromium, the window's size and the agent
  over WebDriver), with the site's iOS rules (those under `@supports
  (-webkit-touch-callout: none)`) applied as an iPhone applies them: the
  page wider than the window, targets under 24px that a 24px circle on
  each finds crowded (WCAG 2.5.8; a link in a sentence and a native box
  hit through its label are exempt), fields under 16px, a run of text
  partly cut by a box that hides its overflow (unless it ellipsizes,
  clamps, moves or stands on a moved stage such as a panned canvas), a
  demo spilling out of its card's well; the Studio there shows its
  notice, not the editor. `CONTRAST` (`--contrast on`,
  both themes, the desktop): the text in the window where the walk stops
  (a section's top and each card in view; the long pages a window at a
  time), each element's ink read from its style and its ground measured
  off a screenshot (`measureContrast`: the pixels under its text less the
  glyphs' own, read as their mean in linear light, so an ordered-dither
  fill counts as the raster it is, as the kit inks its labels for it),
  held to 4.5:1, 3:1 for large text, a finding only when a second look a
  moment later finds it short too (`foundTwice`: a busy machine can stall a
  fade between its frames); text in motion (an animation, or an
  opacity a script changes while it is read), disabled, hidden from
  assistive technology, covered (by an element, or by a cover that lets
  the pointer through) or drawn through transparent glyphs is not
  sampled. What assistive technology meets (`--a11y on`, every page in the
  dark, desktop and phone), its rules functions the page scripts are
  written from (`A11Y`, `KEYS_*`, `FOCUS_*`, `DIALOG_*`; types in
  `walk-checks.d.mts`, exported as `@dither-ui/tasks/walk-checks`): the
  page read (`auditA11y`: every operable element named by accname's rules,
  a button's label included; ids once and every `aria-labelledby`,
  `-describedby`, `-controls`, `-owns`, `-activedescendant` and `for` id
  standing, a collapsed key's `aria-controls` excepted; one h1 and no level
  skipped going down inside main; one main and each landmark of a kind
  there are several of named, apart, save demos of one component on its
  docs page; every image given a text or hidden); on the desktop Tab
  pressed through the page until focus comes round (`press` on the
  driver: the keyboard's own presses), every operable element that shows
  reached (a composite widget's one stop, or the widget itself holding
  focus, stands for the members it keeps out of the tab order), focus
  never under aria-hidden, inert or unrendered, nor transparent once Tab's
  smooth scroll and the page's reveal have settled, every stop showing a
  mark of focus (its style or its nearest boxes' changed; else looked at
  on screen, Tabbed to against unfocused), and Tab never held (a field
  that keeps it is given Escape, then Tab); then every key that opens a
  dialog (`aria-haspopup=dialog`, the page's named keys in `walk.mjs`, and
  on a docs section every plain button of a demo, tried) pressed with
  Enter: focus moves in, a modal keeps Tab and Shift+Tab inside, Escape
  closes it and focus comes back to its key; at a phone's size the page is
  read and its menu sheets walked.
- `src/walk-drivers.mjs`: what the walk stands on: the static server (a
  recorder first in every page's head, the theme set and the docs' styling
  put back to Tailwind before the app reads them), the devices it looks
  through (`DEVICES`: the desktop and the phone; a session opens on one),
  the one driver shape (`go`, `run`, `shot`, `press`, `drain`, `close`) over
  Playwright for Chromium and plain W3C WebDriver for WebKit
  (`WebKitWebDriver` + `MiniBrowser`) and
  Firefox (`geckodriver`; with none on the machine, Playwright's own
  Firefox build, a browser a session, its phone the viewport, ratio,
  touch and agent), each window on an Xvfb display of its own where
  the machine has one (a window under another stops its frames, and
  headless Firefox has no GL without a GPU), and the PNG reader for its
  screenshots.

## Local Contracts

- Depends on `@dither-ui/kit` only, for the stylesheet's entry, found through
  the kit's `exports`, and for WCAG's contrast, which the walk measures by
  the kit's own reading (`@dither-ui/kit/engine/palette.ts`, a file Node
  loads as it is). It never imports the site: the site's post-build
  imports this package and hands it the folder and the browser to work in
  (`tests/workspace.spec.ts` at the root).
- `cards.ts`, `chromium.ts` and `index.ts` are loaded by Node as they are
  (type stripping): erasable syntax only, relative imports with their
  extension.
- The recorders take a URL or a file and write where they are told; the
  agent demo runs where the harness is signed in, never with borrowed
  credentials.
- A missing Chromium is an error, never a skip.
- The walk is run by hand, never by a build or the gate. Its checks are
  scripts run in the page, so they hold over WebDriver; it installs no
  browser: `--executable` and `--driver` name the ones a machine has.
  What a machine without a GPU or the walk's own hand brings about
  (`ENVIRONMENT`: its scripted pointer, its unfocused windows, where Gecko
  refuses fullscreen), a media file the
  build holds that the engine cannot play, the refusals a
  page makes by design (`KNOWN_REFUSALS`), a request the page or the
  engine gave up (`GIVEN_UP`) and an engine's own notes on what a page
  does by design (`ADVISORIES`: Gecko's on a scroll-linked effect; its
  "context lost" once for each GL context the page released, which
  the recorder counts; and its unused preload of a face the session's
  pages preloaded, set and loaded, which it then lays out from its own
  font cache on every page after the first: `HELD_FACES`, `heldPreload`
  in `walk-checks.mjs`) are named in `walk.mjs` and counted apart;
  anything else is a finding and the exit code is 1. Every session parks
  the pointer at the window's top left corner before its first page (on
  a display of its own the pointer stands at the screen's centre, and a
  hovered fill reads lit). A step
  over 8s is kept with its page, and a page that stalled and then showed
  an empty canvas is walked once more, its first walk kept in the record.

## Work Guidance

## Verification

- `tests/kit-css.spec.ts` (`npx rs test` at the root): the compiled
  stylesheet's tokens, scoped base and utilities.
- The root's `tests/chromium.spec.ts`: the Chromium list's order and the
  Discord service's copy run against it.
- `tests/walk-checks.spec.ts` (jsdom): the walk's accessibility rules, each
  on a page of its own, the contrast measured off a shot and looked at
  twice, and every page script compiling as the drivers run
  it. The site holds the static rules over its built pages
  (`packages/site/tests/site/page-reading.spec.tsx`).
- The drawing code's pure parts are held where they run, by the site
  (`packages/site/tests/site/cards.spec.ts`), and its browser parts by the
  site's build, which fails when a card or the registry does.

## Child DOX Index

- none
