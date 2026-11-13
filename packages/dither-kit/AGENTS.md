# dither-kit — the toolkit

## Purpose

Self-contained SolidJS component library: charts, buttons, avatars, gradients and
images rendered through one ordered-dither (Bayer 4x4) engine. Interactive
surfaces use canvas; deterministic surfaces can use the dependency-free RGBA
compiler and a packaged image URL. This package is the product, and its
`src/` the one folder a reader copies; the site (`packages/site/`) is its
showcase and editor. Paths here are from this package's root, and a
layer's folder (`engine/`, `solid/`, `tailwind/`) is under `src/`; another
package's paths are from the repository's root.

## Ownership

- Owns every rendering primitive: palette seeds, Bayer matrix, bloom presets,
  step-timing primitives, the sequence timeline algebra, the clock director,
  the wipe engine (ordered-dither masks), the keyframe engine (container
  units), the score engine (a film's soundtrack from its cut),
  container-query scales, chart roots/contexts, canvas painters, and the
  public component set.
- Consumers import ONLY what `package.json` `exports` declares: the Solid
  layer's index (`@dither-ui/kit`, `src/solid/index.ts`; a reader who copied
  `src/` aliases `@dither-kit` to its `solid/`), the engine's public API
  where nothing renders (`@dither-ui/kit/engine`, `src/engine/api.ts`), and a
  single file by its name, extension included
  (`@dither-ui/kit/engine/<file>`, `@dither-ui/kit/solid/<file>`,
  `@dither-ui/kit/tailwind/<file>`). `@dither-ui/kit/testing/<file>` is
  `tests/support/`: the fake browser the component specs of this package
  and of the site run in (`paint.ts`: a 2D canvas that remembers what it
  shows), never shipped (`files` is `src`).
- Depends on no package of this workspace (`tests/workspace.spec.ts` at
  the root).

## Layers

One kit, in folders under `src/`. File names are unique across the engine
and the runtime; a component's file has one name in `solid/` and in its
generated twin. Inside the kit every import is relative
(`../engine/pixel`).

- `engine/` — every module that carries no class name and no framework:
  palette, pixel, raster, the painters and backgrounds' renderers, the
  chart paint loops (`cartesian-loop.ts`, `bar-loop.ts`, `pie-loop.ts`,
  `radar-loop.ts`: `startCartesianLoop`, `startBarLoop`, `startPieLoop`,
  `startRadarLoop`), the one rule for when a chart's held fill is stale
  (`chart-fill.ts`) and the chart family's types (`chart-types.ts`),
  timing, sequence, clock, wipe, keyframes, score, parsers and GL engines,
  `copy-text.ts`, `theme.css`, `theme.ts` and `base.css` (the scoped
  box-model base every layer assumes). It imports only `d3-*` and itself,
  never a framework or a styling layer (`tests/solid-kit.spec.ts`).
  Behaviour lives here: where a
  runtime must follow a component's lifecycle, a core holds the behaviour
  (`surface-loop.ts`, the loop behind every generative surface;
  `visibility.ts`) and the framework's binding is a few lines over it
  (`src/solid/runtime/`). A core touches nothing when made (a server render
  makes one per surface) and listens only between `mount` and `dispose`
  (`tests/surface-loop.spec.ts`). `api.ts` is the engine's public API,
  every framework-free name a consumer gets; each layer's index re-exports
  it whole and never lists the engine again.
- `tailwind/` — the Tailwind layer's framework-free modules, the `.ts`
  files that write Tailwind classes (`lib.ts`'s `cn`, `control.ts`'s
  `CONTROL` / `CONTROL_BUTTON` / `POPOVER`), and `kit.css`, the standalone
  stylesheet's entry. It holds no component.
- `solid/` — the components: one `.tsx` per component, exported from
  `src/solid/index.ts` (the public API) with its own `<Name>Props` type, plus
  the chart roots (`cartesian-root.tsx`, `polar-root.tsx`, `area-chart.ts`,
  `bar-chart.ts`, `pie-chart.ts`, `radar-chart.ts`). It imports the engine
  (`../engine/`), the Tailwind layer's modules (`../tailwind/lib`,
  `../tailwind/control`, never a copy) and its runtime, `src/solid/runtime/`:
  `surface.ts` (`createDitherBackground`, the surface loop bound to a
  component), `screen.ts` (the print screen as context: `useScreen`,
  `useDitherMatrix`, `useLabelMatrix`, `useVariantMatrix`),
  `visibility.ts` and `in-view.ts` (the loop gates: `createCanvasVisibility`,
  `createInviewLoop`), `field.ts` (a field's ids and error for the control
  inside it), `toast.ts` (the toast store), `presence.tsx`
  (`<Presence when name>`: an element enters and leaves through six class
  names, `<name>-enter-from` / `-enter-active` / `-enter-to` and the three
  `-leave-*`, so a transition is a plain stylesheet), and the chart
  family's (`chart-context.ts`, `common-context.ts`, `polar-context.ts`,
  `series-context.ts`, `use-chart-dimensions.ts`, the four `*-canvas.tsx`
  over the engine's loops, `chart-layer.tsx`, which sorts a chart root's
  children into its back, drawing and DOM layers).
  Conventions: props are never destructured (defaults through `mergeProps`,
  a control's own props apart from the element's through `splitProps`, the
  rest spread on the element so listeners and ARIA reach it); elements are
  `let` variables set by a function ref (`ref={(el) => (wrap = el)}`,
  an assignment the linter can see) and handed to the runtime as
  accessors; derived values are `createMemo`; lifecycle work sits in
  `onMount` with its `onCleanup` inside, so a server render runs none of
  it; inline styles use CSS property names. A change is reported through
  an `on<Event>` callback prop (a two-way value is `modelValue` with
  `onUpdateModelValue`); content is `children`, a function of its scope
  where the component hands one down, and a named region is a prop of its
  name; what a component exposes goes to a `ref` callback, typed
  `<Name>Api`; an id is `createUniqueId()`, so a server render and the
  browser agree; a component's own stylesheet is `<Name>.css` beside it,
  its rules nested under a root hook class `dk-<name>` where a selector is
  not already the component's own; a component's own listener on an
  element that also takes the caller's is a native `on:` listener, so both
  run, and so an overlay's keys stop at its portal. Held by
  `tests/solid-kit.spec.ts` (every component in the index, the engine's
  API handed on whole, no framework in the engine) and the component specs
  in `tests/solid/`.
- A file name is one component: a chart's series part and a background
  never share one (`Radar.tsx` is the radar chart's series part, which
  registers its texture with the chart; the sweep background is
  `RadarSweep.tsx`, exported as `DitherRadar`;
  `tests/solid/charts.spec.tsx` holds it).
- The StyleX twin is a package of its own, `@dither-ui/kit-stylex`, GENERATED
  from `solid/` (`packages/dither-kit-stylex/AGENTS.md`): never edit a
  generated file; edit the Solid file and run
  `npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts`,
  which fails on any drift. What the Solid source keeps to, so the
  generator can carry it: classes in class position (`class`, `classList`
  as a plain object, `cn()` arguments, and the constants, records and
  functions those reach), a composition returning classes or lists, never
  a `cn()` string fed into another list, never `+` or a class glued to an
  expression in a template literal, no `!important`; a rule about another
  element's state (a parent's hover, a `:has()`) lives in the component's
  own stylesheet on its hook classes, which both layers share; a utility
  that needs a selector StyleX cannot say (`group-*`, `peer-*`, `has-*`,
  `*:`, an arbitrary `[&...]`) stays out of class strings. The generator
  refuses anything else by file and line and writes nothing for that file.
- A module that carries neither classes nor Solid goes in `engine/`; a new
  component goes in `solid/` and reaches shared logic through `../engine/`.

## Local Contracts

- Covers: `src/engine/cover.ts` holds every loop under a layer that covers
  the page (`coverPage(el)` raises it, `coverPage(null)` lifts it): the
  loop gates (the engine's `watchVisibility`, so the surface loop and every
  canvas loop gated on it, and the Solid runtime's `createInviewLoop`) read a covered element as out of
  view and wake as the cover lifts; loops inside the covering layer run on.
  `tests/surface-loop.spec.ts` and the cover's cases in
  `tests/solid/carried.spec.tsx`.
- Motion: `src/engine/spring.ts` is Apple's smooth spring (critically damped,
  from rest, settling to within a thousandth by its end, never past its
  mark; one shape at every duration), the `"spring"` easing name in
  `dither-paint.ts`. It also gives the curve as CSS `linear()`
  (`springLinear`) and the closest bezier (`SPRING_BEZIER`, within 3.5%)
  for stylesheets. The `"glide"` easing (`glide`, `GLIDE_BEZIER`, in
  `dither-paint.ts`) leaves at full speed and settles long and soft,
  never past its mark; the site eases everything on it
  (`packages/site/tests/motion.spec.ts`).

- `DitherCommand` is modal: Escape closes, Tab never leaves it (focus
  returns to its input; the list is arrow-driven), focus restores to the
  opener on close. With nothing matching it shows `empty`: a string, or a
  function that draws it instead, given the
  query.
- `DitherGauge` is an instrument dial, read-only
  (`role="meter"`, valued, named by its `label`, read out as the reading
  and the label): its geometry and its band live in `src/engine/gauge.ts`
  (one 240-degree sweep from the lower left, the band printed through
  `useDitherMatrix` filled to the needle, the zone past `warn` in the
  warning ink); ticks, numerals (every other major past six intervals)
  and the needle are SVG over it. A changed value settles on the kit's
  spring; reduced motion and a director's clock stand it on the reading.
  Guarded by `tests/gauge.spec.ts`.
- `DitherScope` is an oscilloscope screen (`role="img"`,
  named by its `label` or its wave): its trace lives in `src/engine/scope.ts`
  (a named wave or samples in -1..1 across a 5:4 screen; the beam bright
  where it moves slowly and faint on its edges, a glow on the rows beside
  it; a named wave's afterglow is the trace at earlier phases, so a moment
  prints the same however it was reached); the graticule is SVG over it.
  A named wave drifts at `speed` while on screen; reduced motion holds it
  and a director's clock sets its phase.
  Guarded by `tests/scope.spec.ts`.
- `DitherTabs` keeps its marker canvas (the underline or the
  wash) INSIDE the `relative` tablist, positioned from the selected tab's
  offsets: a list that scrolls (more tabs than width) carries the marker
  with its tab and clips it at its edges. Outside the list, it stayed put
  while the tabs scrolled.

- Zero imports from any other package — the kit must stay copy-out
  portable (docs promise: "copy the folder, alias it"). Dependencies:
  solid-js, d3-scale, d3-shape, clsx, tailwind-merge and Tailwind classes
  only (peer dependencies; `@stylexjs/stylex` is the StyleX package's).
- `palette.ts` is the single source of color truth: 7 seeds, each resolving
  fill/line/star hues. Swatch CSS vars in `packages/site/src/app/styles.css`
  mirror it.
- `pixel.ts` owns BAYER4, the print screens and bloom presets. `SCREENS`
  (`bayer`, `line`, `diagonal`, `dot`, `cross`; `SCREEN_KINDS`) are 4x4
  rank matrices, each a permutation of the sixteen ranks, so every
  `matrix[y & 3][x & 3]` painter takes any of them; `screenMatrix(screen,
  seed?)` jitters one exactly as `pixelMatrixFromSeed` jitters Bayer (the
  same bytes for `bayer`).
- `src/solid/runtime/screen.ts` is the ONE way a surface gets its matrix:
  `useDitherMatrix(() => seed)` reads the screen a `DitherScreen` around
  it provides (`ScreenContext`; Bayer without one), seeded as ever;
  the charts' contexts expose the same as `matrixOf(variant)`
  (`useVariantMatrix`, `resolveMatrix` when no screen is around). A
  screen that changes reprints a chart through `engine/chart-fill.ts`:
  `seriesFill`, `pieFill` and `radarFill` name everything a family's
  fill is printed from, each series' matrix among it; a loop reprints
  when that differs from the fill it holds, and the family's canvas
  reads the same function in its wake list, so a new input to the fill
  is added there once. A fill
  that carries a label (badge, toggle, button) keeps Bayer through
  `useLabelMatrix`, because a hatch under type breaks its letters.
  `precompile.ts` takes a `screen` option for surfaces that raster
  through it (the gradient passes its screen, the button does not).
  `DitherScreen` is only the provider (`screen`, default `diagonal`, its
  children). Pinned by `tests/screens.spec.ts` (the matrices) and the
  `DitherScreen` cases in `tests/solid/carried.spec.tsx`.
- `timing.ts` is the pure temporal core: DOM-free and clock-free. `steps()` is
  spec-locked to the css-easing-1 positions (jump-end/start/none/both),
  `frameSteps` derives a `frame(fps)` cadence, `frameIndex` is the wall-clock
  frame gate drivers paint through, and `cssSteps` serializes one config for
  the CSS surface so JS and CSS can never disagree. Drivers pick cadence and
  own the clock — the engine never reads time itself.
  `tests/timing.spec.ts` holds the MDN step-graph parity table; change code
  and table together.
- `sequence.ts` is the pure timeline algebra — the many-animations engine.
  Four node kinds (`track` | `serial` | `parallel` | `stagger`) flatten once
  via `planSequence` into scheduled tracks; `sampleSequence(plan, t)` maps any
  moment to every track (`before`/`active`/`done` + eased `progress`, `raw`,
  `cycle`). Clock-free like `timing.ts`; easing is the same `Easing` shape, so
  `steps()` composes into a sequence. Stagger origins (`start`/`center`/`end`/
  `edges`/index) live in the exported `staggerDelay`. Yoyo settling is
  continuous with the active legs: odd `loop` ends at 1, even at 0 — never
  jump a settled track. `Sequence.tsx` is the shared driver: it snapshots
  its children at start (rebuild via `restartKey`), writes `--seq-p` (eased,
  `toFixed(4)`) + `data-seq` per child with change-skipping, and owns an
  rAF clock whose first frame is dt 0 and whose wake has no time jump —
  the surface loop's semantics. IO gate and reduced-motion floor mirror
  `AnimatedContent`; the `frameRate` gate mirrors the background runtime with
  completion checked BEFORE the gate. `tests/sequence.spec.ts` (algebra) and
  the `Sequence` cases of `tests/solid/carried-motion.spec.tsx`
  (driver, hand-stepped frames — respect the 100ms dt cap when stepping
  fake time) pin both halves.
- `clock.ts` is the director — external ownership of time. Free-running,
  every animated surface owns its own rAF loop on wall time. `seek(ms)`
  directs them: the loops stand down and each surface paints exactly the
  given moment, in any order (same seed + same time → same pixels);
  `release()` hands time back. Surfaces subscribe with `onSeek` (a `null`
  moment means released → resume through their own `wake`), request no
  frames while `isDirected()`, and paint `directedTime()` when they start
  or wake under direction. Directed semantics per surface:
  the surface loop sets `clock = ms/1000 · timeScale` (pure
  renderers land on the exact frame) and passes `dt` = the step since the
  last directed moment (simulations advance in capture order, so those
  render with one worker; a moment that is not the next step, the first
  included, prints on a clean raster), holds a paused surface on its
  first frame (clock 0) whatever the moment, and prints the moment again
  when what its frame read changes (`holds()` is true while directed); the chart canvases run the entrance from
  composition time 0 and derive the sparkle tick from the moment;
  `Sequence` samples its plan at the moment; spinner, skeleton, progress,
  avatar, `CountUp` and `CurvedLoop` are pure functions of the moment;
  `DecryptedText` runs its reveal at 60 frames per second of the moment with
  a hashed glyph instead of `Math.random`. Pointer-driven motion (hover
  lifts, cursors, `HoldAction`) stays free: a renderer has no input. CSS
  keyframe and transition motion is not the clock's — HyperFrames seeks it
  itself through WAAPI. `directFromHyperframes()` takes direction from
  HyperFrames' `hf-seek` events (`detail.time` seconds): the contract the
  Studio's video export and `src/pages/play` rely on. Pinned by
  `tests/clock.spec.ts` and the directed cases in
  `tests/solid/carried-motion.spec.tsx`.
- The paint law: a surface updated in place paints the same pixels as one
  mounted fresh with the same props at the same clock time. What a
  component shows is derived from its inputs and the moment (a signal of
  progress or time, the text or count read off it in a memo), never a copy
  of a prop taken at mount or at a step; a canvas repaints when anything
  its paint reads changes (props, the screen around it, its box); a
  surface that keeps state between frames drops it where a fresh mount
  would not have it. Checked for every component row of the Studio's
  registry by `packages/site/tests/site/paint-law.spec.tsx` (each prop,
  the screen, the theme and the box changed in place against a fresh
  mount, both directed to one moment; `tests/support/paint.ts` reads what
  a canvas shows).
- `wipe.ts` is the wipe engine — ordered-dither reveal masks for any DOM.
  `wipeStyle(progress, { cell, seed?, direction, band, width, height })`
  turns a progress into CSS `mask-image/size/repeat/position` values: a
  dissolve (`direction: "none"`) tiles an n·cell SVG whose cells show once
  the threshold sweep passes them (one cell per step of the 8×8 Bayer
  `BAYER8` / `bayerMatrix(n)`, or the kit's seeded 4×4 with `seed`); a
  directional wipe (`right`/`left`/`down`/`up` = where the front travels)
  is a box-sized SVG with a solid front and four dithered density bands
  behind it (`band` cells wide), a dissolve until it knows the box; `iris`
  grows the front as a circle from `origin` (default the box's centre) to
  the farthest corner, its bands as rings. `invert` is the complement (the
  outgoing side): the two masks of one progress share no cell. Pure
  strings from pure numbers (cached by key): the same progress gives the
  same mask, `null` at 1 (remove the mask), the 1×1 empty mask at 0 (the
  other way round inverted).
  `DitherReveal.tsx` applies it to its children: manual `progress` (a
  timeline's — it runs no clock of its own), or a timed reveal
  (`duration`/`delay`/`easing`, `restartKey` replays) on the IO-gated rAF
  loop, its delay waited out before the first play and a pause resuming
  where it left off, the kit clock's moment when directed, shown at once under reduced
  motion; `reverse` hides instead; `data-reveal` = hidden|playing|shown.
  The Studio's reels cut between frames with it. Pinned by
  `tests/wipe.spec.ts` and the `DitherReveal` cases of
  `tests/solid/carried-motion.spec.tsx`.
- `transition.ts` is the transition engine: view transitions whose two
  snapshots meet through the wipe. `ditherTransition(update, opts)` runs a
  DOM change through `document.startViewTransition` and masks the new
  snapshot (and, with an `ink`, the old one inverted, its front leading by
  a fifth of the run, over the ink as the group's ground) every frame
  through one injected sheet; `target` scopes it to one element (a
  generated `view-transition-name`; the page leaves the snapshots and
  stays clickable, the ink takes the target's radius), else the page.
  `ditherViewTransition(transition, opts)` drives one the browser started
  (a cross-document navigation's, from `pagereveal`). The snapshots' own
  animations stop; a no-op animation holds the transition open until the
  first frame (whose clock starts the run, so a long task first holds the
  first state), then for the run, which drops it to end the transition.
  Without the API, under reduced motion or while the clock is directed,
  `update` just runs (a browser-started one is skipped). Pinned by
  `tests/transition.spec.ts`.
- `score.ts` is the score engine: a film's soundtrack synthesized from its
  cut, sample by sample, in plain arithmetic (polyBLEP oscillators, a
  state-variable filter, a ping-pong echo, Freeverb's hall; no Web Audio,
  no clock). `scoreCut(plan)` takes `{ seconds, clips (where each clip
  begins), marks? (chapter turns: a blip), ticks? (callouts landing: a
  tick), seed?, sampleRate? (44100) }` and returns stereo Float32 PCM: a
  pad that changes chord on every clip (a progression the seed picks) and
  resolves to D major on the last, the Bayer 4x4 as the arpeggio (its
  ranks pick the notes, the grid restarting on every cut) and as the motif
  over the first clip, a pulse that builds with the film and never plays
  under the last clip, a riser, an impact, a crushed noise wipe and the
  interface blip on every cut, the pad and bass pumped by the kick, nothing
  under 25 Hz, a soft clip to a 0.89 peak. `wavBytes(audio, seed)` writes a
  16-bit stereo WAV with seeded triangular dither. The same plan and seed
  give the same samples (it reads no time and no entropy). The Studio's
  films carry it into their videos and preview it. Pinned by
  `tests/score.spec.ts`.
- Type voice: the kit's controls speak `--font-mono` (Button, Badge,
  Toaster, Command), and every overlay that PORTALS to `<body>` carries
  it on its own panel — `DitherDialog`, `DitherAlertDialog`,
  `DitherDrawer`, `DitherContextMenu`, `CenterMorphModal` — because a
  portal leaves the host's font behind (the body's sans, not the page's
  voice). Where the panel takes `class`, a consumer's `font-sans` wins
  through `cn()`. New portaled overlays follow.
- Modal focus: every modal overlay holds focus through `FocusScope` (in on
  open, Tab cycling inside, back to its opener on close; only rendered
  controls are its Tab endpoints, never one hidden by CSS); `DitherDrawer`
  wraps its panel in one while `modal`. Pinned by the
  `FocusScope` and `DitherDrawer` cases of
  `tests/solid/w2part5.spec.tsx`.
- Styling contract: Tailwind is the kit's authoring tool, not a requirement of
  the app around it. `src/engine/theme.css` declares the shadcn-style tokens
  (`--background`, `--foreground`, `--card`, `--popover`, `--muted`,
  `--border`, `--ring`, `--accent`, their `-foreground` pairs, `--radius`,
  `--font-sans`, `--font-mono`, the `--swatch-*` mirror of PALETTE) light at
  `:root` and dark under `.dark` — plain CSS the app's `styles.css` imports
  under Tailwind (its `@theme inline` maps them to `--color-*` utilities and
  must stay in step) and every other styling system themes by redefining.
  `src/engine/base.css` is the box-model and form-control base the components
  assume (Tailwind's preflight is the global version the site uses), scoped
  under `.dither-kit` through `:where()` at zero specificity.
  `src/tailwind/kit.css` is the standalone entry: the two files plus
  Tailwind's utilities with `source(none)` and `@source` limited to
  `@dither-ui/kit/tailwind/` and `@dither-ui/kit/solid/`, in the
  `dither-kit.theme/base/utilities` layers; `packages/tasks/src/kit-css.mjs`
  (`buildKitCss`, called by the site's post-build; `npm run build:css` writes
  the file alone) compiles it with `@tailwindcss/node` + `oxide` into
  `kit/dither-kit.css` in the site's build (served at `/kit/dither-kit.css`),
  so an app on UnoCSS, vanilla CSS or any CSS-in-JS runs the Solid layer by
  loading one file, wraps the region in `.dither-kit`, and wins every cascade
  against the kit's layered rules (a StyleX app takes the `@dither-ui/kit-stylex`
  package instead, with `src/engine/theme.css` and `src/engine/base.css`);
  `class` on any component takes any class name (`cn()` merges Tailwind names,
  passes the rest through). `src/engine/theme.ts` sets the tokens from JS:
  `THEME_TOKENS`, `themeVars` (object of custom properties for inline styles
  or a vars contract), `themeCss` (a `:root` / `.dark` block), `applyTheme`
  (writes them on an element, returns the undo); `placeholder` is among them,
  optional. A component may use only Tailwind utilities, its own stylesheet
  and the tokens above — never an app class. Pinned by
  `packages/tasks/tests/kit-css.spec.ts` (the compiled file: tokens, scoped
  base, the utilities, no bare element rules), the stylesheet case of
  `packages/site/tests/site/cards.spec.ts` and `tests/theme.spec.ts`.
- Browser contract: web platform only, every engine. The floor is Tailwind
  v4's (Chrome 111, Safari 16.4, Firefox 128: `@layer`, `color-mix()` in
  oklab, container queries and units, `:has()`, `inert`); anything newer
  is feature-detected or degrades — `requestIdleCallback` (a timeout
  fallback), `startViewTransition` (checked), WebGL2 → WebGL1 with
  extensions (`gl.ts`, `world-gl.ts` leaves uvs unset there), `ResizeObserver`
  and `IntersectionObserver` guarded (no gate → play), `document.fonts`
  optional, `text-wrap`/`content-visibility`/`scrollbar-*` progressive,
  masks in both spellings (`DitherReveal` sets `mask-*` and
  `-webkit-mask-*`),
  `-webkit-background-clip` beside the standard one. `copy-text.ts`'s `copyText`
  is the one clipboard path: the async clipboard where it exists, else the
  selection + `execCommand` route (plain http, older engines, automation),
  returning whether it copied (the selection set by range too: iOS selects
  nothing in a readonly field through `select()`). No engine-specific APIs
  (`scrollIntoViewIfNeeded`, `scheduler.postTask`, file pickers) anywhere.
- Touch (iOS WebKit, where pointerdown's preventDefault does not stop a
  scroll): every control a finger drags sets `touch-action` (`touch-none`;
  the slider, knob, colour planes, scrub grip, slide and hold actions,
  signature pad, drawer handle; a model orbits under `pan-y`) and ends its
  drag on `pointercancel` as on `pointerup`. A list option (select,
  combobox, autocomplete) keeps focus on `pointerdown` and picks
  on `click`, so a finger that scrolls the list picks nothing. The video
  player falls back to the video's own fullscreen
  (`webkitEnterFullscreen`) where an element has none (an iPhone) and
  shows its volume slider only where volume is not locked (iOS ties it to
  the hardware buttons): `:volume-locked` where the engine knows the
  selector (a write there can read back, then revert), else a write that
  must read back.
- `keyframes.ts` + `DitherStage.tsx` + `DitherLayer.tsx` are the keyframe
  engine in container units. `parseLength` turns px numbers and any CSS
  length (`calc()` sums included) into unit terms, `lerpTerms` interpolates
  term by term, `termsToCss` prints one unit plain or several as a
  `calc()`, `termsToPx` resolves against a box (cq units from the box,
  percentages by axis, viewport and font from an env); angles read in deg,
  turn, rad or grad. A `KeyframeTrack` is keys over seconds or percentages
  (`at`; unplaced keys spread evenly like CSS), `duration` (else the last
  key's seconds, else 1), `delay`, `loop` (count or forever), `yoyo`, an
  easing between keys that a key's own `easing` overrides for the segment
  it starts (`EasingInput` or any `Easing` function, so `steps()`
  quantizes); `compileTrack` resolves it once, `sampleKeyframes(track, t)`
  gives state (before/active/done — `Infinity` is any track's settled
  end), cycle, progress and every property: lengths (x, y, custom
  lengths) as terms, numbers (angles, scales, opacity, custom numbers);
  `keyframeTransform` prints the CSS transform with the units kept — the
  browser measures the container — or in px against a box; `resolveSample`
  gives every property as px/degrees (vertical names resolve percentages
  against the height). `DitherStage` is a size query container
  (`container-type: size`, `--cq-w/--cq-h`) owning one clock: the
  visibility-gated rAF loop (dt capped, `frameRate` stop-motion, `speed`,
  looping over `duration`), the kit clock's moment when directed, held
  under reduced motion (layers then sit at their end); it provides `STAGE`
  (time, box, reduced) and `data-stage` (playing/directed/paused/still).
  `DitherLayer` samples its track at the stage's moment and writes
  `transform` in the keyframes' own units, `opacity`, `--layer-p` and
  `--layer-<name>` per property, `data-layer` state, and hands its
  children every property resolved to px/degrees plus progress, cycle, time, width,
  height — the numbers a canvas painter needs; without a stage it holds
  its first key. Pinned by `tests/keyframes.spec.ts` and the
  `DitherStage and DitherLayer` cases of
  `tests/solid/carried-motion.spec.tsx` (hand-stepped frames and
  observers, directed seeks, reduced motion).
- `containers.ts` + `DitherContainer.tsx` are the container-query engine —
  children answer to their OWN box, never the viewport (the responsive half
  of the animation stack). The pure core resolves a content-box width
  against a named `CqScale` with CSS range semantics (min inclusive / max
  exclusive — a boundary belongs to the wider bucket; declaration order
  irrelevant; active = highest matching min, `matches` = every overlapping
  bucket, null/-1/[] when nothing matches or the width is non-finite), and
  `quantize(value, step)` is the SPATIAL half of the step idea (`timing.ts`
  quantizes time; step ≤ 0 is identity, output never negative). The wrapper
  sets native `container-type: inline-size` + `container-name` (stylesheet
  `@container` route), observes itself via ResizeObserver `contentRect`
  (transform-safe, `use-chart-dimensions` precedent; silent without the
  observer; an observation is applied on the next frame, the latest
  winning, never inside the observer's delivery: a new bucket resizes the
  box it observes, a loop the browser reports on the window; a
  setTimeout(0) `clientWidth` guard fires only if nothing
  reported — never overwrite a real observation with the zero read), and
  publishes `data-cq` (active bucket) + `--cq-w`/`--cq-h` (content-box size,
  raw or quantized together) + `--cq-i` (ordinal) + its children's scope
  `{ width, height, size, index, matches }`. Its stylesheet ships the
  container-relative reference keyframes `dither-cq-traverse`
  (translateX ±100cqw) and `dither-cq-rise` (translateY ±100cqh): motion
  measured against the query container, small-viewport fallback when none —
  never vw/vh, never the animated element's own box (the container units
  cases of `tests/solid/carried.spec.tsx` guard the units and the
  viewport leak).
  Unmount disconnects the observer and clears the timer (leak contract).
  `tests/container.spec.ts` (boundaries, ordering, overlaps, quantize) and
  the `DitherContainer` cases of `tests/solid/carried-motion.spec.tsx`
  (observer, var/attr writes, scope state, silent-observer fallback) pin
  both halves.
- Seed-generative contract: a `number` is a deterministic SEED everywhere a
  visual input is accepted — `VariantInput` (texture via `textureFromSeed`),
  `BloomInput`/`PixelBloomInput` (`bloomFromSeed`; pixel.ts mirrors the exact
  PRNG+ranges, keep them in sync), `EasingInput` (`easingFromSeed`), and hue
  colors. The dither MATRIX itself is seeded (`matrixFromSeed` /
  `resolveMatrix`, mirrored as `pixelMatrixFromSeed`) — the threshold pattern
  varies per seed. Luminance coefficients (alphaFloor/alphaRange/intensityLift)
  live in `TextureConfig` and seed with the texture. The live-edge effect is
  GENERATIVE, not a preset: `effectFromSeed` returns `EdgeEffectParams` (drift
  x/y, gravity, twinkle, trail, spread, flow, burst) — a point in a continuous
  motion space — and `glyphFromSeed` returns the particle SHAPE (a `Glyph`:
  core + seeded rays → dot, plus, x, streak, asterisk). Seeds yield infinitely
  many behaviors AND shapes (sparkle/rain/comet are just regions). ONE particle
  loop stamps any glyph moving any way; add variety by widening the param
  space or glyph generator, NEVER by adding a branch. The `effect` prop is a
  NUMBER seed that pins the motion independent of the master seed (else master
  seed, else a gentle default). Sparkle character (twinkle freq, star
  brightness/burst, crosshair alpha) still seeds via `sparklesFromSeed` for the
  crosshair; the master `seed` flows to the cartesian canvas through
  `ChartContextValue.seed` so star positions AND render coefficients derive
  from it. The ENTRANCE reveal is seeded (`revealFromSeed`): jitter=0 is a
  clean sweep (optionally reversed), higher jitter dissolves the fill so it
  develops out of order — half of all seeds stay a clean sweep. A column's
  dissolve threshold is `revealThreshold` (capped at 1, so the finished
  reveal holds every column; the cartesian canvas calls it).
  Chart roots take a master `seed` prop deriving duration, delay,
  easing, stagger, sparkle character, geometry, matrix, bloom (+ startAngle on
  polar) with precedence: explicit prop > seed derivation > house default. All
  seed fns live in `dither-paint.ts` (mulberry32, params clamped to usable
  bands) — extend seeds there, never in per-component paint loops.
- `DitherSpinner` is generative like the charts: `spinnerFromSeed` samples three
  axes — SHAPE (0 circle ring / 1 square box-ring / 2 bar; each cell gets a
  path coord `t` walking that outline via `squareT` for squares), FLOW (0 sweep
  comet / 1 pulse breathe / 2 travelling wave), and DETAIL (arc/taper/segments/
  spokes/innerRatio). One seed → a rotating ring, a breathing square, dashes
  racing a bar, a travelling-wave donut. ONE render loop resolves membership+t
  by shape then brightness by flow — add variety by widening the axes, never by
  branching per preset. Default (no seed) is a clean rotating circle arc.
- `FaultyTerminal` is a CRT glyph wall: `faulty-terminal.ts` lights a grid of
  glyph cells with animated value-noise/fbm, then applies scanlines, glitch,
  flicker, chromatic aberration, barrel curvature, tint and ordered dithering.
  It is a WebGL-free reimplementation (canvas + Bayer only; `DitherShader` is
  the one surface that uses WebGL, as a GLSL evaluator) — the `dither` prop
  is the ordered-threshold intensity (0 smooth -> 1 hard 1-bit). Its root is
  `relative h-full w-full` (self-sizing), NOT `absolute inset-0` like
  DitherGradient, so it renders filled in Studio's generic widget renderer and
  registers as an ordinary `COMPONENT_REGISTRY` entry instead of a bespoke kind;
  pass `class="absolute inset-0"` to use it as a background layer.
- `Ferrofluid` is the same family: `ferrofluid.ts` fuses two fbm layers with a
  smooth-max (metaball union tuned by `fluidity`), lights the iso-surface's
  contour rim, tints it across the `colors` array by height, then shimmer-grains
  and ordered-dithers it. Same WebGL-free, self-sizing, generic-registry rules
  as FaultyTerminal; the pointer raises a magnetic spike eased by
  `mouseDampening`, and `dpr` scales the backing resolution.
- `Aurora` (`aurora.ts`) is the same family: fbm drives a wavy curtain edge lit
  into vertical rays and tinted across the `colors` ramp by width. All the
  generative background surfaces (FaultyTerminal, Ferrofluid, Aurora, and the
  ones that follow) share these rules: WebGL-free canvas + Bayer, a self-sizing
  `relative h-full w-full` root, and an ordinary `COMPONENT_REGISTRY` entry.
- `Circuit` (`circuit.ts`) is a board: `circuitBoard(cols,
  rows, { density, pitch, seed })` lays chips on a lattice (a node of
  clearance each) and routes traces from their pins, then free runs, in
  straight runs with 45 degree jogs that never take a held node nor cut a
  diagonal between two, ending in a via or a pad; `boardFor` keeps a few
  boards by size and knobs; `paintCircuit` prints the packages (rim,
  dithered body, pin-one notch), the traces a shade under `ink`, and a
  signal per trace whose head (`signalHead`, a pure function of time)
  runs in `pulse` with a `SIGNAL_TAIL` fading through the thresholds.
  Guarded by `tests/circuit.spec.ts`.
- `HeatTrail` (`heat-trail.ts`; exported as `DitherHeatTrail`) is the
  pointer printing: heat per cell, `trailTo` stamps the kit's diamond
  (hottest at its heart, its rim `RIM_COOL` cooler, so a stroke cools from
  its edges in and tapers like a comet, never one width along) at every cell from the stroke's last point, so a
  fast hand never leaves a gap, `trailLift` ends a stroke, `coolTrail`
  takes the same heat from every cell (`dt / cool`) until the field is
  exactly empty, and `paintTrail` shows a cell while its heat clears its
  threshold, in the ramp's ink for its heat (coolest first). The
  component listens on the window (content over it never blocks the
  hand), ignores a finger (it scrolls) and reduced motion, and paints only
  while something cools. `pinned`: a box fixed to the viewport over a
  scrolling page, whose print rides the page (`scrollTrail` moves the heat
  whole cells and lets go of what leaves). Not `PixelTrail` (coarse blocks fading by alpha,
  one cell per event). Guarded by `tests/heat-trail.spec.ts`.
- `world.ts` + `models.ts` + `world-gl.ts` + `DitherWorld.tsx` are the 3D
  surface. `models.ts` parses model files into a `World`, bounded against
  a hostile file: a scene graph is walked for at most `MAX_NODES` (shared
  DEF/USE instances counted each time), a list or face a file declares is
  held to the tokens it carries, an ElevationGrid to 1024 posts a side;
  meshes (faces,
  lines or points; positions in world space, or node space when animated;
  palette indices for the material and, when the file colours faces or
  vertices, per triangle — a world holds ≤ 255 colours, the rest snap),
  nodes (animatable transforms with sampled tracks), directional lights,
  the headlight flag, the first viewpoint, a bounding sphere at time 0 and
  the cycle length. `MODEL_FORMATS` lists them, the one source of
  `ModelFormat` (the docs' Engine index counts it). Formats: VRML97 / X3D
  classic and VRML 1.0 `.wrl` (one
  lenient tokenizer + node grammar — DEF/USE, PROTO/EXTERNPROTO skipped,
  ROUTEs collected, enums, bare children for 1.0's Separator state machine;
  Transform/Group/Switch/LOD/Shape/Material/IndexedFaceSet (+ Color per
  face or vertex)/IndexedTriangleSet/TriangleSet/IndexedLineSet/PointSet/
  Box/Sphere/Cone/Cylinder/ElevationGrid/Viewpoint/DirectionalLight/
  NavigationInfo; 1.0's Translation/Rotation/Scale/MatrixTransform/
  Coordinate3/ShapeHints/Cube), X3D XML (`parseXml`, a small element +
  attribute reader, mapped onto the same nodes by containerField), glTF 2.0
  (`.glb` chunks or `.gltf` JSON with data: URIs; external buffers come
  pre-fetched through `ParseOptions.resources`, listed by
  `externalResources`; accessors with strides and normalized ints,
  triangles/strips/fans/lines/points, baseColorFactor, doubleSided,
  COLOR_0, node TRS or matrix, the FIRST animation's translation/rotation/
  scale channels incl. STEP and CUBICSPLINE values), Wavefront OBJ (`v`/`f`
  with slashes and negative indices, `l`, `p`, vertex colours, `usemtl`
  groups coloured from the `mtllib` via `parseMtl`), STL (ASCII + binary,
  two-sided, z-up swung to y-up by default), PLY (ASCII, binary little and
  big endian; vertex and face colours, edges, point clouds; a binary vertex
  element of float32 Gaussians, a trained capture, becomes splats) and OFF
  (face colours), and Gaussian captures (`splat`: the 32-byte `.splat`
  record). Splats live in `splats.ts` (no world import; world.ts imports
  it): a `SplatCloud` (positions, covariances from scale and rotation,
  colours, opacities, at most `MAX_SPLATS`, every k-th past it) on
  `World.splats`, its colours snapping to a 6-level colour cube in the
  palette; `finishWorld` bounds it without its stray splats (2nd to 98th
  percentile); `layCapture` composites it over either engine's target
  (each Gaussian's 2D footprint through the perspective's Jacobian with a
  cell's blur, a counting sort near to far, front to back until a cell is
  opaque or a nearer mesh stands there; covered cells take the cube entry
  and their luminance as the shade, their depth where they turned half
  opaque), so the shared pass prints a capture like a mesh. A capture's y
  runs down: `up` defaults to "-y" for one. Guarded by
  `packages/site/tests/splats.spec.ts`. Animation: a VRML `TimeSensor` →
  `PositionInterpolator` /
  `OrientationInterpolator` → `ROUTE … set_translation/rotation/scale`
  chain (also X3D's `<ROUTE>`) makes that Transform a `WorldNode` whose
  tracks hold keys in seconds (key × cycleInterval, loop, startTime);
  everything static between nodes folds into the node's `pre` matrix and
  static meshes stay baked. `world.ts` is the engine: column-major mat4 +
  quaternion math (`composeTransform` = T·C·R·SR·S·-SR·-C), the VRML
  primitives (y up, CCW outward), `addMesh` (bakes the matrix, reverses
  rings for `ccw FALSE` or a mirroring matrix, fan-triangulates, keeps
  polygon outline edges with their owning triangle, registers colours),
  `sampleTrack` (lerp / step / shortest-path slerp, looping or clamped),
  `nodeMatrices(world, t)` (cached per time), `posedPositions`,
  `finishWorld`, `cameraOf` (orbit camera around the sphere: `yaw`/`pitch`
  degrees, `zoom` 1 frames the sphere, eye never inside it, camera-space
  lights) and the two-stage renderer: stage one fills a `WorldTarget`
  (shade 0-1, depth from the eye, palette index + 1) — `rasterizeWorld` is
  the CPU engine (edge-function rasterizer with a z-buffer, flat Lambert
  from the headlight + the file's lights, back faces culled on solid
  meshes, per-vertex fbm `meshGrain` interpolated into the shade) and
  `world-gl.ts` (`createWorldGpu`) is the GPU engine: the same contract
  through WebGL2 (WebGL1 with derivatives + uint indices), flat normals
  from derivatives, the colour index as a vertex attribute (expanded
  buffers for per-face colours), node poses as a per-mesh matrix uniform,
  a 16-bit depth code read back into the target — on WebGL2 through its
  own two-attachment framebuffer, so the texture coordinates come back too
  (`packUv`'s encoding: 16-bit s, 16-bit t offset by one, 0 = no uvs);
  WebGL1 leaves them unset. Stage two `paintTarget`
  is shared and never knows the engine: fill mode thresholds the shade
  against the Bayer cell (lit cells take the fill at full alpha, the rest
  `shade` alpha), `material` does the same in the file's colour, `ramp`
  (the kit's `sampleRgbGradient` palette engine) picks a band by lighting
  and dithers between bands over an opaque silhouette with `dither` 0-1
  blending to the smooth gradient, `fog` fades by depth, `texture` (a
  RasterBuffer) wraps a raster onto the model through the target's uvs —
  the texel under the cell (repeating), its alpha in the shade, meshes
  without uvs keep the fill; then outlines
  (`wire`, owning-triangle facing, never a fan's diagonals), line sets and
  point sets draw depth-tested against the finished z-buffer. `paintWorld`
  = CPU stage one + stage two; same world + time + view + style → same
  bytes. `sampleWorld(seed)` writes the default content as real VRML97
  text with its own TimeSensor/ROUTE animation (seed-generative like
  everything else). The component loads `src` (fetch, format by name then
  by sniffing, side files resolved relative to it) or inline `source`,
  derives the initial pose from the file's Viewpoint when
  `yaw`/`pitch`/`zoom` are unset, poses the file's animation at the kit
  clock (`animate`, or a pinned `time`), picks the engine (`auto` = GPU
  above ~40k triangles, CPU otherwise; a forced `gpu` that fails says why
  and falls back), draws the bloom layer (`pixelBloomStyle`) in
  `afterPaint`, orbits by pointer drag (`touch-action: pan-y`) and arrow
  keys (focusable `role="img"`, `data-engine` says which engine drew), and
  shows an honest note for loading/empty/error. Light a model gives off:
  `World.glows` lists the palette entries that glow (a VRML face whose
  Material has an `emissiveColor` takes it, through `addMesh`'s `glow` and
  `colorIndex`'s, an entry never shared with a plain face of the same
  colour), and `paintTarget` paints them in their own colour, the shade
  lifted to `GLOW_FLOOR`, whatever the mode (fill, material or ramp).
  A model is also a build
  (`src/engine/assemble.ts`, `createAssembly`): it comes apart once into its
  pieces (each connected run of triangles, union-find over shared
  vertices, so a model comes apart along its own seams), and `frame(view,
  camera, { build, scatter, nudge }, dt)` hands the renderer a world of
  plain static meshes for that moment, so both engines and the shared
  paint draw it unchanged: pieces start shape by shape in the order the
  file gives them, each shape's pieces by height (a flat shape, a floor
  or a plate, from its middle out; seeded jitter), each flying in from beside its place over `ARRIVAL` of the
  build on the kit's spring and painted in the heat (its own glowing
  palette entry, `Assembly.hot`) until it lands; pieces not yet started wait as
  a dotted cage of their outlines (a points mesh); `scatter` pushes and
  turns them outward; `nudge` leans the pieces near a point on the target
  away from it, eased back by `dt`. Whole and still it is the model as it
  was. A piece's turn is taken as a cosine and sine once a frame, never
  per vertex, a static model's cage dots are laid once per edge and
  copied in, never pushed dot by dot each frame, and the pose is pinned
  bit for bit (`POSE_HASH`). `DitherWorld` takes `build`, `scatter`, `heat` (the hot colour,
  the ember by default) and `nudge` (the pointer's point); it takes the
  model apart only when one of them asks.
  `packages/site/tests/assemble.spec.ts`.
  Running on the CPU engine's plain case (no GPU, no GLSL material, no
  channels, not directed, not paused) it paints in a worker
  (`src/engine/world-offload.ts`, the page's side: each paint shows the
  worker's latest moment and asks for the one due at the next paint;
  `src/engine/world-ask.ts` + `src/engine/world-worker.ts`, the worker's: it
  keeps the model, handed over once, and its assembly), the same bytes the
  page would paint; the first paint, a worker that fails to load and a
  page without workers paint here (`tests/world-offload.spec.ts`).
  `tests/world.spec.ts`,
  `tests/vrml.spec.ts` and `tests/models.spec.ts` pin the engine, the
  grammars and every format. Texture coordinates: `Geometry.uvs` (st per
  point; (0, 0) is the texture's top-left) or per corner through
  `faceUvs` — `addMesh` then bakes one vertex per (point, uv), so a seam
  splits and equal corners share; the primitives carry theirs (box faces
  whole and upright, sphere equirectangular, cylinder and cone sides
  unrolled with planar caps, elevation by grid), the parsers read OBJ `vt`
  (t flipped), glTF `TEXCOORD_0` (as is), VRML `TextureCoordinate` +
  `texCoordIndex` (t flipped; X3D through the same builder) and PLY
  `s`/`t`; `WorldMesh.uv` per vertex interpolates perspective-correct into
  `WorldTarget.uv` (s = -1 where a mesh has none).
- The render graph: every surface on the surface loop is a
  `DitherSurface` — `raster()` (the last painted buffer), `pull(ms)`,
  `version()`, `canvas()` — returned by `createDitherBackground`, handed
  out by `DitherWorld`/`DitherShader` (their `ref` callback's `{ surface }`)
  and reachable
  from any kit canvas through `surfaceOf(canvas)`. `pull(ms)` is the edge
  contract: under direction it paints the moment `ms` on demand when the
  source has not painted it yet (a moment paints once — the clock's own
  call then agrees), free-running it returns the latest raster; so a
  consumer always reads a source at its own time stamp whatever order the
  clock reaches them in, and a chain of surfaces seeks and renders as one.
  Consumers: `DitherShader.channels` binds up to four sources as
  `iChannel0..3` (a surface, what a component hands its `ref`, a kit
  canvas → its surface; any other canvas, image or video → its current pixels, uploaded
  upright with FLIP_Y, nearest-sampled, `iChannelResolution` set — all
  through `gl.ts`'s `createChannels`), `DitherWorld.channels` skins the
  model: without a shader the first channel is the texture (`rasterOf`
  turns it into a raster — a surface's own at the moment, or an image,
  canvas or video read through a 2D context at up to 512 px — and
  `paintTarget`'s texture mode samples it per cell on either engine), and
  `DitherWorld.shader` is a GLSL material over the finished target:
  `wrapMaterial` wraps `mainMaterial(out vec4, in vec2)` (or a Shadertoy
  `mainImage`) with `dk_cell/dk_shade/dk_depth/dk_covered/dk_color` over
  the target packed by `packTarget` (R shade, G palette index + 1, B+A a
  16-bit depth across the bounding sphere, empty cells far), the palette
  as a 256x1 texture, and `dk_uv` (the cell's st, t flipped to GL's) /
  `dk_textured` / `dk_texture` (iChannel0 at `dk_uv`) over the uv map
  packed by `packUv` plus the material's own `iChannel0..3` (the
  component's `channels`, uploaded after the three maps); `createWorldMaterial` runs it on the
  component's context (shared with the GPU engine; each pass sets its own
  GL state) and `paintMaterial` thresholds the readback's alpha against the
  Bayer cell with the readback's rgb (zero stays clear, so a material may
  ink outside the silhouette), then `drawOverlays` as usual. Pinned by
  `tests/surface.spec.ts` (the pull contract under a fake 2D context) and
  the material cases in `tests/world.spec.ts` / `tests/shader.spec.ts`.
- `gl.ts` is the kit's one piece of WebGL plumbing, shared by the GLSL
  surface, the world's GPU engine and the material pass: `createGl` (an
  offscreen WebGL2 or WebGL1 context, context-loss flag, `size`, `read`
  back, `readBehind` (WebGL2: the read into a pixel buffer behind a fence,
  collected on a later call once the GPU is done, an earlier draw's
  pixels or null; never a stall; WebGL1 reads at once;
  `tests/gl-readback.spec.ts`), `dispose`), the program in steps that never
  wait on the driver until asked: `startProgram` (both stages and the link
  handed over, no status asked), `programReady` (KHR_parallel_shader_compile's
  completion status; ready where the driver cannot say), `finishProgram`
  (the program or the compiler's first line: fragment, vertex, then link),
  `dropProgram`; `buildProgram` is start and finish at once, for programs
  needed now (the world's engines; `tests/shader-compile.spec.ts`), and
  the channel binding: `ChannelInput` (a surface, what a component
  hands its `ref`, a kit canvas → its surface; any canvas, image or video),
  `bindChannel`, `createChannels` (the four textures of one program,
  re-uploaded only when a surface painted, FLIP_Y upright,
  `iChannelResolution` / `iChannelTime`) and `rasterOf` (the same input as
  a raster for the CPU engines). The GPU is only ever an evaluator — every
  surface still dithers on the CPU.
- `shader.ts` + `DitherShader.tsx` are the GLSL surface. The pure half:
  `wrapShader` builds a program around a user fragment shader — Shadertoy's
  `mainImage` gets the Shadertoy uniforms plus the kit's (`iColor` the
  component colour 0-1, `iSeed`, and `dk_bayer4(fragCoord)`, the 4x4 Bayer
  threshold in closed form) and a `main` (GLSL ES 3.00 under WebGL2, 1.00
  under WebGL1), a raw `main` compiles as written (default float precision
  added when missing, `#version 300 es` honoured) — and
  `ditherShaderPixels` turns the GPU readback (rows bottom-up) into the
  raster: colour mode quantizes each channel to `levels` through the Bayer
  cell (2 = the eight-colour look), mono thresholds luminance into the tint
  with a `shade` floor, a `palette` ramp dithers luminance across its bands
  (`sampleRgbGradient` for the smooth end of `dither`); the shader's alpha
  carries. The component owns one `gl.ts` context at the cell resolution
  (released on unmount), feeds `SHADER_UNIFORMS` (the Shadertoy set, the
  kit's, and the glslsandbox / Book-of-Shaders aliases), reads back and
  dithers each frame (running, through `readBehind`, a paint behind and
  never a stall; a paused surface's frame and a directed moment through
  `read`, exact); `iTime` is the kit clock, so it seeks and renders
  like every surface (HyperFrames' renderer has WebGL2 through SwiftShader
  — verified by a real render). Without WebGL it shows "WebGL is not
  available"; a compile error shows the compiler's first line. Its first
  cost, the context and the program's compile, is started at idle as it
  comes within a screen of view (never for one far off, so a page of
  shaders holds no contexts it never shows): paid in its first frame it was
  a stall just as it came into view
  (`tests/solid/carried-shader.spec.tsx`). The
  compile runs in the driver's background: a running shader holds its
  raster and asks `programReady` each frame, collecting the program once it
  is; a paused frame or a directed moment collects it at once, exact
  (`tests/shader-compile.spec.ts`, `tests/solid/carried-shader.spec.tsx`).
  `sampleShader(seed)` is the seeded default source. `tests/shader.spec.ts`
  pins the pure half.
- `src/engine/surface-loop.ts` (`createSurfaceLoop`; bound to a component by
  `src/solid/runtime/surface.ts`'s `createDitherBackground`) is the single
  shared runtime
  for that family: throttled rAF loop, backing buffer + upload, visibility gate,
  resize, dpr, static/reduced-motion single frame, and the mount/restart/teardown
  lifecycle. It returns the surface's `DitherSurface` (see the render
  graph). `cell` is a number or a getter (a `cell` prop); `afterPaint`
  runs after the upload with the canvas (bloom layers copy it). `paused` holds
  the raster but never leaves it blank: the first frame, and the frame after
  a restart, still paint before the loop stands down (so a paused surface
  repaints when a `restart` source such as a drag changes); a surface out of
  view at first paints that frame as it comes into view, and a pause that
  lands before it keeps it (`tests/surface.spec.ts`). A restart keeps a paint already queued: a `restart` source driven
  every frame (a `time`, a `scatter` from the page's own clock) once
  cancelled each queued paint and starved the surface until the driving
  stopped (`tests/surface.spec.ts`). A still surface
  (static mode, reduced motion) paints its one frame in `start()` and the
  visibility wake never starts the loop behind it — it did once, and every
  background animated under reduced motion as soon as it scrolled into view.
  A held frame (static mode, reduced motion, paused) is printed from what
  its `render` read, so it prints again when one of those changes, the
  moment kept (no restart, no entrance replay, `startNow` untouched): the
  core's `holds()` says a paint leaves such a frame and `repaint()` prints
  it again, a still frame after the framework's pending changes and never
  beside a restart the same change caused (one change, one paint), a paused
  one through the loop, once, where it shows or as it comes into view;
  nothing while the loop runs (it reads its inputs every frame), before the
  mount or for a precompiled surface, and under the kit clock's direction
  the print waits for the release. The Solid binding tracks `render`'s
  reactive reads while the frame is held (`createReaction`) and calls
  `repaint` on the first to change, so a component names no paint input:
  its `restart` list holds only what must start the run over. A `render`
  must not write a signal it reads on every paint.
  (`tests/surface-loop.spec.ts`; the held-frame cases of
  `tests/solid/kit.spec.tsx`.) A surface outside this loop that paints a
  still frame lists every input its paint reads in its own repaint effect,
  its `useDitherMatrix` matrix among them (`DitherSpinner`, `DitherAvatar`,
  `DitherGradient`'s seed; the same cases).
  Its optional `frameRate` getter gates painting on
  `timing.frameIndex` boundaries — between boundaries the raster is held
  (stop-motion cadence, no upload), 0/undefined keeps the smooth ~30fps
  throttle. Both cadence gates run BEFORE `measure()` — a held frame never
  reads layout (gating the per-vsync `getBoundingClientRect`/`getContext`
  cut script time 28% on three 8fps surfaces), and a boundary is consumed
  only by a frame that actually paints. A painting frame reads nothing from
  the page either: the element's box is read once and then only when the
  ResizeObserver reports (after layout, so free), the canvas's context is
  asked for once per element, and the observer's report repaints a held
  surface only where it shows (its first report on observe painted every
  paused surface down the page at load); a surface first painted out of
  view waits for the visibility wake (`tests/surface.spec.ts` counts the reads).
  Every paint books its time against one budget a frame
  (`src/engine/frame-budget.ts`, `FRAME_BUDGET_MS` 8, shared by every surface):
  past it a due paint waits a
  frame, consuming nothing, and one that waited always paints, so no
  surface runs more than a frame late and where several cadences meet the
  frame holds the budget and one paint, not all of them
  (`tests/frame-budget.spec.ts`).
  EVERY background component exposes the matching `frameRate` prop
  (default 0) and passes it through; the studio registry row and the docs API
  table carry the same row. A new
  background is just an engine `paint*` fn plus a thin `.tsx`
  that resolves props and passes a `render(buffer, clock, dt, elapsed)` callback —
  never re-implement the loop per component. Per-frame extras stay in `render`:
  page-load fade reads `elapsed`, eased pointers read `dt`.
- `poster.ts` + `DitherPoster`: the palette printed as tone.
  `posterLayout(seed, inkCount)` cuts the surface into 3 or 4 columns of 1
  or 2 tiles (a tile's ink never the one above it, nor with three inks or
  more the one beside it), each running its ink along a ramp (down or
  across; some solid) through the screen into a second ink or the ground,
  and places the kit's diamond (sized by the surface's shorter side and
  landing whole while it fits, so a portrait print keeps it; a mark grown
  past half the surface eases to its middle, so a swell can cover the
  surface whole with no jump), inside which every
  tone turns over (the tiles' negative) and the screen slides `speed` cells a second on the
  clock; `ground` `transparent` leaves open cells clear. Its screen is the
  one around it, else Bayer. Pinned by `tests/poster.spec.ts`.
- `format-number.ts` (`formatFixed`) is how a counter
  prints a number with its decimals fixed: one `Intl.NumberFormat` a
  precision, made once (`toLocaleString` with options built one a call, a
  rolling `CountUp` one a frame); `CountUp` and `NumberFlow` use it.
- `noise.ts` is the single source for the 2D value-noise/fbm those surfaces use;
  `sampleRgbGradient` in `palette.ts` is the single out-param colour-ramp
  sampler they tint with. Add new generative backgrounds on top of both — never
  re-derive hash/valueNoise/fbm or a per-pixel gradient lerp per component.
  `fbm` keeps each octave's last lattice cell and its four corner hashes, so
  a raster walk hashes once per cell crossed; its output stays bit-identical
  to summing `valueNoise`.
- Perf seams (measured on the docs page, 6x-throttled mobile):
  `ScrollReveal` measures via `getBoundingClientRect` at most once per frame
  (rAF-coalesced; its first measure lands before first paint — a direct
  mount-time call measured the whole dirty document for ~2s), and
  `DitherImage` defers its `src` fetch behind an IntersectionObserver
  (400px rootMargin, eager fallback when the observer or element is missing) —
  never pull the source at mount when the frame is offscreen.
- Loop visibility contract: self-scheduling rAF loops in the text/animation
  family (CurvedLoop, ScrollVelocity, TextCursor, TextPressure,
  VariableProximity, GhostCursor, BlobCursor, Antigravity) run through
  `src/solid/runtime/in-view.ts` (`createInviewLoop`) — `start` only on the
  first IntersectionObserver hit,
  `stop` when the host leaves, `start` idempotent, never an optimistic start
  at mount (measured: ungated demos burned ~440 rAF/s offscreen on docs).
  Without IO the loop is always-on — the old behaviour, which is what jsdom
  tests get. A new looping component uses this runtime, never a bare
  mount-time `requestAnimationFrame` chain.
- Per-letter text keeps its words wrappable: `VariableProximity` (both
  ports) renders a space as a plain space between the letters' spans (no
  `\u00a0`), so a sentence breaks between words, never inside one, and
  the letters stay the root's only element children for the frame walk.
- Text animations (`GradientText`, `ShinyText`, `GlitchText`, `SplitText`,
  `RotatingText`, `CountUp`, ...) are a separate family: pure DOM/CSS (or a small
  rAF for counting), NOT canvas/Bayer. They still ship as `Dither*` exports,
  register in `COMPONENT_REGISTRY`, and must honour `prefers-reduced-motion`
  (CSS `@media` or `pixelPrefersReducedMotion`). Wrapping effects take arbitrary
  text as children; char/number effects take a `text`/`to` prop. Docs live in
  `packages/site/src/pages/docs/text/`.
- Interaction/motion effects (`AnimatedContent`, `FadeContent`, `Sequence`,
  `Reveal`, `Stage` + `Layer`, `GradualBlur`, `StarBorder`,
  `ElectricBorder`, `GlareHover`, `Magnet`, `ClickSpark`, ...) are
  another DOM/CSS/pointer family: wrappers of their children (reveal-on-view, animated
  borders, hover glare), timeline-driven children (`Sequence` writes
  `--seq-p`/`data-seq` — see its engine bullet), the container-query scope
  (`DitherContainer` — `data-cq`/`--cq-*` + scope state; and
  `AnimatedContent.distance` accepts CSS length strings — `"4cqw"` makes a
  reveal measure its parent container, numbers stay px), or area wrappers
  (cursor +
  click effects on a canvas
  overlay). Same rules: `Dither*` export, `COMPONENT_REGISTRY` entry (wrappers use
  `slotText`), reduced-motion aware. Docs live in
  `packages/site/src/pages/docs/animations/`.
- The layout family (`DitherShell`, `DitherRail`, `DitherConsole`,
  `DitherCanvas`, `DitherGrid`) is pure DOM/CSS — frames around their children for
  dashboards. `DitherRail` provides the sidebar's collapsed context so
  `DitherSidebarItem` children fold automatically; `DitherConsole` follow-mode
  pins the newest line and its caret stills under reduced motion. Docs live in
  `packages/site/src/pages/docs/components/LayoutDocs.tsx`.
- `gesture.ts` owns swipe math (Apple-style `project`, `rubberband`,
  `velocityFrom`) — any swipeable surface (drawer, sheet, future carousels)
  uses these, never re-derives them. Gesture rules: 1:1 tracking with
  setPointerCapture, rubber-band against the dismiss direction, velocity sign
  decides a flick, projection decides a slow drag.
- All primary canvas contexts must be created with `{ willReadFrequently: true }`
  because the kit uses `putImageData` for bulk pixel writes. Bloom canvases omit
  the flag (they only use `drawImage`).
- Standalone components must defer their initial `getBoundingClientRect()` to
  `requestAnimationFrame` to avoid a forced reflow when
  many components mount simultaneously. `DitherButton` defers `init()` via RAF
  with a `restartToken` guard and sizes its canvas from its ResizeObserver's
  report (`borderBoxSize`), never a read of its box, so a wall of buttons
  starting together forces no layout (a static button, without one, reads
  once). `DitherToggleGroup` defers `paintAll()` via RAF.
- A canvas painted cell by cell writes a raster and uploads it once: a
  RasterBuffer + `putRasterBuffer` (`paintToggleCanvas`, the spinner's
  loop), or `cellCanvas(ctx, cols, rows)` (`raster.ts`), whose `cell` /
  `rect` lay exactly the pixel an `rgb()` fillStyle and a 1x1 `fillRect`
  over the cleared canvas leave (unpremultiplied, source-over on a second
  write) and whose `flush` puts it, one raster and ImageData per context.
  Never a fillStyle string and a `fillRect` per cell: measured 13-100x
  slower. Draws over the cells (a bloom `drawImage`) come after `flush`.
- A loop skips a frame its dither cannot change: the skeleton paints only
  when the count of matrix thresholds its density clears moves (at most 17
  frames), the indeterminate progress only when its band steps (every
  50ms).
- `control.ts` is the internal source for native-control geometry, focus rings,
  disabled states and elevated popovers; `src/solid/runtime/field.ts` holds the
  `DitherField` context. Inputs, textarea,
  select, number field, button, checkbox, switch, and modal controls reuse it;
  keep native elements and public component APIs rather than adding a base class.
- `DitherPressable` (`Pressable.tsx`) looks like a button out of the box:
  `variant` `solid` (ink on the page, the default), `outline`, `ghost`, its
  ring `CONTROL_BUTTON`'s, a 40px mono key; `plain` is the bare base (only
  the press), for a caller that draws every pixel. A caller's class still
  wins (`cn`). A screen's cell takes it like any registry component, so a
  screen's button reads as one.
- `DitherField` supplies generated control/help IDs and error state to compatible
  descendants. Explicit consumer `id`, `aria-describedby`, and invalid props win.
- Respect `prefers-reduced-motion` inside the kit (see
  `pixelPrefersReducedMotion` / `prefersReducedMotion`) — consumers must not
  need to opt in.
- Text and targets hold WCAG AA in both themes, measured on the rendered
  page. No readable text fades under 4.5:1: `faint` tones share the muted
  ink; a field's placeholder takes ONE token, `--placeholder`, in every
  control (`placeholder:text-placeholder`, the
  `--color-placeholder` map in `kit.css` and the site's
  stylesheet, `base.css`'s `::placeholder`; unset, the muted ink). Each
  theme sets it in the muted ink's hue, as dim as AA allows in a field (the
  page at 60% over any ground, 4.6:1 at worst, under 5:1 on the page): the
  kit's two, the site's light, the docs' and the landing's darks; a theme that moves its muted ink or grounds
  re-picks it. `packages/site/tests/placeholder.spec.ts` and
  `theme-contrast.spec.ts`
  hold every one; and only `aria-hidden` separators and the wheel picker's masked edge
  rows keep a fade. The light `--swatch-*` inks clear 5:1 on white. A label
  on a dithered fill (badge, button, toggle, toggle group) takes the ink
  `darkInkOnDark(fill, LABEL_COVERAGE[variant])` (`src/engine/palette.ts`)
  picks: pure black on a bright fill (on the solid orange key `#0a0a0a`
  stops at 4.4:1), the theme's ink otherwise; the button's raster stores
  its colour pre-scaled by alpha, so it passes coverage². The toggle paints
  its fill with alpha as the badge does, so a light page sees a pastel.
  Every target is 24px or spaced per WCAG 2.5.8: a legend key is a label
  unless clickable, then a button with a 24px hit (`-my-1 py-1`); a slider
  thumb is a 24px box around its 12px mark on a 24px track (`-my-1 h-6`);
  the preview rail's pitch is 24px; radio rows are `min-h-6`. A focusable
  surface (`DitherWorld`) draws its own inset ring as a last child on
  keyboard focus: an outline sits under its canvases, and its well clips
  an outer one.
- Canvas visibility defaults to paused until IntersectionObserver reports the
  element visible; do not start chart animation loops optimistically before the
  first visibility observation. The IO callback must record the element as
  visible before calling `onWake` so `schedule()` sees the correct state.
- A chart loop that skips a frame with nothing new to paint still asks for
  the next one while its entrance is under way (a delay, or two frames on
  one timestamp), in the engine's cartesian loop; else it stops
  part drawn until a hover wakes it. `tests/chart-entrance.spec.ts`.
- `precompile.ts` must remain browser/SSR safe: it returns raw RGBA buffers and
  must not import a framework, DOM APIs, or a server-specific image encoder. Consumers
  own encoding, caching, and invalidation of packaged assets.
- `precompiled` replaces only the dither plot/surface image; surrounding chart
  composition remains available. `renderMode="static"` disables animation and
  resize observation for standalone surfaces, auto-uses lower backing-resolution
  caps (`STATIC_DEFAULT_MAX_COLS=320`, `STATIC_DEFAULT_MAX_ROWS=200`) unless
  `maxCols`/`maxRows` props override, and defers initial paint through
  `requestIdleCallback` (with `setTimeout` fallback) so decorative gradients
  never block first contentful paint. Live mode uses `DEFAULT_MAX_COLS=960`,
  `DEFAULT_MAX_ROWS=600` and paints immediately via `setTimeout(0)`.
  `maxCols`/`maxRows` are configurable props on DitherGradient, DitherButton,
  and DitherImage for per-instance tuning.
- Chart composition: root provides context (`cartesian-root` / `polar-root`),
  children register series via contexts. Props are declared with explicit
  runtime defaults — keep the API tables in `packages/site/src/pages/docs` in
  sync when defaults change (`packages/site/tests/site/docs-api.spec.ts` checks
  every row's names against the components).

## Work Guidance

- A new time-driven surface subscribes to the clock: paint the moment on
  seek, request no frames while directed, resume on release, and show what
  its inputs and that moment give (the paint law).

## Verification

- `npm run typecheck` at the root (the one type program, which holds the
  engine and every layer) must stay green; the engine's specs
  (`tests/*.spec.ts`) run with `npx rs test` at the root, the components'
  (`tests/solid/`) with `npm test` here, on Vitest.
- Visual: at the root, `npm run build && npm run preview` and eyeball the
  `/docs/` previews.
- The StyleX layer:
  `packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts` regenerates it
  and
  fails on any drift, any Tailwind class left (only the components' own
  hooks stay class names) and any utility input whose effect was lost;
  `packages/site/tests/site/stylex-layer.spec.tsx` mounts it on the docs' StyleX
  runtime.
- Print screens: `tests/screens.spec.ts` (each screen a permutation, the
  seeded jitter equal to Bayer's) and the `DitherScreen` cases of
  `tests/solid/carried.spec.tsx` and `tests/solid/kit.spec.tsx`
  (a `DitherScreen` reaching a surface), `tests/chart-screen.spec.ts` (each
  chart loop reprints on a new matrix and sleeps on the same one) and the
  `DitherScreen` cases of `tests/solid/charts.spec.tsx`; the poster:
  `tests/poster.spec.ts`.
- Painting at memory speed: `tests/paint-limits.spec.ts` pins `cellCanvas`
  to the fillRect pixel and `fbm`'s cache to the plain sum.
- Benchmarks, in `benches/`, run by hand and never part of a build or a
  spec: `npm run bench` times the engine's hot paths in Node
  (`node-bench.mts`; `resolve-ts.mts` is the resolve hook that gives the
  kit's extensionless imports their `.ts` under Node's own TypeScript);
  `npm run bench:browser` (`browser-bench.mts`, its page
  `browser-bench-page.tsx`) bundles the page in memory, mounts the Solid
  components in headless Chromium (`CHROME_PATH`, else playwright-core's)
  over the built `kit/dither-kit.css` (the site build's, or a path given)
  and prints the root README's tables. A figure in the README is replaced
  only by a run, with its machine, browser and date beside it.
- Determinism: on the built site, `/play/#doc=…` driven by synthetic
  `hf-seek` events must give identical bytes for identical times, in any
  order, and request no animation frames while directed.

## Child DOX Index

- none (the layers are folders of this one contract)
