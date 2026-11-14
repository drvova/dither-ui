// The kit's charts as chunks of their own: their scales and shapes (d3) and
// the chart engines are the heaviest part of the kit a page holds, and the
// landing's cards and the docs' chart sections show them only below the
// first screen or once a section opens. A page's first load then stays its
// own; a chart arrives with the page and takes over the bytes it painted.
// Imported by path, like every shared part; each waits in its own place
// (`lazyPart`). A server renders a page whole,
// so it loads them first (as it does the docs' packs): none suspends and
// streams in after the shell.
import { lazyPart } from "@/shared/lib/lazy-part"

export const AreaChart = lazyPart(() =>
  import("@dither-ui/kit/solid/area-chart.ts").then((m) => ({ default: m.AreaChart })),
)
export const LineChart = lazyPart(() =>
  import("@dither-ui/kit/solid/area-chart.ts").then((m) => ({ default: m.LineChart })),
)
export const BarChart = lazyPart(() =>
  import("@dither-ui/kit/solid/bar-chart.ts").then((m) => ({ default: m.BarChart })),
)
export const PieChart = lazyPart(() =>
  import("@dither-ui/kit/solid/pie-chart.ts").then((m) => ({ default: m.PieChart })),
)
export const RadarChart = lazyPart(() =>
  import("@dither-ui/kit/solid/radar-chart.ts").then((m) => ({ default: m.RadarChart })),
)
export const Area = lazyPart(() => import("@dither-ui/kit/solid/Area.tsx"))
export const Line = lazyPart(() => import("@dither-ui/kit/solid/Line.tsx"))
export const Bar = lazyPart(() => import("@dither-ui/kit/solid/Bar.tsx"))
export const Pie = lazyPart(() => import("@dither-ui/kit/solid/Pie.tsx"))
export const Radar = lazyPart(() => import("@dither-ui/kit/solid/Radar.tsx"))
export const Grid = lazyPart(() => import("@dither-ui/kit/solid/Grid.tsx"))
export const XAxis = lazyPart(() => import("@dither-ui/kit/solid/XAxis.tsx"))
export const YAxis = lazyPart(() => import("@dither-ui/kit/solid/YAxis.tsx"))
export const Dot = lazyPart(() => import("@dither-ui/kit/solid/Dot.tsx"))
export const Legend = lazyPart(() => import("@dither-ui/kit/solid/Legend.tsx"))
export const Tooltip = lazyPart(() => import("@dither-ui/kit/solid/Tooltip.tsx"))
export const Sparkline = lazyPart(() => import("@dither-ui/kit/solid/Sparkline.tsx"))

if (import.meta.env.SSR)
  await Promise.all(
    [
      AreaChart,
      LineChart,
      BarChart,
      PieChart,
      RadarChart,
      Area,
      Line,
      Bar,
      Pie,
      Radar,
      Grid,
      XAxis,
      YAxis,
      Dot,
      Legend,
      Tooltip,
      Sparkline,
    ].map((chart) => chart.preload()),
  )
