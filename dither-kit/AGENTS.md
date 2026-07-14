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
  colors. Chart roots take a master `seed` prop deriving duration, delay,
  easing, stagger, sparkle character, bloom (+ startAngle on polar) with
  precedence: explicit prop > seed derivation > house default. All seed fns
  live in `dither-paint.ts` (mulberry32, params clamped to usable bands) —
  extend seeds there, never in per-component paint loops.
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
