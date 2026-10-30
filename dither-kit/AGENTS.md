# dither-kit — the toolkit

## Purpose

Self-contained Vue 3 component library: charts, buttons, avatars, gradients and
images rendered through one ordered-dither (Bayer 4x4) engine. Interactive
surfaces use canvas; deterministic surfaces can use the dependency-free RGBA
compiler and a packaged image URL. This folder is the product; the `src/` app
is its showcase and editor.

## Ownership

- Owns every rendering primitive: palette seeds, Bayer matrix, bloom presets,
  step-timing primitives, the sequence timeline algebra, the clock director,
  the wipe engine (ordered-dither masks), the keyframe engine (container
  units), the score engine (a film's soundtrack from its cut),
  container-query scales, chart roots/contexts, canvas painters, and the
  public component set.
- Consumers import ONLY via a layer's `index.ts` (`@dither-kit` aliases
  `tailwind/index.ts`; a StyleX app aliases `stylex/index.ts`).

## Layers

One kit, folders by styling. File names are unique across layers; inside
the kit every import is relative (`../engine/pixel`).

- `engine/` — every module that carries no class name: palette, pixel,
  raster, the painters and backgrounds' renderers, the chart canvases
  (their layers styled inline), timing, sequence, clock, wipe, keyframes,
  score, the chart/field/common contexts (`chart-context.ts`, `field.ts`),
  parsers and GL engines, `copy-text.ts`, `theme.css`, `theme.ts` and
  `base.css` (the scoped box-model base every layer assumes). It imports
  only `vue`, `d3-*` and itself, never a styling layer, and is what the
  Svelte port copies verbatim.
- `tailwind/` — the source styling layer: every `.vue` component and the
  `.ts` modules that write Tailwind classes (`lib.ts`'s `cn`,
  `control.ts`'s `CONTROL` / `CONTROL_BUTTON` / `POPOVER`, the chart
  roots), its `index.ts` (the public API) and `kit.css`.
- A file name is one component across both layers: a chart's series part
  and a background never share one (`Radar.vue` is the radar chart's
  series part, which registers its texture with the chart; the sweep
  background is `RadarSweep.vue`, exported as `DitherRadar`;
  `tests/components/radar-series.spec.ts` holds it).
- `stylex/` — the same components in StyleX, GENERATED from `tailwind/`
  by `src/shared/lib/stylex-layer.ts`: never edit a generated file (each
  says so in its first line); edit the Tailwind file and run
  `npx rs test -u tests/stylex-layer.spec.ts`. Every class string in
  class position (`class` / `:class`, `cn()` arguments, `class:` in `h()`,
  and the constants, records, computeds and functions those reach)
  becomes a named style in ONE `stylex.create` per file, at module level
  in a plain `<script>` (where StyleX compiles it); an element's own
  styles bind with `v-bind="stylex.attrs(...)"`, merged ones with
  `:class="cn(...)"`. A component that takes `class` takes `xstyle` too
  (StyleX styles or class names, merged after its own, so the last style
  to set a property wins; Vue flattens any object given as `class`), and
  kit components hand each other styles through it. Only `lib.ts` (`cn`
  over `stylex.attrs`, `StyleProp`) is written by hand.
- A module that stops carrying classes moves to `engine/`; a new component
  goes in `tailwind/` and reaches shared logic through `../engine/`.
- What the generator can carry, so the Tailwind source keeps to it: class
  strings in class position (never a template literal or `+`: an array),
  a composition returns classes or arrays (never a `cn()` string fed into
  another `cn()`, which would merge twice), no `!important`, and a rule
  about another element's state (a parent's hover, a `:has()`) lives in
  the component's scoped `<style>` on its own hook classes, which both
  layers carry verbatim. A utility that needs a selector StyleX cannot say
  (`group-*`, `peer-*`, `has-*`, `*:`, an arbitrary `[&...]`) stays out of
  class strings.

## Local Contracts

- `DitherCommand` is modal: Escape closes, Tab never leaves it (focus
  returns to its input; the list is arrow-driven), focus restores to the
  opener on close.
- `DitherTabs` (both kits) keeps its marker canvas (the underline or the
  wash) INSIDE the `relative` tablist, positioned from the selected tab's
  offsets: a list that scrolls (more tabs than width) carries the marker
  with its tab and clips it at its edges. Outside the list, it stayed put
  while the tabs scrolled.

- Zero imports from `src/` — the kit must stay copy-out portable
  (docs promise: "copy the folder, alias it"). Dependencies: vue, d3-scale,
  d3-shape, tailwind classes only.
- `palette.ts` is the single source of color truth: 7 seeds, each resolving
  fill/line/star hues. Swatch CSS vars in `src/app/styles.css` mirror it.
- `pixel.ts` owns BAYER4, the print screens and bloom presets. `SCREENS`
  (`bayer`, `line`, `diagonal`, `dot`, `cross`; `SCREEN_KINDS`) are 4x4
  rank matrices, each a permutation of the sixteen ranks, so every
  `matrix[y & 3][x & 3]` painter takes any of them; `screenMatrix(screen,
  seed?)` jitters one exactly as `pixelMatrixFromSeed` jitters Bayer (the
  same bytes for `bayer`).
- `use-screen.ts` is the ONE way a surface gets its matrix:
  `useDitherMatrix(() => seed)` reads the screen a `DitherScreen` around
  it provides (`SCREEN`, an inject; Bayer without one), seeded as ever;
  the charts' contexts expose the same as `matrixOf(variant)`
  (`useVariantMatrix`, `resolveMatrix` when no screen is around); a fill
  that carries a label (badge, toggle, button) keeps Bayer through
  `useLabelMatrix`, because a hatch under type breaks its letters.
  `precompile.ts` takes a `screen` option for surfaces that raster
  through it (the gradient passes its screen, the button does not).
  `DitherScreen` is only the provider (`screen`, default `diagonal`, a
  slot). Pinned by `tests/screens.spec.ts`.
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
  jump a settled track. `Sequence.vue` is the shared driver: it snapshots
  slot children at start (rebuild via `restartKey`), writes `--seq-p` (eased,
  `toFixed(4)`) + `data-seq` per child with change-skipping, and owns an
  rAF clock whose first frame is dt 0 and whose wake has no time jump —
  `use-dither-background` semantics. IO gate and reduced-motion floor mirror
  `AnimatedContent`; the `frameRate` gate mirrors the background runtime with
  completion checked BEFORE the gate. `tests/sequence.spec.ts` (algebra) and
  `tests/sequence-vue.spec.ts` (driver, manual-rAF fake clock — respect the
  100ms dt cap when stepping fake time) pin both halves.
- `clock.ts` is the director — external ownership of time. Free-running,
  every animated surface owns its own rAF loop on wall time. `seek(ms)`
  directs them: the loops stand down and each surface paints exactly the
  given moment, in any order (same seed + same time → same pixels);
  `release()` hands time back. Surfaces subscribe with `onSeek` (a `null`
  moment means released → resume through their own `wake`), request no
  frames while `isDirected()`, and paint `directedTime()` when they start
  or wake under direction. Directed semantics per surface:
  `use-dither-background` sets `clock = ms/1000 · timeScale` (pure
  renderers land on the exact frame) and passes `dt` = the step since the
  last directed moment (simulations advance in capture order, so those
  render with one worker); the chart canvases run the entrance from
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
  `tests/clock.spec.ts` and the directed case in `tests/sequence-vue.spec.ts`.
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
  `DitherReveal.vue` applies it to its slot: manual `progress` (a
  timeline's — it runs no clock of its own), or a timed reveal
  (`duration`/`delay`/`easing`, `restartKey` replays) on the IO-gated rAF
  loop, the kit clock's moment when directed, shown at once under reduced
  motion; `reverse` hides instead; `data-reveal` = hidden|playing|shown.
  The Studio's reels cut between frames with it. Pinned by
  `tests/wipe.spec.ts` and `tests/reveal-vue.spec.ts`.
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
  `tests/transition.spec.ts`; not in the Svelte kit, like the wipe.
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
  films carry it into their videos and preview it; not ported to the Svelte
  kit (nor are the wipe and keyframe engines). Pinned by
  `tests/score.spec.ts`.
- Type voice: the kit's controls speak `--font-mono` (Button, Badge,
  Toaster, Command), and every overlay that TELEPORTS to `<body>` carries
  it on its own panel — `DitherDialog`, `DitherAlertDialog`,
  `DitherDrawer`, `DitherContextMenu`, `CenterMorphModal` — because a
  teleport leaves the host's font behind (the body's sans, not the page's
  voice). Where the panel takes `class`, a consumer's `font-sans` wins
  through `cn()`. New teleported overlays follow; the Svelte port mirrors
  each one.
- Styling contract: Tailwind is the kit's authoring tool, not a requirement
  of the app around it. `engine/theme.css` declares the shadcn-style tokens
  (`--background`, `--foreground`, `--card`, `--popover`, `--muted`,
  `--border`, `--ring`, `--accent`, their `-foreground` pairs, `--radius`,
  `--font-sans`, `--font-mono`, the `--swatch-*` mirror of PALETTE) light at
  `:root` and dark under `.dark` — plain CSS the app's `styles.css` imports
  under Tailwind (its `@theme inline` maps them to `--color-*` utilities and
  must stay in step) and every other styling system themes by redefining.
  `engine/base.css` is the box-model and form-control base the components assume
  (Tailwind's preflight is the global version the site uses), scoped under
  `.dither-kit` through `:where()` at zero specificity. `tailwind/kit.css` is
  the standalone entry: the two files plus Tailwind's utilities with
  `source(none)` and `@source` limited to `dither-kit/tailwind/` and
  `dither-kit-svelte/`, in the `dither-kit.theme/base/utilities` layers;
  `scripts/kit-css.mjs` (`npm run build:css`, part of `npm run build` and
  the Pages deploy) compiles it with `@tailwindcss/node` + `oxide` into
  `dist/kit/dither-kit.css` (~55 kB, served at `/kit/dither-kit.css`), so
  an app on UnoCSS, vanilla CSS or any CSS-in-JS runs the Tailwind layer
  by loading one file, wraps the region in `.dither-kit`, and wins every
  cascade against the kit's layered rules (a StyleX app takes `stylex/`
  instead, with `engine/theme.css` and `engine/base.css`); `class` on any component takes any class name
  (`cn()` merges Tailwind names, passes the rest through). `engine/theme.ts` sets
  the tokens from JS: `THEME_TOKENS`, `themeVars` (object of custom
  properties for inline styles or a vars contract), `themeCss` (a `:root`
  / `.dark` block), `applyTheme` (writes them on an element, returns the
  undo). A component may use only Tailwind utilities, its own scoped
  styles and the tokens above — never an app class. Pinned by
  `tests/kit-css.spec.ts` (the compiled file: tokens, scoped base, the
  utilities, no bare element rules) and `tests/theme.spec.ts`.
- Browser contract: web platform only, every engine. The floor is Tailwind
  v4's (Chrome 111, Safari 16.4, Firefox 128: `@layer`, `color-mix()` in
  oklab, container queries and units, `:has()`, `inert`); anything newer
  is feature-detected or degrades — `requestIdleCallback` (a timeout
  fallback), `startViewTransition` (checked), WebGL2 → WebGL1 with
  extensions (`gl.ts`, `world-gl.ts` leaves uvs unset there), `ResizeObserver`
  and `IntersectionObserver` guarded (no gate → play), `document.fonts`
  optional, `text-wrap`/`content-visibility`/`scrollbar-*` progressive,
  masks through Vue's style prefixing (`DitherReveal` sets both spellings),
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
  combobox, autocomplete; both kits) keeps focus on `pointerdown` and picks
  on `click`, so a finger that scrolls the list picks nothing. The video
  player falls back to the video's own fullscreen
  (`webkitEnterFullscreen`) where an element has none (an iPhone) and
  shows its volume slider only where a write to `volume` sticks (iOS ties
  it to the hardware buttons).
- `keyframes.ts` + `DitherStage.vue` + `DitherLayer.vue` are the keyframe
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
  `--layer-<name>` per property, `data-layer` state, and hands the slot
  every property resolved to px/degrees plus progress, cycle, time, width,
  height — the numbers a canvas painter needs; without a stage it holds
  its first key. Pinned by `tests/keyframes.spec.ts` and
  `tests/stage-vue.spec.ts` (fake rAF + ResizeObserver, directed seeks,
  reduced motion).
- `containers.ts` + `DitherContainer.vue` are the container-query engine —
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
  observer; a setTimeout(0) `clientWidth` guard fires only if nothing
  reported — never overwrite a real observation with the zero read), and
  publishes `data-cq` (active bucket) + `--cq-w`/`--cq-h` (content-box size,
  raw or quantized together) + `--cq-i` (ordinal) + slot props
  `{ width, height, size, index, matches }`. Its UNSCOPED style ships the
  container-relative reference keyframes `dither-cq-traverse`
  (translateX ±100cqw) and `dither-cq-rise` (translateY ±100cqh): motion
  measured against the query container, small-viewport fallback when none —
  never vw/vh, never the animated element's own box (`tests/cq-units.spec.ts`
  guards the units and the viewport leak).
  Unmount disconnects the observer and clears the timer (leak contract).
  `tests/container.spec.ts` (boundaries, ordering, overlaps, quantize) and
  `tests/container-vue.spec.ts` (observer, var/attr writes, slot state,
  silent-observer fallback) pin both halves; the docs `v-slot` snippet rides
  the `toSvelteCode` children-snippet rule (`tests/svelte-code.spec.ts`).
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
  reveal holds every column; both kits' cartesian canvases call it).
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
- `world.ts` + `models.ts` + `world-gl.ts` + `DitherWorld.vue` are the 3D
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
  big endian; vertex and face colours, edges, point clouds) and OFF (face
  colours). Animation: a VRML `TimeSensor` → `PositionInterpolator` /
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
  shows an honest note for loading/empty/error. `tests/world.spec.ts`,
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
- The render graph: every surface on `use-dither-background` is a
  `DitherSurface` — `raster()` (the last painted buffer), `pull(ms)`,
  `version()`, `canvas()` — returned by the composable, exposed by
  `DitherWorld`/`DitherShader` (`defineExpose({ surface })`) and reachable
  from any kit canvas through `surfaceOf(canvas)`. `pull(ms)` is the edge
  contract: under direction it paints the moment `ms` on demand when the
  source has not painted it yet (a moment paints once — the clock's own
  call then agrees), free-running it returns the latest raster; so a
  consumer always reads a source at its own time stamp whatever order the
  clock reaches them in, and a chain of surfaces seeks and renders as one.
  Consumers: `DitherShader.channels` binds up to four sources as
  `iChannel0..3` (a surface, a component instance, a kit canvas → its
  surface; any other canvas, image or video → its current pixels, uploaded
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
  back, `dispose`), `buildProgram` (the compiler's first line as the
  error) and the channel binding: `ChannelInput` (a surface, a component
  instance, a kit canvas → its surface; any canvas, image or video),
  `bindChannel`, `createChannels` (the four textures of one program,
  re-uploaded only when a surface painted, FLIP_Y upright,
  `iChannelResolution` / `iChannelTime`) and `rasterOf` (the same input as
  a raster for the CPU engines). The GPU is only ever an evaluator — every
  surface still dithers on the CPU.
- `shader.ts` + `DitherShader.vue` are the GLSL surface. The pure half:
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
  dithers each frame; `iTime` is the kit clock, so it seeks and renders
  like every surface (HyperFrames' renderer has WebGL2 through SwiftShader
  — verified by a real render). Without WebGL it shows "WebGL is not
  available"; a compile error shows the compiler's first line.
  `sampleShader(seed)` is the seeded default source. `tests/shader.spec.ts`
  pins the pure half.
- `use-dither-background.ts` (`useDitherBackground`) is the single shared runtime
  for that family: throttled rAF loop, backing buffer + upload, visibility gate,
  resize, dpr, static/reduced-motion single frame, and the mount/restart/teardown
  lifecycle. It returns the surface's `DitherSurface` (see the render
  graph). `cell` is a number or a getter (a `cell` prop); `afterPaint`
  runs after the upload with the canvas (bloom layers copy it). `paused` holds
  the raster but never leaves it blank: the first frame, and the frame after
  a restart, still paint before the loop stands down (so a paused surface
  repaints when a `restart` source such as a drag changes). A still surface
  (static mode, reduced motion) paints its one frame in `start()` and the
  visibility wake never starts the loop behind it — it did once, and every
  background animated under reduced motion as soon as it scrolled into view.
  Its optional `frameRate` getter gates painting on
  `timing.frameIndex` boundaries — between boundaries the raster is held
  (stop-motion cadence, no upload), 0/undefined keeps the smooth ~30fps
  throttle. Both cadence gates run BEFORE `measure()` — a held frame never
  reads layout (gating the per-vsync `getBoundingClientRect`/`getContext`
  cut script time 28% on three 8fps surfaces), and a boundary is consumed
  only by a frame that actually paints.
  EVERY background component exposes the matching `frameRate` prop
  (default 0) and passes it through; the studio registry row and the docs API
  table carry the same row — `scripts/frame-rate-codemod.ts` keeps all four
  surfaces in step (strict anchors, idempotent, `--dry` to preview). A new
  background is just an `engine.ts` `paint*` fn plus a thin `.vue`
  that resolves props and passes a `render(buffer, clock, dt, elapsed)` callback —
  never re-implement the loop per component. Per-frame extras stay in `render`:
  page-load fade reads `elapsed`, eased pointers read `dt`.
- `poster.ts` + `DitherPoster`: the palette printed as tone.
  `posterLayout(seed, inkCount)` cuts the surface into 3 or 4 columns of 1
  or 2 tiles (a tile's ink never the one above it, nor with three inks or
  more the one beside it), each running its ink along a ramp (down or
  across; some solid) through the screen into a second ink or the ground,
  and places the kit's diamond (sized by the surface's shorter side and
  always landing whole, so a portrait print keeps it), inside which every
  tone turns over (the tiles' negative) and the screen slides `speed` cells a second on the
  clock; `ground` `transparent` leaves open cells clear. Its screen is the
  one around it, else Bayer. Pinned by `tests/poster.spec.ts`.
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
  `use-inview-loop.ts` — `start` only on the first IntersectionObserver hit,
  `stop` when the host leaves, `start` idempotent, never an optimistic start
  at mount (measured: ungated demos burned ~440 rAF/s offscreen on docs).
  Without IO the loop is always-on — the old behaviour, which is what jsdom
  tests get. A new looping component uses this composable, never a bare
  mount-time `requestAnimationFrame` chain.
- Per-letter text keeps its words wrappable: `VariableProximity` (both
  ports) renders a space as a plain space between the letters' spans (no
  `\u00a0`), so a sentence breaks between words, never inside one, and
  the letters stay the root's only element children for the frame walk.
- Text animations (`GradientText`, `ShinyText`, `GlitchText`, `SplitText`,
  `RotatingText`, `CountUp`, ...) are a separate family: pure DOM/CSS (or a small
  rAF for counting), NOT canvas/Bayer. They still ship as `Dither*` exports,
  register in `COMPONENT_REGISTRY`, and must honour `prefers-reduced-motion`
  (CSS `@media` or `pixelPrefersReducedMotion`). Slot-based effects wrap arbitrary
  text; char/number effects take a `text`/`to` prop. Docs live in `src/pages/docs/text/`.
- Interaction/motion effects (`AnimatedContent`, `FadeContent`, `Sequence`,
  `Reveal`, `Stage` + `Layer`, `GradualBlur`, `StarBorder`,
  `ElectricBorder`, `GlareHover`, `Magnet`, `ClickSpark`, ...) are
  another DOM/CSS/pointer family: slot wrappers (reveal-on-view, animated
  borders, hover glare), timeline-driven children (`Sequence` writes
  `--seq-p`/`data-seq` — see its engine bullet), the container-query scope
  (`DitherContainer` — `data-cq`/`--cq-*` + slot state; and
  `AnimatedContent.distance` accepts CSS length strings — `"4cqw"` makes a
  reveal measure its parent container, numbers stay px), or area wrappers
  (cursor +
  click effects on a canvas
  overlay). Same rules: `Dither*` export, `COMPONENT_REGISTRY` entry (wrappers use
  `slotText`), reduced-motion aware. Docs live in `src/pages/docs/animations/`.
- The layout family (`DitherShell`, `DitherRail`, `DitherConsole`,
  `DitherCanvas`, `DitherGrid`) is pure DOM/CSS — slot-driven frames for
  dashboards. `DitherRail` provides the sidebar's collapsed context so
  `DitherSidebarItem` children fold automatically; `DitherConsole` follow-mode
  pins the newest line and its caret stills under reduced motion. Docs live in
  `src/pages/docs/components/LayoutDocs.vue`.
- `gesture.ts` owns swipe math (Apple-style `project`, `rubberband`,
  `velocityFrom`) — any swipeable surface (drawer, sheet, future carousels)
  uses these, never re-derives them. Gesture rules: 1:1 tracking with
  setPointerCapture, rubber-band against the dismiss direction, velocity sign
  decides a flick, projection decides a slow drag.
- All primary canvas contexts must be created with `{ willReadFrequently: true }`
  because the kit uses `putImageData` for bulk pixel writes. Bloom canvases omit
  the flag (they only use `drawImage`).
- Standalone components must defer their initial `getBoundingClientRect()` to
  `requestAnimationFrame` to avoid forced reflow inside Vue's `flushJobs` when
  many components mount simultaneously. `DitherButton` defers `init()` via RAF
  with a `restartToken` guard. `DitherToggleGroup` defers `paintAll()` via RAF.
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
  disabled states and elevated popovers; `engine/field.ts` holds the
  `DitherField` context. Inputs, textarea,
  select, number field, button, checkbox, switch, and modal controls reuse it;
  keep native elements and public component APIs rather than adding a base class.
- `DitherField` supplies generated control/help IDs and error state to compatible
  descendants. Explicit consumer `id`, `aria-describedby`, and invalid props win.
- Respect `prefers-reduced-motion` inside the kit (see
  `pixelPrefersReducedMotion` / `prefersReducedMotion`) — consumers must not
  need to opt in.
- Text and targets hold WCAG AA in both themes, measured on the rendered
  page. No readable text fades under 4.5:1: `faint` tones share the muted
  ink, and only `aria-hidden` separators and the wheel picker's masked edge
  rows keep a fade. The light `--swatch-*` inks clear 5:1 on white. A label
  on a dithered fill (badge, button, toggle, toggle group) takes the ink
  `darkInkOnDark(fill, LABEL_COVERAGE[variant])` (`engine/palette.ts`)
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
  first visibility observation. The IO callback must set `visible.value` before
  calling `onWake` so `schedule()` sees the correct state.
- `precompile.ts` must remain browser/SSR safe: it returns raw RGBA buffers and
  must not import Vue, DOM APIs, or a server-specific image encoder. Consumers
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
  runtime defaults — keep API tables in `src/pages/docs` in sync when defaults
  change.

## Work Guidance

- A new time-driven surface subscribes to the clock: paint the moment on
  seek, request no frames while directed, resume on release.

## Verification

- `npx vue-tsc --noEmit` (workspace-wide) must stay green.
- Visual: `npx rs build && npx rs preview` and eyeball the `/docs/` previews.
- The StyleX layer: `tests/stylex-layer.spec.ts` regenerates it and fails on
  any drift, any Tailwind class left (only the components' own hooks stay
  class names) and any utility input whose effect was lost;
  `tests/components/stylex-layer.spec.ts` mounts it on the docs' StyleX
  runtime. After a generator change, compile the layer once with the real
  `@stylexjs/babel-plugin` (Vue's `compileScript`, then Babel): it must take
  every file.
- Print screens: `tests/screens.spec.ts` (each screen a permutation, the
  seeded jitter equal to Bayer's, a `DitherScreen` reaching a surface,
  labelled fills on Bayer); the poster: `tests/poster.spec.ts`.
- Painting at memory speed: `tests/paint-limits.spec.ts` pins `cellCanvas`
  to the fillRect pixel and `fbm`'s cache to the plain sum.
- Determinism: on the built site, `/play/#doc=…` driven by synthetic
  `hf-seek` events must give identical bytes for identical times, in any
  order, and request no animation frames while directed.

## Child DOX Index

- none (the layers are folders of this one contract)
