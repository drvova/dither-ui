# dither-kit-svelte — the Svelte 5 toolkit

## Purpose

Svelte 5 port of `dither-kit` (the Vue toolkit): the same ordered-dither (Bayer)
engine and component contracts, re-expressed in Svelte 5 runes. Portable like
its Vue sibling — copy the folder, alias it, consume from `index.ts`. This is an
in-progress port delivered in batches; the bootstrap slice proves the canonical
patterns and the rest follows the same mechanical translation.

## Ownership

- Owns the Svelte-flavoured component surface and the framework glue that the
  Vue kit expresses with the Composition API (lifecycle, reactivity, context).
- The rendering ENGINE is NOT owned here. The Vue kit's Vue-free `.ts` engine
  modules (palette, pixel, raster, noise, precompile, dither-paint, the `paint*`
  families) are copied VERBATIM. `../dither-kit` stays the single source of
  truth for engine math; a change there is re-copied here, not re-invented.

## Local Contracts

- Svelte 5 runes ONLY. No legacy API: no `export let`, no `$:` reactive
  statements, no `<slot>`, no `on:` directives, no `createEventDispatcher`, no
  `beforeUpdate`/`afterUpdate`, no `$$props`/`$$restProps`. Props via `$props()`,
  derivations via `$derived`, local element refs via `$state` + `bind:this`,
  two-way binding via `$bindable`, children via `Snippet` + `{@render ...}`.
- No `$effect`. DOM lifecycle (canvas loops, observers, listeners) lives in
  Svelte ACTIONS (`use:` directives) or `onMount`/`onDestroy`; reactive
  computation lives in `$derived`. Actions are the DOM-lifecycle seam.
- `use-dither-background.ts` is the shared background runtime, ported from the
  Vue composable to the `ditherBackground` ACTION: it owns the throttled rAF
  loop, backing buffer + upload, IntersectionObserver visibility gate, resize,
  dpr, the static/reduced-motion single frame, and teardown. A new background is
  an engine `paint*` fn plus a thin `.svelte` that binds a canvas and passes a
  `render(buffer, clock, dt, elapsed)` callback and a `restartKey` — never
  re-implement the loop per component. The action restarts when `restartKey`
  changes and always paints with the latest `render` closure.
- Self-contained canvas components (e.g. `DitherButton`) put their paint loop in
  a LOCAL action, deferring the first `init` through `requestAnimationFrame` to
  avoid a forced reflow — mirroring the Vue component's rAF defer.
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
  in NumberField, `typed ?? selected.label` in Combobox) reproduces a Vue
  `watch(modelValue)` reset — null override outside editing, cleared on commit.
  A group→item update (Vue `:model-value` + `@update:model-value`) becomes a
  Svelte function binding `bind:value={() => get, (v) => set}` (CheckboxGroup),
  keeping the child a pure `$bindable`. OTP `digits` must stay authoritative
  `$state` (seeded once via `untrack`) because gaps cannot round-trip a joined
  string; it drives the model one-way, so external resync is not mirrored.
- Custom events other than `update:modelValue` become callback props
  (`oncomplete?: (code) => void` on OtpField, `onsubmit?: () => void` on Form,
  `onopen?: () => void` on SwipeArea).
- Vue dynamic named slots (`<slot :name="item.value" />`, Accordion) become
  named snippet props captured through `...rest` on `$props()` and rendered by
  key (`{@render (rest[item.value] as Snippet)?.()}`); type them with a
  `[slot: string]: unknown` index signature on `Props`. Static named/default
  slots stay explicit `Snippet` props.
- Svelte 5 `svelte-ignore` takes ONE rule code per comment (trailing text is a
  description); stack multiple comment lines to suppress several rules.
- `control.ts` owns native-control tokens and the field context. Svelte
  `setContext`/`getContext` replace Vue `provide`/`inject`; the context value
  exposes live GETTERS (backed by `$derived`) instead of Vue `Ref`s, so
  descendants read `field.controlId`, not `field.controlId.value`.
- Charts: roots provide reactive context via `setContext` getters; parts (`Area`,
  `Line`, `Bar`, ...) self-register through `register*` Svelte ACTIONS (init ->
  register, param change -> re-register, unmount -> unregister) instead of Vue's
  `watch(immediate)` + `onBeforeUnmount`. `useChartDimensions` -> a `chartDimensions`
  action. Runes live in components, so chart controller assembly belongs to the
  root component, not a plain `.ts`. The chart ROOT engine (`area-chart`,
  `cartesian-root`/`-canvas`, `polar-root`, `*-canvas`) + `Sparkline` are a
  pending follow-up batch (Vue `h()` render functions have no direct Svelte form).
- `dither-paint.ts` carries ONE deliberate change from the verbatim copy:
  `AreaVariant` is defined here (the low-level painting layer) instead of being
  type-imported from `chart-context`, which keeps this kit free of the
  Vue-reactive chart context. When the chart batch lands, `chart-context`
  re-exports `AreaVariant` from `dither-paint` rather than redefining it.
- Respect `prefers-reduced-motion` inside the kit (canvas via
  `pixelPrefersReducedMotion`, CSS via `@media`) — consumers must not opt in.
- Primary canvas contexts use `{ willReadFrequently: true }` (bulk
  `putImageData`); bloom canvases omit it (they only `drawImage`).
- Vue `<Teleport>` becomes the `portal` ACTION (`portal.ts`): it appends the node
  to `document.body` on mount and `node.remove()`s on destroy, so Svelte plays
  out-transitions before teardown. Overlays that Vue teleports (dialog,
  alert-dialog, drawer, context-menu, toaster) use it; in-place popovers, menus,
  and tooltips do not. Outside-click / Escape dismissal is an always-mounted
  `<svelte:window>` listener guarded by the open flag — the opening pointerdown
  lands while open is still false, replacing the Vue `setTimeout(0)` defer. A
  panel gated by `{#if open}` uses its mount/destroy (an action) as the open/close
  seam for focus capture-restore and parent push-channel notify.
- Module-level stores Vue builds with `reactive` become a `.svelte.ts` module
  exporting `$state` (e.g. `toast.svelte.ts`); consumers import and mutate it
  (push/splice), never reassign the export. Timers/lifecycle live in the store's
  plain functions, not `$effect`.
- Zero Vue imports. Runtime deps: `clsx`, `tailwind-merge`, and the `svelte`
  peer only. Deeper engine files pull `d3-scale`/`d3-shape` as they are ported.

## Work Guidance

- Port families in batches. For each Vue component: copy the transitive Vue-free
  engine `.ts` closure verbatim, port any Vue-reactive `.ts` glue to a rune/
  action module, then translate the `.vue` to `.svelte` following the patterns
  above. Copy only the engine closure a batch needs — several engine files pull
  in chart code that is not yet ported.
- Keep `index.ts` in step with what is actually ported; do not export a
  component before its file exists and `check` is green.

## Verification

- `npm run check` (svelte-check) must stay green with 0 errors and 0 warnings.

## Child DOX Index

- none (flat folder by design, mirroring `dither-kit`)
