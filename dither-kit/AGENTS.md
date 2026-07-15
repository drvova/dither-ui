# dither-kit — the toolkit

## Purpose

Self-contained Vue 3 component library: charts, buttons, avatars, gradients and
images rendered on canvas through one ordered-dither (Bayer 4x4) engine.
This folder is the product; the `src/` app is its showcase and editor.

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
- `DitherSpinner` is generative like the charts: `spinnerFromSeed` samples a
  continuous form space (speed, dir, arc, segments, spokes, innerRatio, taper)
  — one seed → an arc, a ring of dots, a rotating flower, or a thin comet.
  ONE render loop draws any point; add spinner variety by widening the params,
  never by branching. Default (no seed) is a clean rotating arc.
- `gesture.ts` owns swipe math (Apple-style `project`, `rubberband`,
  `velocityFrom`) — any swipeable surface (drawer, sheet, future carousels)
  uses these, never re-derives them. Gesture rules: 1:1 tracking with
  setPointerCapture, rubber-band against the dismiss direction, velocity sign
  decides a flick, projection decides a slow drag.
- New components: export from `index.ts` alongside their public types;
  follow the existing shape (`withDefaults(defineProps<...>)`, ResizeObserver
  repaint, `image-rendering: pixelated`, `cn()` for class merge).
- Respect `prefers-reduced-motion` inside the kit (see
  `pixelPrefersReducedMotion` / `prefersReducedMotion`) — consumers must not
  need to opt in.
- Chart composition: root provides context (`cartesian-root` / `polar-root`),
  children register series via contexts. Props are declared with explicit
  runtime defaults — keep API tables in `src/pages/docs` in sync when defaults
  change.

## Verification

- `npx vue-tsc --noEmit` (workspace-wide) must stay green.
- Visual: `npx vite build && npx vite preview` and eyeball `/#/docs` demos.

## Child DOX Index

- none (flat folder by design)
