# dither-kit — the toolkit

## Purpose

Self-contained Vue 3 component library: charts, buttons, avatars, gradients and
images rendered through one ordered-dither (Bayer 4x4) engine. Interactive
surfaces use canvas; deterministic surfaces can use the dependency-free RGBA
compiler and a packaged image URL. This folder is the product; the `src/` app
is its showcase and editor.

## Ownership

- Owns every rendering primitive: palette seeds, Bayer matrix, bloom presets,
  chart roots/contexts, canvas painters, and the public component set.
- Consumers import ONLY via `index.ts` (`@dither-kit` alias).

## Local Contracts

- Zero imports from `src/` — the kit must stay copy-out portable
  (docs promise: "copy the folder, alias it"). Dependencies: vue, d3-scale,
  d3-shape, tailwind classes only.
- `palette.ts` is the single source of color truth: 7 seeds, each resolving
  fill/line/star hues. Swatch CSS vars in `src/app/styles.css` mirror it.
- `pixel.ts` owns BAYER4 and bloom presets; every dithered surface thresholds
  against the same matrix.
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
  develops out of order — half of all seeds stay a clean sweep.
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
  It is a WebGL-free reimplementation (canvas + Bayer only) — the `dither` prop
  is the ordered-threshold intensity (0 smooth -> 1 hard 1-bit). Its root is
  `relative h-full w-full` (self-sizing), NOT `absolute inset-0` like
  DitherGradient, so it renders filled in Studio's generic widget renderer and
  registers as an ordinary `COMPONENT_REGISTRY` entry instead of a bespoke kind;
  pass `class="absolute inset-0"` to use it as a background layer.
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
  `paintToggleCanvas` (shared by DitherToggle and DitherToggleGroup) must use
  `RasterBuffer` + `putRasterBuffer`, not per-pixel `fillRect`.
- `control.ts` is the internal source for native-control geometry, focus rings,
  disabled states, elevated popovers, and `DitherField` context. Inputs, textarea,
  select, number field, button, checkbox, switch, and modal controls reuse it;
  keep native elements and public component APIs rather than adding a base class.
- `DitherField` supplies generated control/help IDs and error state to compatible
  descendants. Explicit consumer `id`, `aria-describedby`, and invalid props win.
- Respect `prefers-reduced-motion` inside the kit (see
  `pixelPrefersReducedMotion` / `prefersReducedMotion`) — consumers must not
  need to opt in.
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

## Verification

- `npx vue-tsc --noEmit` (workspace-wide) must stay green.
- Visual: `npx vite build && npx vite preview` and eyeball `/#/docs` demos.

## Child DOX Index

- none (flat folder by design)
