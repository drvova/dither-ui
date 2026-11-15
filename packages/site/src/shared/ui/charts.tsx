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
export const Area = lazyPart(() => import("@dither-ui/kit/solid/Area.tsx"))
export const Line = lazyPart(() => import("@dither-ui/kit/solid/Line.tsx"))
export const Bar = lazyPart(() => import("@dither-ui/kit/solid/Bar.tsx"))
export const Pie = lazyPart(() => import("@dither-ui/kit/solid/Pie.tsx"))
export const XAxis = lazyPart(() => import("@dither-ui/kit/solid/XAxis.tsx"))
export const Dot = lazyPart(() => import("@dither-ui/kit/solid/Dot.tsx"))
export const Sparkline = lazyPart(() => import("@dither-ui/kit/solid/Sparkline.tsx"))

if (import.meta.env.SSR)
  await Promise.all(
    [AreaChart, LineChart, BarChart, PieChart, Area, Line, Bar, Pie, XAxis, Dot, Sparkline].map((chart) =>
      chart.preload(),
    ),
  )
