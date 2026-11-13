# dither-kit-svelte — the Svelte 5 toolkit

## Purpose

Svelte 5 port of `dither-kit` (the toolkit, whose components are its Solid
layer): the same ordered-dither (Bayer) engine and component contracts,
re-expressed in Svelte 5 runes. Portable like the kit itself — copy the
folder, alias it, consume from `index.ts`.

## Ownership

- Owns the Svelte-flavoured component surface and the framework glue
  (lifecycle, reactivity, context) the kit's Solid layer writes in
  `dither-kit/solid/runtime/`.
- The rendering ENGINE is NOT owned here. The kit's framework-free `.ts` engine
  modules (palette, pixel, raster, noise, precompile, dither-paint, timing, wipe, spring, cover, the
  `paint*` families) are copied VERBATIM. `../dither-kit/engine` stays the single
  source of truth for engine math; a change there is re-copied here
  (`cp ../dither-kit/engine/timing.ts engine/timing.ts`), not re-invented.
  `tests/paint-limits.spec.ts` at the repository root fails on any copy
  in `engine/` that drifts (`dither-paint.ts` excepted, below).

## Local Contracts

- `tsconfig.json` sets `verbatimModuleSyntax`: type-only imports say
  `import type`, so a bundler's per-file TS pass (Rsbuild's Svelte plugin in
  `svelte-site/`) never drops a value import.
- Svelte 5 runes ONLY. No legacy API: no `export let`, no `$:` reactive
  statements, no `<slot>`, no `on:` directives, no `createEventDispatcher`, no
  `beforeUpdate`/`afterUpdate`, no `$$props`/`$$restProps`. Props via `$props()`,
  derivations via `$derived`, local element refs via `$state` + `bind:this`,
  two-way binding via `$bindable`, children via `Snippet` + `{@render ...}`.
- No `$effect`. DOM lifecycle (canvas loops, observers, listeners) lives in
  Svelte ACTIONS (`use:` directives) or `onMount`/`onDestroy`; reactive
  computation lives in `$derived`. Actions are the DOM-lifecycle seam.
- `runtime/use-dither-background.ts` is the shared background runtime, the
  kit's surface loop as the `ditherBackground` ACTION: it owns the throttled rAF
  loop, backing buffer + upload, IntersectionObserver visibility gate, resize,
  dpr, the static/reduced-motion single frame, and teardown. Its optional
  `frameRate` param gates painting on `engine/timing.frameIndex` boundaries —
  between boundaries the raster is held (stop-motion cadence, no upload),
  0/undefined keeps the smooth ~30fps throttle; every background passes a
  `frameRate` prop (default 0) through. Its paints book against the kit's
  one frame budget (`engine/frame-budget.ts`, verbatim; a paint past it
  waits a frame, one that waited always paints), its box is read on
  resize only and its context once. A new background is
  an engine `paint*` fn plus a thin `.svelte` that binds a canvas and passes a
  `render(buffer, clock, dt, elapsed)` callback and a `restartKey` — never
  re-implement the loop per component. The action restarts when `restartKey`
  changes and always paints with the latest `render` closure; a restart
  keeps a paint already queued, so a key driven every frame still paints
  (`tests/surface.spec.ts`).
- Step-timing parity: `engine/timing.ts` has no Svelte-side test suite —
  `tests/timing.spec.ts` at the repository root pins the css-easing-1 parity
  table for BOTH copies (verbatim rule above), so re-copy on change and keep
  that table green there.
- Self-contained canvas components (e.g. `DitherButton`) put their paint loop in
  a LOCAL action, deferring the first `init` through `requestAnimationFrame` to
  avoid a forced reflow — mirroring the kit component's rAF defer.
- `canvas-mount.ts` is the shared `paintOnResize` ACTION for static/param-repaint
  canvas controls (switch, checkbox, badge, meter, separator, rating, slider,
  toggle, radio/toggle-group dots): attach it to the `<canvas>`, it measures the
  parent, rAF-defers the first paint, repaints on resize, and repaints when its
  `$derived` paint closure changes. The host passes a `(canvas, host) => void`
  closure (reading current props so Svelte tracks them) — do NOT re-implement the
  rAF/ResizeObserver skeleton per component. Continuous animated canvases
  (progress band, skeleton shimmer) keep a bespoke local action with their own
  rAF loop + IntersectionObserver visibility gate.
- Prop-synced editable buffers translate WITHOUT `$effect`: an in-progress
  `$state` override plus a `$derived` fallback to the model (`typed ?? String(value)`
  in NumberField, `typed ?? selected.label` in Combobox) resets with the
  model — null override outside editing, cleared on commit.
  A group→item update (a value handed down with its change callback) is a
  Svelte function binding `bind:value={() => get, (v) => set}` (CheckboxGroup),
  keeping the child a pure `$bindable`. OTP `digits` must stay authoritative
  `$state` (seeded once via `untrack`) because gaps cannot round-trip a joined
  string; it drives the model one-way, so external resync is not mirrored.
- Events other than the model's update are callback props
  (`oncomplete?: (code) => void` on OtpField, `onsubmit?: () => void` on Form,
  `onopen?: () => void` on SwipeArea).
- Regions named by data (one per `item.value`, Accordion) are
  named snippet props captured through `...rest` on `$props()` and rendered by
  key (`{@render (rest[item.value] as Snippet)?.()}`); type them with a
  `[slot: string]: unknown` index signature on `Props`. Static named/default
  slots stay explicit `Snippet` props.
- Svelte 5 `svelte-ignore` takes ONE rule code per comment (trailing text is a
  description); stack multiple comment lines to suppress several rules.
- `runtime/control.ts` owns native-control tokens and the field context
  (`setContext`/`getContext`); the context value exposes live GETTERS
  (backed by `$derived`), so descendants read `field.controlId`.
- Print screens: `runtime/screen.ts` is the kit's
  `solid/runtime/screen.ts` on Svelte's context: `widgets/DitherScreen.svelte` calls `setScreen(() => screen)`,
  and a surface takes `const ditherMatrix = useDitherMatrix()` in its
  setup with `const matrix = $derived(ditherMatrix(seed))` (the getter
  read inside the derivation, so a screen change repaints); a labelled
  fill (badge, toggle, button) keeps Bayer through `useLabelMatrix`, and
  the chart controllers' `matrixOf` feeds every canvas. `backgrounds/
  Poster.svelte` is `DitherPoster` over the verbatim `engine/poster.ts`.
- Charts: roots provide reactive context via `setContext` getters; parts (`Area`,
  `Line`, `Bar`, ...) self-register through `register*` Svelte ACTIONS (init ->
  register, param change -> re-register, unmount -> unregister). Chart
  dimensions are a `chartDimensions` action. The controllers are `.svelte.ts` factories (`chart-controller.svelte.ts`,
  `polar-controller.svelte.ts`): runes but NO `$effect`. Data changes and the entrance are pure
  derivations — a change-detecting `revision` (a plain
  counter bumped inside `$derived.by` only when `data`/`replayToken` identity
  changes) and an entrance-epoch (`entranceDone = !animate || epoch === revision`,
  `markEntranceDone` sets `epoch = revision`). Each controller returns a plain
  object of GETTERS over its `$state`/`$derived`, so templates track and the
  canvas rAF loop reads `ctx.*` fresh every frame (owned Svelte deriveds are
  pull-fresh when read outside a reaction — verified).
- Chart canvases (`CartesianCanvas`/`BarCanvas`/`PieCanvas`/`RadarCanvas`.svelte)
  carry the kit's framework-free `start*Loop` engine (`dither-kit/engine/`'s
  `*-loop.ts`) in the `<script module>` block, re-carried by hand on a
  change there (no spec pins these copies; `tests/chart-entrance.spec.ts`
  holds the cartesian loop's entrance rule in both); the thin wrapper is one shared action,
  `chart-canvas.ts` (`use:chartCanvas`), owning the IntersectionObserver gate +
  rAF-deferred (re)start on `restartKey` + wake on `wakeKey`. The loop reads live
  state through getter `Box`es (`{ get current() { return derived } }`), never
  `$effect`. Roots are `CartesianChart.svelte` / `PolarChart.svelte` (a `chartType`
  prop selects canvas + fallback chains) with thin `AreaChart`/`LineChart`/
  `BarChart`/`PieChart`/`RadarChart` wrappers + `Sparkline`; `RadarChart` renders
  its baked `<RadarFrame>` back-decoration.
- LAYER ROUTING: Svelte cannot inspect a child's `chartLayer` (the Solid
  layer sorts a root's children in `runtime/chart-layer.tsx`). Instead each
  SVG part SELF-STACKS: it renders its own
  `<svg class="pointer-events-none absolute inset-0 ... overflow-visible">` with a
  `<g transform="translate(margins)">`, at `z-index` 5 for `chartLayer="back"`
  (`Grid`, `RadarFrame`), 20 for front parts (axes, dots, series hit-areas). The
  canvas sits at z-10, `Legend`/`Tooltip` (`chartLayer="dom"`) at z-30. Children
  render ONCE; the self-`<svg>` wrapper also fixes the SVG namespace (a bare `<g>`
  at a component root is created in the wrong namespace). Interactive hit paths
  keep `pointer-events:auto` on just the `<path>`/`<rect>` (events bubble to the
  root's pointermove); their wrapper svg stays `pointer-events-none`.
- `engine/dither-paint.ts` is the one engine file kept as the port's own
  (the byte-for-byte spec leaves it out, so a change to the kit's is carried
  into it by hand): `AreaVariant` is defined here (the low-level painting
  layer) instead of being type-imported from the kit's `chart-types.ts`, and
  `charts/chart-context.ts` re-exports it from `dither-paint` rather than
  redefining it.
- Respect `prefers-reduced-motion` inside the kit (canvas via
  `pixelPrefersReducedMotion`, CSS via `@media`) — consumers must not opt in.
- Primary canvas contexts use `{ willReadFrequently: true }` (bulk
  `putImageData`); bloom canvases omit it (they only `drawImage`).
- Portals are the `portal` ACTION (`runtime/portal.ts`): it appends the node
  to `document.body` on mount and `node.remove()`s on destroy, so Svelte plays
  out-transitions before teardown. The overlays the kit portals (dialog,
  alert-dialog, drawer, context-menu, toaster) use it — and, like the
  kit's, carry `font-mono` on their own panel, since the portal leaves the
  host's font behind; in-place popovers, menus,
  and tooltips do not. Outside-click / Escape dismissal is an always-mounted
  `<svelte:window>` listener guarded by the open flag — the opening pointerdown
  lands while open is still false, so no deferral is needed. A
  panel gated by `{#if open}` uses its mount/destroy (an action) as the open/close
  seam for focus capture-restore and parent push-channel notify.
- A module-level store is a `.svelte.ts` module
  exporting `$state` (e.g. `runtime/toast.svelte.ts`); consumers import and mutate it
  (push/splice), never reassign the export. Timers/lifecycle live in the store's
  plain functions, not `$effect`.
- No other framework's imports. Runtime deps: `clsx`, `tailwind-merge`, `d3-scale`,
  `d3-shape` (charts), and the `svelte` peer — `package.json` lists all four.
- The site's docs derive their Svelte code tabs by parsing this kit's
  `index.ts` export names (`src/pages/docs/svelte-code.ts`) and serve this
  kit's own source beside them (`kit/src/svelte/`, the `kitSources` plugin
  in `solid-site/kit-sources.ts`); keep index exports accurate and expect
  renames to propagate to the docs automatically.

## Work Guidance

- To port a kit component: copy the engine `.ts` closure it needs verbatim,
  write what its Solid file takes from `solid/runtime/` as a rune or action
  module, then translate the `.tsx` to `.svelte` following the patterns
  above.
- Keep `index.ts` in step with what is actually ported; do not export a
  component before its file exists and `check` is green.

## Verification

- `npm run check` (svelte-check) must stay green with 0 errors and 0 warnings.

## Structure

Files are grouped into subfolders; `index.ts` (root) is the only public entry
and re-exports everything. Internal imports are relative across folders
(`../engine/pixel`, `../runtime/lib`); consumers only ever touch `index.ts`.

- `engine/` — framework-agnostic paint & math `.ts` (palette, pixel, raster,
  noise, precompile, dither-paint, timing, scales, polar, dot-paint, every
  `paint*` module). Copied verbatim from `dither-kit`; re-copy with
  `cp ../dither-kit/engine/X.ts engine/X.ts`.
- `runtime/` — shared Svelte seams reused across families: `lib` (cn),
  `control` (tokens + field context), `in-view`, `portal`, `canvas-mount`,
  `use-dither-background`, `toast.svelte`, `gesture`, `screen` (the
  print screen's context).
- `backgrounds/` — the 55 generative canvas backgrounds (the poster among
  them).
- `text/` — text & cursor/pointer effects.
- `controls/` — form/input controls (reuse `runtime/control`).
- `overlays/` — dialogs, menus, popovers, tooltips, sidebar, toaster.
- `widgets/` — image/avatar/spinner + layout (accordion, breadcrumb, etc.).
- `charts/` — chart roots, parts, canvases, controllers, and chart context `.ts`.

## Child DOX Index

- none (subfolders share this contract; no folder yet needs its own rules)
