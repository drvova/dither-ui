# Dither Kit — Vue

A faithful **Vue 3** port of [Dither Kit](https://tripwire.sh/dither-kit) — composable
ordered-dither **area, line, bar, pie and radar** charts on one tiny canvas engine,
plus generative **avatars**, **buttons**, and **gradient washes**. Charts inspired by
[Evil Charts](https://evilcharts.com).

Copy-in components (shadcn-style): the library lives in `dither-kit/` with no
imports from the app. Its runtime dependencies are Vue, `d3-scale`, `d3-shape`,
`clsx` and `tailwind-merge`.

The repo also ships a **multi-artboard chart studio** — a Figma-style editor
(infinite pan/zoom canvas, layers panel, contextual inspector with full granular
control, live code export) built on the library.

```bash
npm install
npm run dev      # http://localhost:5173 — the site; /studio is the editor
npm run build    # type-check + production build
# GitHub Pages uses .github/workflows/pages.yml and builds with /dither-ui/ by default.
# Set repo variable VITE_BASE_PATH=/ for a custom root domain, and PAGES_CNAME if needed.
```

### Studio

- **Canvas** — wheel to pan, ⌘/ctrl-wheel to zoom, drag empty space to pan.
- **Artboards** — add (any chart type), select, drag the title to move, drag the
  corner to resize, duplicate, delete.
- **Layers** — the composed chart tree (root → grid, axes, series, legend,
  tooltip) with per-layer visibility toggles.
- **Inspector** — contextual props for the selected layer: frame X/Y/W/H, chart
  type, bloom, stack, margins T/R/B/L, animation duration; per-series colour /
  variant / clickable; grid h-v-dash; axis ticks; legend align; tooltip variant;
  pie inner radius.
- **Export** — a runnable Vue SFC of the selected artboard.

### Architecture (Feature-Sliced Design)

```
src/
  app/        app init, root component, global styles
  pages/      landing, docs, studio
  widgets/    canvas, layers-panel, inspector, toolbar, chart-renderer
  features/   pan-zoom, artboard-transform, export-code
  entities/   chart (model + codegen), artboard, editor (document store)
  shared/     ui, lib, config

dither-kit/
  Vue kit source (charts, avatars, buttons, surfaces)
```

Imports inside `src/` only ever point downward (app → … → shared); each slice
exposes a public `index.ts` barrel. The app imports the portable kit through
`@dither-kit`.

## Usage

Charts use a **children-as-config** API — compose parts inside a root:

```vue
<script setup lang="ts">
import {
  AreaChart, Area, Grid, XAxis, YAxis, Legend, Tooltip,
  type ChartConfig,
} from "@dither-kit"

const data = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
]
const config: ChartConfig = {
  desktop: { label: "Desktop", color: "blue" },
  mobile: { label: "Mobile", color: "purple" },
}
</script>

<template>
  <div class="h-80">
    <AreaChart :data="data" :config="config" bloom="low">
      <Grid />
      <XAxis dataKey="month" />
      <YAxis />
      <Area dataKey="desktop" is-clickable />
      <Area dataKey="mobile" variant="hatched" is-clickable />
      <Legend is-clickable />
      <Tooltip labelKey="month" />
    </AreaChart>
  </div>
</template>
```

Roots must be given a sized container (the canvas measures its parent).

### Fast And Precompiled Rendering

For deterministic server-rendered surfaces, compile the dither backing store on
the server and send its encoded image URL to the kit. The compiler has no DOM,
canvas, or Vue dependency and returns RGBA pixels, so use the image encoder your
server already uses:

```ts
import sharp from "sharp"
import { renderDitherGradient } from "@dither-kit"

const raster = renderDitherGradient({
  width: 960, height: 600, cell: 2, from: "blue", to: "transparent", seed: 42,
})
const png = await sharp(Buffer.from(raster.data), {
  raw: { width: raster.width, height: raster.height, channels: 4 },
}).png().toBuffer()
// Store png and pass its URL to the client.
```

Pass the packaged URL through `precompiled`. On charts it replaces only the
plot canvas, so axes, legends, tooltips, and interactions can remain composed
around it. The asset must match the chart's plot dimensions and should be
invalidated when data, colors, dimensions, or dither props change:

```vue
<AreaChart :data="data" :config="config" :precompiled="{ src: chartPngUrl }" :animate="false">
  <Grid /><XAxis dataKey="month" /><YAxis />
  <Area dataKey="desktop" />
</AreaChart>
```

`DitherGradient`, `DitherImage`, `DitherButton`, and `DitherSpinner` accept the
same `precompiled` URL. Use `renderMode="static"` when the visual should still
be painted in the browser but never animate or observe resizes. Without a
packaged asset, the kit also batches gradient/button/spinner pixels through
`ImageData`, caps chart backing resolution with `cell`, pauses off-screen chart
loops, and avoids rebuilding bloom layers when the frame is unchanged.

### Benchmark

Open `http://localhost:5173/benchmarks/` after `npm run dev`. The browser
benchmark performs 3 warmups, then 6 measured batches × 2 repetitions.
Gradient samples run at 960×600 CSS px with 2 px cells and compare the legacy
per-cell `fillRect` painter with RGBA generation plus one `putImageData` upload.
Button samples run at 240×56 CSS px and compare fresh RGBA allocation against a
reused target buffer. The table reports mean, median, p95, canvas calls, and
RGBA allocation count.

A local Chrome run of the expanded benchmark produced:

| Painter | Mean | Median | p95 | Canvas calls | RGBA allocations |
| --- | ---: | ---: | ---: | ---: | ---: |
| Gradient legacy fillRect | 109.11 ms | 107.70 ms | 174.40 ms | 144,000 | 0 |
| Gradient RGBA + putImageData | 4.70 ms | 4.10 ms | 10.00 ms | 1 | 13 |
| Button fresh RGBA buffer | 0.28 ms | 0.30 ms | 0.40 ms | 1 | 24 |
| Button reused RGBA buffer | 0.45 ms | 0.20 ms | 2.90 ms | 1 | 2 |

The gradient rows in that run show a **23.2× speedup** and **95.7% lower
measured paint latency**. The button rows are intentionally small in wall-clock
terms; their useful signal is allocation behavior, where reuse keeps the repeated
RGBA buffer allocation count bounded at two reusable objects.

Earlier five independent local Chrome runs without CPU throttling produced:

| Run | Legacy mean | Legacy median | Legacy p95 | Raster mean | Raster median | Raster p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 110.80 ms | 109.70 ms | 173.20 ms | 6.44 ms | 4.00 ms | 36.10 ms |
| 2 | 111.76 ms | 114.40 ms | 180.00 ms | 4.01 ms | 4.30 ms | 5.10 ms |
| 3 | 108.18 ms | 110.00 ms | 151.00 ms | 4.07 ms | 4.50 ms | 4.80 ms |
| 4 | 122.25 ms | 121.80 ms | 179.60 ms | 5.62 ms | 4.60 ms | 20.10 ms |
| 5 | 118.31 ms | 129.30 ms | 156.60 ms | 3.94 ms | 3.90 ms | 4.60 ms |
| Average mean | 114.26 ms | — | — | 4.82 ms | — | — |

The earlier average means show a **23.7× speedup** and **95.8% lower measured
paint latency**. Each legacy gradient sample made 144,000 `fillRect` calls; each
raster gradient sample made one `putImageData` upload. These are directional
measurements on one desktop, not a device-independent latency promise. Re-run
the page on target low-power devices before choosing `cell`, animation, bloom,
or precompilation policy.

### Components

Selected public exports:

| Charts | Parts | Standalone |
| --- | --- | --- |
| `AreaChart` `LineChart` | `Area` `Line` `Bar` `Pie` `Radar` | `DitherButton` |
| `BarChart` | `Grid` `XAxis` `YAxis` | `DitherAvatar` `DitherImage` |
| `PieChart` `RadarChart` | `Dot` `ActiveDot` `Legend` `Tooltip` | `DitherGradient` `DitherSpinner` |
| | `Sparkline` `RadarFrame` | |

The barrel also exports the rest of the control, feedback, navigation, overlay,
and surface set. Shared props: `bloom` (`off`/`low`/`high`/`aura`),
`bloomOnHover`, `animate`, `stackType` (`default`/`stacked`/`percent`),
`hovered`, `markerIndex`, `defaultSelectedDataKey`, `onSelectionChange`,
`onHoverChange`. Fill `variant`: `gradient`/`dotted`/`hatched`/`solid`.
Palette colors: `green` `blue` `purple` `pink` `orange` `red` `grey`.

## Port notes

- React context → Vue `provide`/`inject` with a reactive getter-facade controller.
- React `useMemo`/`useCallback` ceremony → Vue `computed`/`ref` (reactivity handles it).
- The `chartLayer` children-routing → render-function vnode inspection.
- The framework-agnostic `requestAnimationFrame` canvas painters port ~verbatim.
- The tooltip's `motion` spring → Vue `<Transition>` + a CSS glide (no extra dep).
- Tailwind v4 with shadcn-style tokens (`--foreground`, `--card`, …) in `src/styles.css`.

## Credits

Dithering approach and the original **Dither Kit** charts by
[tripwire.sh/dither-kit](https://www.tripwire.sh/dither-kit).
