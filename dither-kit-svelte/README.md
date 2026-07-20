# dither-kit-svelte

A Svelte 5 port of the [dither-ui](https://dither-ui.com) toolkit — the same
canvas ordered-dither (Bayer 4x4) engine and component contracts as `dither-kit`
(Vue), re-expressed in Svelte 5 runes. Portable: copy the folder, alias it,
import from `index.ts`.

## Status

In-progress port, delivered in batches. The canonical patterns are proven and the
full generative canvas-background family is ported; the remaining components
(charts, text/motion effects, the rest of the controls) follow the same translation.

| Family | Ported | Proves |
| --- | --- | --- |
| Canvas backgrounds | `Aurora`, `Plasma`, `Silk`, `Galaxy`, `Lightning`, ...39 total | shared `ditherBackground` action runtime |
| Text / CSS | `ShinyText` | pure-CSS effect, reduced-motion, `Snippet` |
| Native canvas control | `DitherButton` | self-contained canvas action + pointer easing |
| Context / DI | `DitherField` + `DitherInput` | `setContext`/`getContext`, `$bindable` |

The Vue-free engine modules (`palette`, `pixel`, `raster`, `noise`, `precompile`,
`dither-paint`, and each background's `paint*` module) are copied verbatim from
the Vue kit — `dither-kit` stays the single source of truth for engine math.

The 13 pointer/`<style>`-driven backgrounds (Ferrofluid, FaultyTerminal,
Waves, DotGrid, MetaBalls, Ballpit, ...) are deferred to a follow-up batch
because they need individual pointer/interaction wiring, not a mechanical port.

## Usage

```svelte
<script lang="ts">
  import { Aurora, DitherButton, DitherField, DitherInput } from "dither-kit-svelte"
  let email = $state("")
</script>

<div class="relative h-64">
  <Aurora class="absolute inset-0" seed={7} />
</div>

<DitherButton seed={3} onclick={() => console.log("go")}>Launch</DitherButton>

<DitherField label="Email" description="We never share it.">
  <DitherInput bind:value={email} type="email" placeholder="you@site.dev" />
</DitherField>
```

## Conventions (no legacy API)

- Runes only: `$props`, `$derived`, `$state` + `bind:this`, `$bindable`,
  `Snippet` + `{@render}`. No `export let`, `$:`, `<slot>`, `on:`,
  `createEventDispatcher`, `beforeUpdate`/`afterUpdate`.
- No `$effect`: DOM lifecycle lives in actions (`use:`) or `onMount`/`onDestroy`.
- A new canvas background = an engine `paint*` fn + a thin `.svelte` that binds a
  canvas and passes `render()` + `restartKey` to the `ditherBackground` action.

## Verify

```bash
npm install
npm run check   # svelte-check — 0 errors, 0 warnings
```
