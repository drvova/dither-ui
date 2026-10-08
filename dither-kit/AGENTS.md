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
  container-query scales, chart roots/contexts, canvas painters, and the
  public component set.
- Consumers import ONLY via `index.ts` (`@dither-kit` alias).

## Local Contracts

- `DitherCommand` is modal: Escape closes, Tab never leaves it (focus
  returns to its input; the list is arrow-driven), focus restores to the
  opener on close.

- Zero imports from `src/` — the kit must stay copy-out portable
  (docs promise: "copy the folder, alias it"). Dependencies: vue, d3-scale,
  d3-shape, tailwind classes only.
- `palette.ts` is the single source of color truth: 7 seeds, each resolving
  fill/line/star hues. Swatch CSS vars in `src/app/styles.css` mirror it.
- `pixel.ts` owns BAYER4 and bloom presets; every dithered surface thresholds
  against the same matrix.
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
- `world.ts` + `models.ts` + `DitherWorld.vue` are the 3D surface. `models.ts`
  parses model files into a `World` (meshes in world space with outward
  winding, directional lights, the headlight flag, the first viewpoint, a
  bounding sphere): VRML97 / X3D classic and VRML 1.0 `.wrl` (one lenient
  tokenizer + generic node grammar — DEF/USE, PROTO/EXTERNPROTO/ROUTE skipped,
  enums, bare children for 1.0's Separator state machine; Transform/Group/
  Switch/LOD/Shape/Material/IndexedFaceSet/Box/Sphere/Cone/Cylinder/
  ElevationGrid/Viewpoint/DirectionalLight/NavigationInfo; 1.0's Translation/
  Rotation/Scale/MatrixTransform/Coordinate3/ShapeHints/Cube), Wavefront OBJ
  (`v`/`f`, slashes, negative indices, polygons) and STL (ASCII + binary,
  two-sided, z-up swung to y-up by default). `world.ts` is the engine:
  column-major mat4 math, the VRML primitives (y up, CCW outward), `meshFrom`
  (bakes the matrix, reverses rings for `ccw FALSE` or a mirroring matrix,
  fan-triangulates, keeps polygon outline edges with their owning triangle),
  `finishWorld` (bounding sphere), and `paintWorld`: an orbit camera around
  the sphere (`yaw`/`pitch` degrees, `zoom` 1 frames the sphere, eye never
  inside it), flat Lambert from the headlight + the file's lights, an
  edge-function rasterizer with a z-buffer (incremental barycentrics, 2D
  bbox clamp), 1-bit ordered dither per cell — lit cells take the fill at
  full alpha, the rest `shade` alpha so the silhouette reads — `fog` depth
  fade, `material` per-mesh colour, and a `wire` pass drawing the outline
  edges depth-tested against the finished z-buffer (hidden-line removal,
  never a fan's diagonals). CPU only on purpose: same bytes in a browser, a
  worker, Node and a HyperFrames capture. `sampleWorld(seed)` writes the
  default content as real VRML97 text (seed-generative like everything
  else) so the default goes through the parser too. The component loads
  `src` (fetch, format by name then by sniffing) or inline `source`, derives
  the initial pose from the file's Viewpoint when `yaw`/`pitch`/`zoom` are
  unset, orbits by pointer drag (`touch-action: pan-y`) and arrow keys
  (focusable `role="img"`), and shows an honest note for loading/empty/
  error. `tests/world.spec.ts` + `tests/vrml.spec.ts` pin the engine and
  both grammars.
- `shader.ts` + `DitherShader.vue` are the GLSL surface. The pure half:
  `wrapShader` builds a program around a user fragment shader — Shadertoy's
  `mainImage` gets the Shadertoy uniforms and a `main` (GLSL ES 3.00 under
  WebGL2, 1.00 under WebGL1), a raw `main` compiles as written (default
  float precision added when missing, `#version 300 es` honoured) — and
  `ditherShaderPixels` turns the GPU readback (rows bottom-up) into the
  raster: colour mode quantizes each channel to `levels` through the Bayer
  cell (2 = the eight-colour look), mono thresholds luminance into the tint
  with a `shade` floor; `dither` blends smooth → quantized; the shader's
  alpha carries. The component owns one offscreen WebGL2/WebGL1 context at
  the cell resolution (context loss handled, released on unmount), feeds
  `iResolution/iTime/iTimeDelta/iFrame/iMouse/iDate` plus the glslsandbox
  and Book-of-Shaders aliases (`SHADER_UNIFORMS`), reads back and dithers
  each frame; `iTime` is the kit clock, so it seeks and renders like every
  surface (HyperFrames' renderer has WebGL2 through SwiftShader — verified
  by a real render). Without WebGL it shows "WebGL is not available"; a
  compile error shows the compiler's first line. `sampleShader(seed)` is the
  seeded default source. `tests/shader.spec.ts` pins the pure half.
- `use-dither-background.ts` (`useDitherBackground`) is the single shared runtime
  for that family: throttled rAF loop, backing buffer + upload, visibility gate,
  resize, dpr, static/reduced-motion single frame, and the mount/restart/teardown
  lifecycle. `cell` is a number or a getter (a `cell` prop). `paused` holds
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
- `noise.ts` is the single source for the 2D value-noise/fbm those surfaces use;
  `sampleRgbGradient` in `palette.ts` is the single out-param colour-ramp
  sampler they tint with. Add new generative backgrounds on top of both — never
  re-derive hash/valueNoise/fbm or a per-pixel gradient lerp per component.
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
- Text animations (`GradientText`, `ShinyText`, `GlitchText`, `SplitText`,
  `RotatingText`, `CountUp`, ...) are a separate family: pure DOM/CSS (or a small
  rAF for counting), NOT canvas/Bayer. They still ship as `Dither*` exports,
  register in `COMPONENT_REGISTRY`, and must honour `prefers-reduced-motion`
  (CSS `@media` or `pixelPrefersReducedMotion`). Slot-based effects wrap arbitrary
  text; char/number effects take a `text`/`to` prop. Docs live in `src/pages/docs/text/`.
- Interaction/motion effects (`AnimatedContent`, `FadeContent`, `Sequence`,
  `GradualBlur`, `StarBorder`, `ElectricBorder`, `GlareHover`, `Magnet`,
  `ClickSpark`, ...) are
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

## Work Guidance

- A new time-driven surface subscribes to the clock: paint the moment on
  seek, request no frames while directed, resume on release.

## Verification

- `npx vue-tsc --noEmit` (workspace-wide) must stay green.
- Visual: `npx vite build && npx vite preview` and eyeball `/#/docs` demos.
- Determinism: on the built site, `/play/#doc=…` driven by synthetic
  `hf-seek` events must give identical bytes for identical times, in any
  order, and request no animation frames while directed.

## Child DOX Index

- none (flat folder by design)
