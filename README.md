# Dither Kit — Vue

A faithful **Vue 3** port of [Dither Kit](https://tripwire.sh/dither-kit) — composable
ordered-dither **area, line, bar, pie and radar** charts on one tiny canvas engine,
plus generative **avatars**, **buttons**, and **gradient washes**. Charts inspired by
[Evil Charts](https://evilcharts.com).

Copy-in components (shadcn-style): everything lives in
`src/components/dither-kit/` with no runtime framework beyond Vue, `d3-scale`,
`d3-shape`, `clsx` and `tailwind-merge`.

## Run the demo / marketing page

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

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
