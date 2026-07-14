# Dither Kit — Vue

A faithful **Vue 3** port of [Dither Kit](https://tripwire.sh/dither-kit) — composable
ordered-dither **area, line, bar, pie and radar** charts on one tiny canvas engine,
plus generative **avatars**, **buttons**, and **gradient washes**. Charts inspired by
[Evil Charts](https://evilcharts.com).

Copy-in components (shadcn-style): the library lives in
`src/shared/dither-kit/` with no runtime framework beyond Vue, `d3-scale`,
`d3-shape`, `clsx` and `tailwind-merge`.

The repo also ships a **multi-artboard chart studio** — a Figma-style editor
(infinite pan/zoom canvas, layers panel, contextual inspector with full granular
control, live code export) built on the library.

```bash
npm install
npm run dev      # http://localhost:5173 — the studio
npm run build    # type-check + production build
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
  pages/      studio page (composition root)
  widgets/    canvas, layers-panel, inspector, toolbar, chart-renderer
  features/   pan-zoom, artboard-transform, export-code
  entities/   chart (model + codegen), artboard, editor (document store)
  shared/     dither-kit (the component library), ui, lib, config
```

Imports only ever point downward (app → … → shared); each slice exposes a public
`index.ts` barrel.

## Usage

Charts use a **children-as-config** API — compose parts inside a root:

```vue
<script setup lang="ts">
import {
  AreaChart, Area, Grid, XAxis, YAxis, Legend, Tooltip,
  type ChartConfig,
} from "@/components/dither-kit"

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

### Components

| Charts | Parts | Standalone |
| --- | --- | --- |
| `AreaChart` `LineChart` | `Area` `Line` `Bar` `Pie` `Radar` | `DitherButton` |
| `BarChart` | `Grid` `XAxis` `YAxis` | `DitherAvatar` |
| `PieChart` `RadarChart` | `Dot` `ActiveDot` `Legend` `Tooltip` | `DitherGradient` |
| | `Sparkline` `RadarFrame` | |

Shared props: `bloom` (`off`/`low`/`high`/`aura`), `bloomOnHover`, `animate`,
`stackType` (`default`/`stacked`/`percent`), `hovered`, `markerIndex`,
`defaultSelectedDataKey`, `onSelectionChange`, `onHoverChange`. Fill `variant`:
`gradient`/`dotted`/`hatched`/`solid`. Palette colors: `green` `blue` `purple`
`pink` `orange` `red` `grey`.

## Port notes

- React context → Vue `provide`/`inject` with a reactive getter-facade controller.
- React `useMemo`/`useCallback` ceremony → Vue `computed`/`ref` (reactivity handles it).
- The `chartLayer` children-routing → render-function vnode inspection.
- The framework-agnostic `requestAnimationFrame` canvas painters port ~verbatim.
- The tooltip's `motion` spring → Vue `<Transition>` + a CSS glide (no extra dep).
- Tailwind v4 with shadcn-style tokens (`--foreground`, `--card`, …) in `src/styles.css`.
