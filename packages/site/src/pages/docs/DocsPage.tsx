import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  cssColor,
  DitherAvatar,
  DitherButton,
  DitherCommand,
  DitherGradient,
  DitherIcon,
  DitherImage,
  DitherNumberFlow,
  Dot,
  Grid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  Sparkline,
  Tooltip,
  XAxis,
  YAxis,
  type AreaVariant,
  type ButtonVariant,
  type DitherColor,
  type DotVariant,
  type GradientDirection,
  type PixelBloom,
} from "@dither-ui/kit"
import { Meta } from "@solidjs/meta"
import { useNavigate } from "@solidjs/router"
import { createEffect, createMemo, createSignal, For, type JSX, on, onCleanup, onMount, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { Dynamic } from "solid-js/web"
import { GROUPS } from "@/pages/docs/groups"
import { packOf, packOpen, PACKS_KEPT, type PackName, visitPack } from "@/pages/docs/packs"
import { groupOf, neighbours, sectionOf, SECTION_IDS } from "@/pages/docs/pages"
import { docsMeta } from "@/pages/docs/seo"
import "@/shared/fonts/display.css"
import { version } from "../../../package.json"
import { assetPath, modKey, routePath, useTheme } from "@/shared/lib"
import { restoreStyling, setStyling, STYLING_LABELS, styling, STYLINGS } from "@/shared/lib/restyle"
import { play, restoreSounds, setSounds, sounds } from "@/shared/lib/sound"
import { AdSlot, CodeBlock } from "@/shared/ui"
import Mascot from "@/shared/ui/Mascot"
import ToolMark from "@/shared/ui/ToolMark"
import { SiteHeader } from "@/widgets/site-header"
import DemoCard from "./DemoCard"
import DocsNav, { docsUrl, type PagePart } from "./DocsNav"
import DocsSheet, { SHEET_ID } from "./DocsSheet"
import EngineSection from "./handbook/EngineSection"
import VerificationSection from "./handbook/VerificationSection"
import PageHead from "./PageHead"
import OnThisPage from "./OnThisPage"
import QuickStart from "./overview/QuickStart"
import { PACK_COMPONENTS } from "./pack-loaders"
import PropsTable, { type PropRow } from "./PropsTable"
import SectionShare from "./SectionShare"
import { docsCode } from "./snippet"
import ScreensSection from "./utils/ScreensSection"
import "./DocsPage.css"

// Believable dashboard numbers, not sine waves.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const revenue = [42, 51, 48, 63, 71, 68, 79, 86, 82, 94, 102, 118]
const expenses = [31, 34, 33, 39, 44, 47, 46, 52, 55, 58, 61, 67]
const rows = MONTHS.map((month, i) => ({ month, revenue: revenue[i], expenses: expenses[i] }))
const config = {
  revenue: { label: "Revenue", color: "blue" as DitherColor },
  expenses: { label: "Expenses", color: "purple" as DitherColor },
}

const trafficRows = MONTHS.slice(0, 8).map((month, i) => ({
  month,
  organic: [820, 932, 901, 1290, 1330, 1320, 1450, 1682][i],
  paid: [420, 532, 501, 654, 690, 720, 810, 932][i],
}))
const trafficConfig = {
  organic: { label: "Organic", color: "green" as DitherColor },
  paid: { label: "Paid", color: "orange" as DitherColor },
}

const pieRows = [
  { name: "Chrome", value: 61 },
  { name: "Safari", value: 19 },
  { name: "Firefox", value: 11 },
  { name: "Other", value: 9 },
]
const pieConfig = {
  Chrome: { label: "Chrome", color: "blue" as DitherColor },
  Safari: { label: "Safari", color: "purple" as DitherColor },
  Firefox: { label: "Firefox", color: "orange" as DitherColor },
  Other: { label: "Other", color: "grey" as DitherColor },
}

const radarConfig = {
  current: { label: "This sprint", color: "blue" as DitherColor },
  previous: { label: "Last sprint", color: "grey" as DitherColor },
}
const radarRows = [
  { axis: "shipped", current: 9, previous: 6 },
  { axis: "reviewed", current: 7, previous: 7 },
  { axis: "tested", current: 8, previous: 5 },
  { axis: "documented", current: 6, previous: 3 },
  { axis: "on time", current: 8, previous: 6 },
]

// Stat-card sparklines, the last 24 hours each. Every figure a card states
// is read from the series it plots: the headline is the last hour, the
// delta the change across the day (a falling error rate is the good way).
const trend = (seed: number, drift: number) =>
  Array.from(
    { length: 24 },
    (_, i) => 10 + i * drift + Math.sin(i * 0.8 + seed) * 2 + Math.sin(i * 1.7 + seed * 2) * 1.1,
  )
type Unit = { pre: string; scale: number; dec: number; suf: string }
const stat = (label: string, color: DitherColor, data: number[], unit: Unit, lowerIsBetter = false) => {
  const first = data[0] ?? 0
  const last = data[data.length - 1] ?? 0
  const pct = (last / first - 1) * 100
  const read = (v: number) => Number((v * unit.scale).toFixed(unit.dec))
  return {
    label,
    color,
    data,
    unit,
    read,
    value: `${unit.pre}${read(last).toLocaleString("en-US", { minimumFractionDigits: unit.dec })}${unit.suf}`,
    delta: `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`,
    up: lowerIsBetter ? pct < 0 : pct > 0,
  }
}
const STATS = [
  stat("Revenue", "green", trend(1, 0.35), { pre: "$", scale: 2.4, dec: 1, suf: "k" }),
  stat("Active users", "blue", trend(2, 0.2), { pre: "", scale: 600, dec: 0, suf: "" }),
  stat(
    "Error rate",
    "red",
    trend(3, -0.18).map((v) => v + 8),
    { pre: "", scale: 0.03, dec: 2, suf: "%" },
    true,
  ),
]
const VARIANTS: AreaVariant[] = ["gradient", "dotted", "hatched", "solid"]
const DOT_VARIANTS: DotVariant[] = ["border", "colored-border", "filled"]

// Seed-generative textures: one integer, one deterministic texture.
const SEEDS = [7, 1984, 4242, 90210, 31337]

// A picked tile or chip wears the site's pressed state (ink in a ring), so
// the pick reads on either theme, never a fill a shade off the ground.
const thumbClass = (active: boolean) =>
  `rounded-md p-2 text-left transition-colors ${active ? "ring-on" : "hover:bg-card/50"}`
const thumbLabel = (active: boolean) =>
  `mt-2 text-center text-[10px] transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`
const chipClass = (active: boolean) =>
  `rounded px-2.5 py-1 text-[11px] transition-colors ${active ? "ring-on" : "text-muted-foreground hover:text-foreground"}`

const BLOOMS: PixelBloom[] = ["off", "low", "high", "aura"]
const AVATAR_NAMES = ["ada", "linus", "grace", "alan", "edsger", "barbara"]

// App shell example.
const SHELL_NAV = ["Overview", "Reports", "Alerts", "Settings"]

// Team example — contributors and their commit pulse.
const TEAM = [
  { name: "ada", role: "maintainer", commits: 284, color: "green" as DitherColor, data: trend(11, 0.3) },
  { name: "grace", role: "charts", commits: 197, color: "blue" as DitherColor, data: trend(12, 0.24) },
  { name: "linus", role: "engine", commits: 151, color: "purple" as DitherColor, data: trend(13, 0.18) },
  { name: "barbara", role: "docs", commits: 96, color: "orange" as DitherColor, data: trend(14, 0.12) },
]

// Usage example — renders per month and quota.
const usageRows = MONTHS.slice(0, 8).map((month, i) => ({
  month,
  renders: [212, 248, 231, 290, 341, 322, 398, 441][i],
}))
const usageConfig = { renders: { label: "Renders (k)", color: "blue" as DitherColor } }
const quotaRows = [
  { name: "used", value: 68 },
  { name: "free", value: 32 },
]
const quotaConfig = {
  used: { label: "Used", color: "blue" as DitherColor },
  free: { label: "Free", color: "grey" as DitherColor },
}

// Monitoring example — four services, their pulse and state.
const SERVICES = [
  { name: "api-gateway", uptime: "99.98%", ok: true, color: "green" as DitherColor, data: trend(4, 0.1) },
  { name: "render-farm", uptime: "99.91%", ok: true, color: "blue" as DitherColor, data: trend(5, 0.22) },
  { name: "dither-engine", uptime: "100%", ok: true, color: "purple" as DitherColor, data: trend(6, 0.16) },
  {
    name: "webhook-relay",
    uptime: "97.20%",
    ok: false,
    color: "red" as DitherColor,
    data: trend(7, -0.2).map((v) => v + 8),
  },
]
const wave = Array.from({ length: 20 }, (_, i) => 5 + Math.sin(i * 0.6) * 2.2 + Math.sin(i * 1.4) * 1)

// Tiny single-series set for the variant galleries.
const miniRows = [4, 7, 5, 9, 6, 8].map((v, i) => ({ x: i + 1, v }))
const miniConfig = { v: { color: "blue" as DitherColor } }
const miniPieRows = [
  { name: "a", value: 42 },
  { name: "b", value: 33 },
  { name: "c", value: 25 },
]
const miniPieConfig = {
  a: { color: "blue" as DitherColor },
  b: { color: "purple" as DitherColor },
  c: { color: "orange" as DitherColor },
}

const BUTTON_COLORS: DitherColor[] = ["green", "blue", "purple", "pink", "orange", "red"]
const DIRECTIONS: GradientDirection[] = ["up", "down", "left", "right"]
const COLORS: DitherColor[] = ["green", "blue", "purple", "pink", "orange", "red", "grey"]

const API: Record<string, PropRow[]> = {
  cartesian: [
    { prop: "data", type: "Row[]", default: "required" },
    { prop: "config", type: "ChartConfig", default: "required" },
    { prop: "stackType", type: '"default" | "stacked" | "percent"', default: '"default"' },
    { prop: "margins", type: "Partial<Margins>", default: "{}" },
    { prop: "class", type: "string", default: "undefined" },
    { prop: "interactive", type: "boolean", default: "true" },
    { prop: "animate", type: "boolean", default: "true" },
    { prop: "seed", type: "number", default: "undefined" },
    { prop: "effect", type: "number", default: "seed / sparkle" },
    { prop: "animationDuration", type: "number (ms)", default: "seed / 900" },
    { prop: "animationDelay", type: "number (ms)", default: "seed / 0" },
    { prop: "easing", type: "name | bezier tuple | number", default: "seed / chart default" },
    { prop: "sparkles", type: "boolean", default: "true" },
    { prop: "hoverLift", type: "boolean", default: "true" },
    { prop: "stagger", type: "number", default: "seed / 0.55" },
    { prop: "cell", type: "number (px)", default: "2" },
    { prop: "sparkleDensity", type: "number", default: "seed / 1" },
    { prop: "sparkleSpeed", type: "number", default: "seed / 1" },
    { prop: "barGap", type: "number", default: "seed / 0.28" },
    { prop: "barEdge", type: "number", default: "seed / 0.18" },
    { prop: "glowSize", type: "number", default: "seed / 0.16" },
    { prop: "hoverStrength", type: "number", default: "seed / 1" },
    { prop: "dimOpacity", type: "number", default: "seed / 0.3" },
    { prop: "crosshair", type: "boolean", default: "true" },
    { prop: "replayToken", type: "number", default: "0" },
    { prop: "markerIndex", type: "number | null", default: "null" },
    { prop: "hovered", type: "boolean", default: "false" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura" | object | number', default: "seed / off" },
    { prop: "bloomOnHover", type: "boolean", default: "false" },
    {
      prop: "precompiled",
      type: "string | { src: string; width?: number; height?: number }: a packaged plot URL",
      default: "undefined",
    },
    { prop: "defaultSelectedDataKey", type: "string | null", default: "null" },
    { prop: "onHoverChange", type: "(index: number | null) => void", default: "undefined" },
    { prop: "onSelectionChange", type: "(key: string | null) => void", default: "undefined" },
    { prop: "variant (series)", type: "name | TextureConfig | number (seed)", default: '"gradient"' },
  ],
  pie: [
    { prop: "data", type: "Row[]", default: "required" },
    { prop: "config", type: "ChartConfig", default: "required" },
    { prop: "dataKey", type: "string", default: '""' },
    { prop: "nameKey", type: "string", default: "required" },
    { prop: "innerRadius", type: "number 0…0.85", default: "seed / 0" },
    { prop: "margins", type: "Partial<Margins>", default: "{}" },
    { prop: "class", type: "string", default: "undefined" },
    { prop: "animate", type: "boolean", default: "true" },
    { prop: "seed", type: "number", default: "undefined" },
    { prop: "animationDuration", type: "number (ms)", default: "seed / 900" },
    { prop: "animationDelay", type: "number (ms)", default: "seed / 0" },
    { prop: "easing", type: "name | bezier tuple | number", default: "seed / ease-in-out" },
    { prop: "hoverLift", type: "boolean", default: "true" },
    { prop: "cell", type: "number (px)", default: "2" },
    { prop: "popOut", type: "number", default: "seed / 6" },
    { prop: "rimWidth", type: "number", default: "seed / 1.4" },
    { prop: "falloff", type: "number", default: "seed / 0.45" },
    { prop: "hoverStrength", type: "number", default: "seed / 1" },
    { prop: "dimOpacity", type: "number", default: "seed / 0.3" },
    { prop: "startAngle", type: "number", default: "seed / 0" },
    { prop: "replayToken", type: "number", default: "0" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura" | object | number', default: "seed / off" },
    { prop: "bloomOnHover", type: "boolean", default: "false" },
    {
      prop: "precompiled",
      type: "string | { src: string; width?: number; height?: number }: a packaged plot URL",
      default: "undefined",
    },
    { prop: "defaultSelectedDataKey", type: "string | null", default: "null" },
    { prop: "onSelectionChange", type: "(key: string | null) => void", default: "undefined" },
  ],
  radar: [
    { prop: "data", type: "Row[]", default: "required" },
    { prop: "config", type: "ChartConfig", default: "required" },
    { prop: "nameKey", type: "string", default: "required" },
    { prop: "rings", type: "number", default: "seed / 4" },
    { prop: "margins", type: "Partial<Margins>", default: "{}" },
    { prop: "class", type: "string", default: "undefined" },
    { prop: "animate", type: "boolean", default: "true" },
    { prop: "seed", type: "number", default: "undefined" },
    { prop: "animationDuration", type: "number (ms)", default: "seed / 900" },
    { prop: "animationDelay", type: "number (ms)", default: "seed / 0" },
    { prop: "easing", type: "name | bezier tuple | number", default: "seed / ease-in-out" },
    { prop: "hoverLift", type: "boolean", default: "true" },
    { prop: "cell", type: "number (px)", default: "2" },
    { prop: "falloff", type: "number", default: "seed / 0.45" },
    { prop: "hoverStrength", type: "number", default: "seed / 1" },
    { prop: "dimOpacity", type: "number", default: "seed / 0.3" },
    { prop: "startAngle", type: "number", default: "seed / 0" },
    { prop: "replayToken", type: "number", default: "0" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura" | object | number', default: "seed / off" },
    { prop: "bloomOnHover", type: "boolean", default: "false" },
    {
      prop: "precompiled",
      type: "string | { src: string; width?: number; height?: number }: a packaged plot URL",
      default: "undefined",
    },
    { prop: "defaultSelectedDataKey", type: "string | null", default: "null" },
    { prop: "onSelectionChange", type: "(key: string | null) => void", default: "undefined" },
  ],
  sparkline: [
    { prop: "data", type: "number[]", default: "" },
    { prop: "color", type: "DitherColor", default: "" },
    { prop: "variant", type: '"gradient" | "dotted" | "hatched" | "solid"', default: '"gradient"' },
    { prop: "markerIndex", type: "number | null", default: "null" },
    {
      prop: "interactive",
      type: "boolean (scrub: the crosshair follows the pointer; a slider for the keyboard, arrows, Home, End, Escape)",
      default: "false",
    },
    { prop: "label", type: "string (the slider's name, when interactive)", default: '"Series"' },
    { prop: "hoverLift", type: "boolean", default: "true" },
    { prop: "sparkles", type: "boolean (the idle drift along the line)", default: "true" },
    { prop: "onHoverChange", type: "(index: number | null) => void", default: "" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura"', default: '"off"' },
    { prop: "animate", type: "boolean", default: "false" },
  ],
  motion: [
    { prop: "animate", type: "boolean", default: "true" },
    { prop: "animationDuration", type: "number (ms)", default: "900" },
    { prop: "animationDelay", type: "number (ms)", default: "0" },
    { prop: "replayToken", type: "number (bump it to re-run)", default: "0" },
    { prop: "effect", type: "number (its own edge-motion seed)", default: "master seed / gentle" },
  ],
  button: [
    { prop: "color", type: "PixelColor", default: "seed / blue" },
    { prop: "variant", type: '"gradient" | "dotted" | "hatched" | "solid"', default: "seed / gradient" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura" | object | number', default: "seed / off" },
    { prop: "cell", type: "number (px)", default: "seed / 2" },
    { prop: "seed", type: "number", default: "undefined" },
    { prop: "type", type: '"button" | "submit" | "reset"', default: '"button"' },
    { prop: "loading / disabled", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "undefined" },
    { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
    { prop: "precompiled", type: "string | { src: string; width?: number; height?: number }", default: "undefined" },
    { prop: "maxCols / maxRows", type: "number", default: "960 / 600 live, 320 / 200 static" },
  ],
  avatar: [
    { prop: "name", type: "string", default: "" },
    { prop: "size", type: "number (px)", default: "" },
    { prop: "hue", type: "number 0…360", default: "from name" },
    { prop: "mirror", type: '"auto" | "on" | "off"', default: '"auto"' },
    { prop: "animate", type: "boolean", default: "true" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura"', default: '"off"' },
  ],
  gradient: [
    { prop: "from", type: "PixelColor", default: "seed / blue" },
    { prop: "to", type: 'PixelColor | "transparent"', default: '"transparent"' },
    { prop: "direction", type: '"up" | "down" | "left" | "right"', default: "seed / up" },
    { prop: "cell", type: "number (px)", default: "seed / 3" },
    { prop: "opacity", type: "number 0…1", default: "seed / 1" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura" | object | number', default: "seed / off" },
    { prop: "seed", type: "number", default: "undefined" },
    { prop: "class", type: "string", default: "undefined" },
    { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
    { prop: "precompiled", type: "string | { src: string; width?: number; height?: number }", default: "undefined" },
    { prop: "maxCols / maxRows", type: "number", default: "960 / 600 live, 320 / 200 static" },
  ],
  image: [
    { prop: "src", type: "string", default: "required" },
    { prop: "cell", type: "number (px)", default: "seed / 3" },
    { prop: "focusY", type: "number 0…1", default: "seed / 0.5" },
    { prop: "fade", type: "number (px)", default: "seed / 0" },
    { prop: "seed", type: "number", default: "undefined" },
    { prop: "alt", type: "string", default: '""' },
    { prop: "class", type: "string", default: "undefined" },
    { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
    { prop: "precompiled", type: "string | { src: string; width?: number; height?: number }", default: "undefined" },
    { prop: "maxCols / maxRows", type: "number", default: "960 / 600 live, 320 / 200 static" },
  ],
  palette: [
    { prop: "cssColor(c)", type: "(DitherColor | number) → css string", default: "" },
    { prop: "seedFromColor(c)", type: "(DitherColor | number) → Seed", default: "" },
    { prop: "seedFromHue(h)", type: "(number 0…360) → Seed", default: "" },
    { prop: "DitherColor", type: '"green" … "grey": seven seeds', default: "" },
  ],
}

const DURATIONS = [300, 900, 2000]
const effectData = MONTHS.map((month, i) => ({
  month,
  v: 8 + Math.sin(i * 0.7) * 3 + Math.sin(i * 1.9) * 1.5 + i * 0.4,
}))
const effectConfig = { v: { label: "signal", color: "blue" as DitherColor } }

const SNIPPETS = {
  seeds: `<!-- one integer is a complete visual personality: -->
<AreaChart :data="rows" :config="config" :seed="1984">
  <Area data-key="revenue" :variant="1984" />   <!-- texture  -->
</AreaChart>
<!-- :seed derives duration, delay, easing, stagger, sparkles and bloom
     for every prop you leave unset; explicit props always win.
     Seeds also work per prop: bloom / easing / variant / color(hue). -->
<DitherButton :bloom="1984">Glow</DitherButton>`,
  styling: `/* the kit reads shadcn-style tokens: theme by overriding them */
:root {
  --background: #08090b;   /* chart chrome: axes, legend, tooltip */
  --foreground: #ededed;
  --border: #22252b;
  --accent: #3f8ff3;
}

<!-- every component forwards class: compose with your utilities -->
<AreaChart class="rounded-lg border border-border/60 p-2" … />`,
  composition: `<AreaChart :data="rows" :config="config">  <!-- root: scales + context -->
  <Grid horizontal />                       <!-- chrome registers first -->
  <XAxis data-key="month" />
  <YAxis :tick-count="4" />
  <Area data-key="revenue" variant="gradient">
    <Dot variant="border" :r="2" />         <!-- series children nest -->
  </Area>
  <Legend align="right" />                  <!-- reads the same context -->
  <Tooltip label-key="month" />
</AreaChart>`,
  accessibility: `<!-- one accessible node per chart, not 400 rects -->
<svg role="img" aria-label="Chart">…</svg>   <!-- provided by the root -->
<canvas aria-hidden="true" />                <!-- pixels stay silent -->

/* honored automatically — no opt-in props */
@media (prefers-reduced-motion: reduce)      { /* entrances snap  */ }
@media (prefers-reduced-transparency: reduce) { /* chrome goes solid */ }`,
  dashboard: `<!-- stat cards -->
<div v-for="s in stats" class="rounded-lg border p-4">
  <span>{{ s.label }}</span> <b>{{ s.value }}</b>
  <Sparkline :data="s.trend" :color="s.color" class="h-8" />
</div>

<!-- main panel -->
<AreaChart :data="rows" :config="config" stack-type="stacked">
  <XAxis data-key="month" /> <Area data-key="expenses" variant="dotted" />
  <Area data-key="revenue" /> <Tooltip label-key="month" />
</AreaChart>
<PieChart :data="share" :config="shareConfig" data-key="value"
  name-key="name" :inner-radius="0.55"><Pie /></PieChart>`,
  shell: `<div class="grid grid-cols-[160px_1fr] rounded-lg border">
  <aside class="border-r p-3">          <!-- sidebar -->
    brand, nav (active chip), <DitherAvatar /> footer
  </aside>
  <div>
    <header class="border-b px-4">      <!-- topbar -->
      title and <DitherButton>Export</DitherButton>
    </header>
    <main class="grid gap-4 p-4">
      stat cards with <Sparkline />
      <AreaChart … />                    <!-- main panel -->
    </main>
  </div>
</div>`,
  monitoring: `<LineChart :data="rows" :config="config">  <!-- pulse -->
  <Grid horizontal /> <XAxis data-key="month" />
  <Line data-key="revenue" /> <Line data-key="expenses" />
</LineChart>

<RadarChart … />                        <!-- sprint health -->

<div v-for="s in services">             <!-- status rows -->
  <span class="size-1.5 rounded-full" :style="{ backgroundColor: cssColor(s.ok ? 'green' : 'red') }" />
  {{ s.name }} <Sparkline :data="s.data" :color="s.color" />
  {{ s.uptime }}
</div>`,
  team: `<div v-for="m in team" class="flex items-center gap-4">
  <DitherAvatar :name="m.name" :size="32" />
  <span>{{ m.name }}</span> <span>{{ m.role }}</span>
  <Sparkline :data="m.data" :color="m.color" class="h-5 flex-1" />
  <span class="tabular-nums">{{ m.commits }}</span>
</div>`,
  usage: `<BarChart :data="usageRows" :config="usageConfig">   <!-- renders/mo -->
  <XAxis data-key="month" /> <Bar data-key="renders" />
</BarChart>

<PieChart :data="quotaRows" :config="quotaConfig"    <!-- quota donut -->
  data-key="value" name-key="name" :inner-radius="0.62">
  <Pie /> <Legend align="center" />
</PieChart>

<DitherButton color="blue">Upgrade to Pro</DitherButton>`,
  signin: `<div class="relative overflow-hidden rounded-lg border p-8">
  <DitherGradient from="blue" direction="up" :opacity="0.2" />
  <span>dither-ui</span>                    <!-- wordmark -->
  <input placeholder="you@dither-ui.com" />
  <input type="password" placeholder="••••••••" />
  <DitherButton color="blue" class="w-full">Sign in</DitherButton>
</div>`,
  area: `const rows = [{ month: "Jan", revenue: 42, expenses: 31 }, …]
const config = {
  revenue:  { label: "Revenue",  color: "blue" },
  expenses: { label: "Expenses", color: "purple" },
}

<AreaChart class="h-64" :data="rows" :config="config" stack-type="stacked">
  <Grid horizontal />
  <XAxis data-key="month" :max-ticks="6" />
  <YAxis :tick-count="4" />
  <Area data-key="expenses" variant="dotted" />
  <Area data-key="revenue" variant="gradient" />
  <Legend align="right" />
  <Tooltip label-key="month" />
</AreaChart>`,
  line: `<LineChart class="h-64" :data="rows" :config="config">
  <Grid horizontal />
  <XAxis data-key="month" :max-ticks="6" />
  <Line data-key="revenue">
    <Dot variant="border" :r="2" />
  </Line>
  <Line data-key="expenses" />
  <Legend align="right" />
  <Tooltip label-key="month" />
</LineChart>`,
  bar: `<BarChart class="h-64" :data="trafficRows" :config="trafficConfig">
  <Grid horizontal />
  <XAxis data-key="month" />
  <YAxis :tick-count="4" />
  <Bar data-key="organic" />
  <Bar data-key="paid" />
  <Legend align="right" />
  <Tooltip label-key="month" />
</BarChart>`,
  pie: `<PieChart class="h-64" :data="pieRows" :config="pieConfig"
  data-key="value" name-key="name" :inner-radius="0.55">
  <Pie variant="gradient" is-clickable />
  <Legend align="center" />
</PieChart>`,
  radar: `<RadarChart class="h-72" :data="radarRows" :config="radarConfig" name-key="axis">
  <Radar data-key="current" />
  <Radar data-key="previous" />
  <Legend align="center" />
</RadarChart>`,
  sparkline: `const hour = ref<number | null>(null)
// The last 24 hours of revenue, in $k.
const last24h = Array.from({ length: 24 }, (_, i) =>
  Number((2.4 * (10 + i * 0.35 + Math.sin(i * 0.8 + 1) * 2 + Math.sin(i * 1.7 + 2) * 1.1)).toFixed(1)),
)

<div class="rounded-lg border p-4">
  <div class="text-xs text-muted-foreground">Revenue</div>
  <div class="flex items-baseline gap-2">
    <span class="text-lg tabular-nums">$<DitherNumberFlow :value="last24h[hour ?? 23]" :decimals="1" />k</span>
    <span class="text-xs text-muted-foreground">{{ hour === null ? "+48.3%" : \`\${23 - hour}h ago\` }}</span>
  </div>
  <Sparkline :data="last24h" color="green" interactive label="Revenue" :hover-lift="false"
    class="mt-3 h-8 w-full" @hover-change="(i) => (hour = i)" />
</div>`,
  motion: `const replayToken = ref(0)

<BarChart :data="rows" :config="config"
  :animation-duration="900" :replay-token="replayToken">
  <Bar data-key="revenue" />
</BarChart>

<DitherButton @click="replayToken++">Replay</DitherButton>
<!-- prefers-reduced-motion is respected automatically:
     entrances snap, sparkles hold still -->`,
  button: `<!-- variants -->
<DitherButton variant="gradient">Deploy</DitherButton>
<DitherButton variant="solid">Run</DitherButton>
<DitherButton variant="dotted">Preview</DitherButton>
<DitherButton variant="hatched">Cancel</DitherButton>

<!-- colors, bloom, static raster -->
<DitherButton color="green" bloom="low">Approve</DitherButton>
<DitherButton color="red" disabled>Delete</DitherButton>
<DitherButton render-mode="static" precompiled="/button.png">Saved</DitherButton>`,
  avatar: `<DitherAvatar name="ada" :size="24" />
<DitherAvatar name="ada" :size="32" />
<DitherAvatar name="ada" :size="48" />
<DitherAvatar name="grace" :size="48" bloom="low" />`,
  gradient: `<div class="relative h-40">
  <DitherGradient from="blue" to="transparent" direction="up" />
</div>
<div class="relative h-24">
  <DitherGradient render-mode="static" precompiled="/gradient.png" />
</div>
<!-- from/to: any DitherColor; direction: up, down, left or right
     cell: px per dither cell; opacity: 0…1
     max-cols / max-rows: backing-resolution caps (default 960×600 live, 320×200 static) -->`,
  image: `<DitherImage src="/sprites.webp" :cell="3" :focus-y="0.62" :fade="72"
  alt="The dither-ui sprite sheet, re-dithered" class="h-64 w-full" />
<DitherImage precompiled="/sprites-dither.png" alt="The dither-ui sprite sheet" />
<!-- cell: px per dither cell; fade: dithered edge dissolve
     focus-y: cover-crop focus (0 top … 1 bottom) -->`,
  palette: `import { cssColor, type DitherColor } from "@dither-kit"
cssColor("blue") // rgb(53,143,243)`,
}
/** The docs' dark ground (`:root.dark[data-page="docs"]` in the site's
 * stylesheet): the browser chrome's colour until the page has painted and
 * `useTheme` reads the ground as computed. */
export const DOCS_GROUND = "#101214"

const commandItems = GROUPS.flatMap((g) => g.items.map((it) => ({ value: it.id, label: it.label, group: g.title })))

const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth")

export type DocsPageProps = {
  /** The section this page shows (its route's), or "" for the docs' front,
   * which opens on the first section. */
  section: string
}

// One section per page: the URL names the section (`/docs/<id>`), the page
// shows that section alone, and the sidebar, search, the sheet and the
// pager open another as a new history entry (back and forward walk them).
// `/docs` itself opens on the first section. The address is the router's:
// each section is a route, and moving between them stays on this page.
export default function DocsPage(props: DocsPageProps) {
  const navigate = useNavigate()

  // The Sparkline section scrubs: the hour under the pointer, per card.
  const [scrubbed, setScrubbed] = createStore<Record<string, number | null>>({})

  // Variant galleries drive the main preview: picking one swaps the prop and
  // bumps the chart's replay token, so the kit's own dither entrance IS the
  // transition — no CSS theatre required.
  const [picked, setPicked] = createStore({
    area: "gradient" as AreaVariant | number,
    bar: "gradient" as AreaVariant,
    pie: "gradient" as AreaVariant,
    dot: "border" as DotVariant,
  })
  const [galleryReplay, setGalleryReplay] = createStore({ area: 0, bar: 0, pie: 0, line: 0 })

  function pick(section: "area" | "bar" | "pie", v: AreaVariant | number) {
    setPicked(section, v as never)
    setGalleryReplay(section, (n) => n + 1)
  }

  const randomSeed = () => pick("area", Math.floor(Math.random() * 1_000_000))

  // Master-seed playground: one integer drives texture, motion, easing, bloom.
  const [masterSeed, setMasterSeed] = createSignal(1984)
  const [masterReplay, setMasterReplay] = createSignal(0)
  function rollMaster() {
    setMasterSeed(Math.floor(Math.random() * 1_000_000))
    setMasterReplay((n) => n + 1)
  }
  function pickDot(v: DotVariant) {
    setPicked("dot", v)
    setGalleryReplay("line", (n) => n + 1)
  }

  // Button playground — one preview, three pickers.
  const [btn, setBtn] = createStore({
    variant: "gradient" as ButtonVariant,
    color: "blue" as DitherColor,
    bloom: "off" as PixelBloom,
  })

  // Avatar playground — picking a name replays the pixel entrance at all sizes.
  const [avatarName, setAvatarName] = createSignal("ada")
  const [avatarReplay, setAvatarReplay] = createSignal(0)
  function pickAvatar(n: string) {
    setAvatarName(n)
    setAvatarReplay((r) => r + 1)
  }

  // Gradient playground.
  const [grad, setGrad] = createStore({ direction: "up" as GradientDirection, from: "blue" as DitherColor })

  // App shell example.
  const [shellNav, setShellNav] = createSignal("Overview")

  const activeId = () => props.section
  const shown = createMemo(() => activeId() || SECTION_IDS[0] || "")

  /* Per-section search metadata follows the section in view: title,
     canonical, description and breadcrumb structured data, rendered with
     the page on the server and kept in step as the section changes.
     `docsMeta("")` falls back to the generic /docs metadata. */
  const meta = createMemo(() => docsMeta(activeId()))

  /* On this page (xl and up, the rail right of the content): the parts of the
     section on this page, read from its DOM as it opens: its heading,
     each gallery heading and its props table. Headings inside a preview are
     the demo's, not the section's. */
  /** The docs' flow: every section a direct child of it. */
  let flow: HTMLDivElement | undefined
  /* Counts the sections arriving in the flow: a pack is a chunk of its own
     (`pack-loaders.ts`) and renders its sections after the page has, so
     whatever reads the flow's sections reads them again as they come (the
     hiding once missed them, and a family's every section showed at once). */
  const [arrived, setArrived] = createSignal(0)
  onMount(() => {
    if (!flow || typeof MutationObserver === "undefined") return
    const arrivals = new MutationObserver(() => setArrived((n) => n + 1))
    arrivals.observe(flow, { childList: true })
    onCleanup(() => arrivals.disconnect())
  })
  const [onPage, setOnPage] = createSignal<PagePart[]>([])
  /* Read once the flow has mounted too: a page opened straight on a section
     never changes `shown`, and the rail stood empty. */
  createEffect(
    on([shown, arrived], ([id]) => {
      const section = id ? document.getElementById(id) : null
      setOnPage(
        section
          ? [...section.querySelectorAll<HTMLElement>("h2, h3, table")]
              .filter((el) => !el.closest("[data-demo-card]"))
              .map((el) =>
                el.tagName === "TABLE" ? { label: "API", el } : { label: el.textContent?.trim() ?? "", el },
              )
          : [],
      )
    }),
  )
  function goTo(el: HTMLElement) {
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 88, behavior: smooth() })
  }

  /** Open a section: its page, a new history entry, read from the top. */
  function open(id: string) {
    if (!SECTION_IDS.includes(id)) return
    if (id !== activeId()) navigate(docsUrl(id), { resolve: false, scroll: false })
    else window.scrollTo({ top: 0, behavior: "auto" })
  }
  // Each section reads from its top, however it was reached (a link, the
  // search, back and forward).
  createEffect(on(activeId, () => window.scrollTo({ top: 0, behavior: "auto" }), { defer: true }))

  /* Only the section on this page shows. A pack of sections mounts once one
     of them has been opened here (`packs.ts`), then stays, hidden while
     another shows, while it is among the last `PACKS_KEPT` read, so going
     back is instant and keeps each demo's state, and a long read never holds
     the whole docs. The sections DocsPage writes itself stay mounted, hidden. */
  const kept = createMemo<readonly PackName[]>((before) => visitPack(before, shown()), [])
  // The sections DocsPage writes itself render their contents the same way:
  // the open one and the last read before it, never all of them hidden (they
  // held 3,000 of a section page's 4,200 nodes and all its 49 canvases).
  const keptOwn = createMemo<readonly string[]>((before) => {
    const id = shown()
    return !id || packOf(id) ? before : [...before.filter((k) => k !== id), id].slice(-PACKS_KEPT)
  }, [])
  const mounted = (name: PackName) => packOpen(name, kept())
  const opened = (id: string) => keptOwn().includes(id)
  createEffect(
    on([shown, arrived], ([id]) => {
      for (const s of flow?.querySelectorAll<HTMLElement>(":scope > section") ?? []) s.hidden = s.id !== id
    }),
  )

  const near = createMemo(() => neighbours(shown()))
  const crumbGroup = createMemo(() => groupOf(shown()))

  /* Docs search: the kit's own Command palette navigating the whole IA. */
  const [searchOpen, setSearchOpen] = createSignal(false)
  /* The sections sheet (under lg): the header's sections key opens it from
     anywhere on the page. A pick closes it first, so the page is free to scroll. */
  const [sheetOpen, setSheetOpen] = createSignal(false)
  function fromSheet(go: () => void) {
    setSheetOpen(false)
    queueMicrotask(go)
  }
  function searchHotkey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault()
      setSearchOpen(!searchOpen())
    }
  }
  function searchGo(id: string) {
    open(id)
  }

  /* Theme: dark by default, remembered, revealed as a circle from the toggle. */
  const { dark, ground, revealToggle } = useTheme()
  function flipTheme(e: MouseEvent) {
    play("theme")
    revealToggle(e)
  }
  /* Interface sounds (Kobra's): taps, switches, copies — the reader's switch. */
  function flipSounds() {
    setSounds(!sounds())
    if (sounds()) play("on")
  }
  /* A header toggle taps only when it changes something. */
  function choose(apply: () => void, already: boolean) {
    if (!already) play("tap")
    apply()
  }
  /* The search hint names the modifier the visitor actually has (read in
     the browser: a server knows no keyboard). */
  const [searchKbd, setSearchKbd] = createSignal(modKey("K", false))

  onMount(() => {
    setSearchKbd(modKey("K"))
    // the reader's own switches, read once in a browser
    restoreSounds()
    restoreStyling()
    window.addEventListener("keydown", searchHotkey)
    // A legacy link (`#/docs/<id>` on the docs' own address) lands on its
    // section's page, in place of the entry it came by.
    const legacy = () => {
      const id = activeId() ? "" : sectionOf("", location.hash)
      if (id) navigate(docsUrl(id), { resolve: false, replace: true, scroll: false })
    }
    legacy()
    window.addEventListener("hashchange", legacy)
    // The page opens on the section its URL names; each section reads from
    // its top, so the browser's own scroll restoration stays out of it.
    const restoration = history.scrollRestoration
    history.scrollRestoration = "manual"
    onCleanup(() => {
      window.removeEventListener("keydown", searchHotkey)
      window.removeEventListener("hashchange", legacy)
      history.scrollRestoration = restoration
    })
  })

  // Motion demo — replay re-runs the entrance, duration is chosen live.
  const [replayToken, setReplayToken] = createSignal(0)
  const [motionDuration, setMotionDuration] = createSignal(900)

  // Generative live-edge motion — a dedicated effect seed samples an infinite
  // space of behaviors; roll for a fresh one.
  const [effectSeed, setEffectSeed] = createSignal(7)
  const rollEffect = () => setEffectSeed(Math.floor(Math.random() * 1_000_000))

  // Handbook code blocks follow the styling switch like DemoCard tabs do.
  const fw = docsCode

  // Code tabs mirror the picked variant — what you see is what you copy.
  const areaCode = createMemo(() =>
    SNIPPETS.area.replace(
      'data-key="revenue" variant="gradient"',
      typeof picked.area === "number"
        ? `data-key="revenue" :variant="${picked.area}"  <!-- a seed: deterministic -->`
        : `data-key="revenue" variant="${picked.area}"`,
    ),
  )
  const lineCode = createMemo(() => SNIPPETS.line.replace('variant="border"', `variant="${picked.dot}"`))
  const barCode = createMemo(() =>
    SNIPPETS.bar
      .replace('<Bar data-key="organic" />', `<Bar data-key="organic" variant="${picked.bar}" />`)
      .replace('<Bar data-key="paid" />', `<Bar data-key="paid" variant="${picked.bar}" />`),
  )
  const pieCode = createMemo(() => SNIPPETS.pie.replace('variant="gradient"', `variant="${picked.pie}"`))
  const buttonCode = createMemo(
    () =>
      `<DitherButton color="${btn.color}" variant="${btn.variant}"${btn.bloom === "off" ? "" : ` bloom="${btn.bloom}"`}>
  Deploy
</DitherButton>
<DitherButton render-mode="static" precompiled="/button.png">Saved</DitherButton>`,
  )
  const avatarCode = createMemo(
    () => `<DitherAvatar name="${avatarName()}" :size="48" />
<!-- same name, same face, at any size -->`,
  )
  const gradientCode = createMemo(
    () => `<div class="relative h-40">
  <DitherGradient from="${grad.from}" to="transparent" direction="${grad.direction}" />
</div>
<div class="relative h-24">
  <DitherGradient render-mode="static" precompiled="/gradient.png" />
</div>`,
  )

  /** A section this page writes itself: its element stays, its contents
   * render only while it is open or among the last read. */
  const Own = (p: { id: string; children: JSX.Element }) => (
    <section id={p.id} class="mt-16 scroll-mt-24">
      <Show when={opened(p.id)}>{p.children}</Show>
    </section>
  )
  /** A pack of sections, mounted once one of them has been opened here. */
  const Pack = (p: { name: PackName }) => (
    <Show when={mounted(p.name)}>
      <Dynamic component={PACK_COMPONENTS[p.name]} />
    </Show>
  )
  /** A section's title beside its "Open in the Studio" link. */
  const StudioHead = (p: { title: string; type: string }) => (
    <div class="flex items-baseline justify-between gap-4">
      <h2 class="text-lg tracking-tight">{p.title}</h2>
      <a
        href={`${routePath("/studio")}#new/${p.type}`}
        class="-m-2 shrink-0 p-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        aria-label={`Open a new ${p.type} chart in the studio`}
      >
        Open in the Studio
      </a>
    </div>
  )
  /** A link that opens a section here, its address the section's own. */
  const to = (id: string) => (e: MouseEvent) => {
    e.preventDefault()
    open(id)
  }
  /** The seed the random tile rolled: a number picked that is not one of
   * the gallery's own. */
  const rolled = () => (typeof picked.area === "number" && !SEEDS.includes(picked.area) ? picked.area : null)

  return (
    <div class="docs-root min-h-dvh bg-background font-mono text-foreground antialiased">
      <PageHead page="docs" section={meta().id} />
      {/* the page's ground, in the theme the reader picked */}
      <Meta name="theme-color" content={ground() ?? DOCS_GROUND} />

      {/* The site's header, the landing's own: the docs add search and,
          under lg, the key that opens the sections sheet. */}
      <SiteHeader
        current="docs"
        tools={
          <>
            <button
              type="button"
              class="nav-a gap-1.5 text-muted-foreground"
              aria-label="Search docs"
              onClick={() => setSearchOpen(true)}
            >
              <DitherIcon name="Search" size={12} strokeWidth={1.5} />
              <span class="max-sm:sr-only">Search</span>
              <kbd class="hidden rounded border border-border/60 px-1 text-[10px] md:inline">{searchKbd()}</kbd>
            </button>
            <button
              type="button"
              class="flex size-8 items-center justify-center transition-colors hover:text-foreground lg:hidden"
              aria-label="Browse sections"
              aria-haspopup="dialog"
              aria-expanded={sheetOpen()}
              aria-controls={SHEET_ID}
              onClick={() => setSheetOpen(true)}
            >
              <DitherIcon name="Book" size={15} strokeWidth={1.5} />
            </button>
          </>
        }
      />

      <div class="mx-auto flex w-full max-w-6xl px-4 sm:px-6">
        {/* Sidebar */}
        <aside class="sticky top-16 hidden h-[calc(100dvh-4rem)] w-52 shrink-0 overflow-y-auto pr-8 pb-10 lg:block">
          <nav aria-label="Docs sections">
            <DocsNav activeId={shown()} variant="rail" onGo={open} />
          </nav>
          <AdSlot />
        </aside>

        {/* Content */}
        <main class="min-w-0 flex-1 pb-24 lg:pl-10">
          {/* The page's row: where the reader is (the docs, then the
              section's group), and the switches that act on the whole page,
              what its code is written in, its sounds and its theme. */}
          <div class="mt-10 flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <Show when={crumbGroup()}>
              {(group) => (
                <nav aria-label="Breadcrumb" class="text-[11px] text-muted-foreground">
                  <ol class="flex flex-wrap items-center gap-1.5">
                    <li>
                      <a
                        href={docsUrl(SECTION_IDS[0] ?? "")}
                        class="-my-1 py-1 transition-colors hover:text-foreground"
                        onClick={to(SECTION_IDS[0] ?? "")}
                      >
                        Docs
                      </a>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li>
                      <a
                        href={docsUrl(group().items[0]?.id ?? "")}
                        class="-my-1 py-1 transition-colors hover:text-foreground"
                        aria-current={group().items[0]?.id === shown() ? "page" : undefined}
                        onClick={(e) => to(group().items[0]?.id ?? "")(e)}
                      >
                        {group().title}
                      </a>
                    </li>
                  </ol>
                </nav>
              )}
            </Show>
            <div class="flex flex-wrap items-center gap-2 text-muted-foreground">
              <div class="track max-lg:hidden" role="group" aria-label="Styling">
                <For each={STYLINGS}>
                  {(s) => (
                    <button
                      type="button"
                      aria-pressed={styling() === s}
                      class={`h-6 px-2.5 text-[11px] transition-colors ${styling() === s ? "ring-on" : "hover:text-foreground"}`}
                      onClick={() => choose(() => setStyling(s), styling() === s)}
                    >
                      {STYLING_LABELS[s]}
                    </button>
                  )}
                </For>
              </div>
              <button
                type="button"
                class="flex size-8 items-center justify-center transition-colors hover:text-foreground"
                aria-label="Interface sounds"
                aria-pressed={sounds()}
                title={`Interface sounds: ${sounds() ? "on" : "off"}`}
                onClick={flipSounds}
              >
                <DitherIcon name={sounds() ? "Volume" : "VolumeOff"} size={15} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                class="flex size-8 items-center justify-center transition-colors hover:text-foreground"
                aria-label={dark() ? "Use light theme" : "Use dark theme"}
                onClick={flipTheme}
              >
                <DitherIcon name={dark() ? "Sun" : "Moon"} size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <div ref={(el) => (flow = el)} class="docs-flow max-w-2xl">
            {/* Only the section on this page shows: this rule holds the rest
                of a pack back in the server's bytes and until the page has
                marked them `hidden`. */}
            <style>{`.docs-flow > section:not([id="${shown()}"]) { display: none }`}</style>
            {/* The title in chrome; on its baseline, the kit's spec as speed
                tags (beside the title, never an eyebrow over it). */}
            <div
              data-docs-front
              class={`flex flex-wrap items-end justify-between gap-x-6 gap-y-3 ${activeId() ? "sr-only" : "mt-6"}`}
            >
              <h1 class="font-display text-[1.6rem] leading-tight font-normal">Documentation</h1>
              <ul class="flex flex-wrap gap-1 pb-1" aria-label="The kit">
                <li class="speed-tag">{GROUPS.flatMap((g) => g.items).length} sections</li>
                <li class="speed-tag">Solid</li>
                <li class="speed-tag">Tailwind or StyleX</li>
              </ul>
            </div>
            <Show when={!activeId()}>
              <p data-docs-front class="mt-3 text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
                Every component draws on canvas through the same ordered-dither engine. Compose charts from parts, or
                drop in a single primitive.
              </p>
            </Show>

            {/* Quick start: the install, one step at a time */}
            <QuickStart />

            {/* Primitives: box, text, divider, visually-hidden */}
            <Pack name="PrimitivesDocs" />

            {/* Typography: heading, label, captions, links, truncation */}
            <Pack name="TypographyDocs" />

            {/* Styling */}
            <Own id="styling">
              <h2 class="text-lg tracking-tight">Styling</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Pixels come from the palette seeds; chrome (axes, legend, tooltip, borders) reads shadcn-style CSS
                tokens. Override the tokens to theme, pass <code class="text-foreground/80">class</code> to compose with
                your own utilities.
              </p>
              <div class="mt-5">
                <CodeBlock code={fw(SNIPPETS.styling)} />
              </div>
            </Own>

            {/* Seeds */}
            <Own id="seeds">
              <h2 class="text-lg tracking-tight">Seeds</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Everything visual in the kit resolves from deterministic seeds: avatars from names, colors from hues,
                textures, bloom, easing and motion from integers. Give a chart a{" "}
                <code class="text-foreground/80">seed</code> and it derives a whole personality for every prop you left
                unset; the same seed reproduces it forever. Explicit props always win.
              </p>
              <DemoCard code={SNIPPETS.seeds}>
                <div class="grid gap-5">
                  <div class="h-52">
                    {/* a new seed is a new chart */}
                    <For each={[masterSeed()]}>
                      {(seed) => (
                        <AreaChart
                          data={rows}
                          config={config}
                          seed={seed}
                          interactive={false}
                          replayToken={masterReplay()}
                        >
                          <XAxis dataKey="month" maxTicks={6} />
                          <Area dataKey="expenses" variant={seed + 1} />
                          <Area dataKey="revenue" variant={seed} />
                        </AreaChart>
                      )}
                    </For>
                  </div>
                  <div class="flex flex-wrap items-center justify-center gap-3">
                    <DitherButton color="blue" variant="gradient" onClick={rollMaster}>
                      Roll a personality
                    </DitherButton>
                    <span class="font-mono text-[11px] text-muted-foreground tabular-nums">seed: {masterSeed()}</span>
                    <DitherButton color="purple" variant="dotted" bloom={masterSeed()}>
                      seeded bloom
                    </DitherButton>
                  </div>
                </div>
              </DemoCard>
            </Own>

            {/* Engine: the parts under every surface, a figure each */}
            <EngineSection />

            {/* Verification: the kit's claims measured in the reader's browser */}
            <VerificationSection />

            {/* Composition */}
            <Own id="composition">
              <h2 class="text-lg tracking-tight">Composition</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                A chart is a root plus parts. The root measures, builds scales and provides context; children register
                themselves: grid and axes as chrome, <code class="text-foreground/80">Area</code>/
                <code class="text-foreground/80">Line</code>/<code class="text-foreground/80">Bar</code> as series,{" "}
                <code class="text-foreground/80">Dot</code> nested inside a series. Order in the markup is paint order.
              </p>
              <div class="mt-5">
                <CodeBlock code={fw(SNIPPETS.composition)} />
              </div>
            </Own>

            {/* Accessibility */}
            <Own id="accessibility">
              <h2 class="text-lg tracking-tight">Accessibility</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Canvases are decoration and stay <code class="text-foreground/80">aria-hidden</code>; each chart exposes
                a single labelled node instead of hundreds of shapes. Legends are real buttons. Reduced motion snaps
                entrances and stills the sparkles; reduced transparency solidifies floating chrome. Both follow the OS
                setting, no props required.
              </p>
              <div class="mt-5">
                <CodeBlock code={fw(SNIPPETS.accessibility)} />
              </div>
            </Own>

            {/* Motion */}
            <Own id="motion">
              <h2 class="text-lg tracking-tight">Motion</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Entrances draw the dither field in; bump <code class="text-foreground/80">replayToken</code> to run one
                again. When the OS asks for reduced motion, entrances snap and sparkles hold still. No opt-in needed.
              </p>
              <DemoCard code={SNIPPETS.motion}>
                <div class="grid gap-5">
                  <div class="h-48">
                    <BarChart
                      data={trafficRows}
                      config={trafficConfig}
                      interactive={false}
                      animationDuration={motionDuration()}
                      replayToken={replayToken()}
                    >
                      <XAxis dataKey="month" />
                      <Bar dataKey="organic" />
                      <Bar dataKey="paid" />
                    </BarChart>
                  </div>
                  <div class="flex flex-wrap items-center justify-center gap-3">
                    <DitherButton color="blue" variant="gradient" onClick={() => setReplayToken((n) => n + 1)}>
                      Replay
                    </DitherButton>
                    <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
                      <For each={DURATIONS}>
                        {(d) => (
                          <button
                            type="button"
                            class={`rounded px-2.5 py-1 text-[11px] tabular-nums transition-colors ${
                              motionDuration() === d
                                ? "bg-card text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => {
                              setMotionDuration(d)
                              setReplayToken((n) => n + 1)
                            }}
                          >
                            {d}ms
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </DemoCard>
              <h3 class="mt-8 text-[12px] text-muted-foreground">Live-edge motion</h3>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                The live edge isn't a preset. It's a point in a continuous space of motion (drift, gravity, twinkle,
                trail, flow) AND particle shape (a generated glyph: dot, plus, x, streak, asterisk). A dedicated{" "}
                <code class="text-foreground/80">effect</code> seed samples one of infinitely many; roll for a fresh
                one.
              </p>
              <div class="mt-4 rounded-lg border border-border/60 p-4">
                <div class="h-44">
                  {/* a new seed is a new chart */}
                  <For each={[effectSeed()]}>
                    {(seed) => (
                      <LineChart data={effectData} config={effectConfig} effect={seed} interactive={false}>
                        <Line dataKey="v" />
                      </LineChart>
                    )}
                  </For>
                </div>
                <div class="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <DitherButton color="blue" variant="gradient" onClick={rollEffect}>
                    Roll a motion
                  </DitherButton>
                  <span class="font-mono text-[11px] text-muted-foreground tabular-nums">effect: {effectSeed()}</span>
                </div>
              </div>
              <PropsTable rows={API.motion} />
            </Own>

            {/* Dashboard */}
            <Own id="dashboard">
              <h2 class="text-lg tracking-tight">Dashboard example</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Everything composed: stat cards, a stacked area and a donut. One palette, one texture, zero SVG.
              </p>
              <DemoCard code={SNIPPETS.dashboard}>
                <div class="grid gap-4">
                  <div class="grid gap-4 sm:grid-cols-3">
                    <For each={STATS}>
                      {(s) => (
                        <div class="rounded-lg border border-border/60 p-4">
                          <div class="text-[11px] text-muted-foreground">{s.label}</div>
                          <div class="mt-1 flex items-baseline gap-2">
                            <span class="text-lg tracking-tight tabular-nums">{s.value}</span>
                            <span class="text-[11px] tabular-nums" style={{ color: cssColor(s.up ? "green" : "red") }}>
                              {s.delta}
                            </span>
                          </div>
                          <Sparkline data={s.data} color={s.color} class="mt-3 h-8 w-full" />
                        </div>
                      )}
                    </For>
                  </div>
                  <div class="grid gap-4 lg:grid-cols-3">
                    <div class="rounded-lg border border-border/60 p-4 lg:col-span-2">
                      <div class="text-[11px] text-muted-foreground">Revenue vs expenses</div>
                      <div class="mt-3 h-44">
                        <AreaChart data={rows} config={config} stackType="stacked">
                          <XAxis dataKey="month" maxTicks={6} />
                          <Area dataKey="expenses" variant="dotted" />
                          <Area dataKey="revenue" variant="gradient" />
                          <Tooltip labelKey="month" />
                        </AreaChart>
                      </div>
                    </div>
                    <div class="rounded-lg border border-border/60 p-4">
                      <div class="text-[11px] text-muted-foreground">Browser share</div>
                      <div class="mt-3 h-44">
                        <PieChart data={pieRows} config={pieConfig} dataKey="value" nameKey="name" innerRadius={0.55}>
                          <Pie variant="gradient" />
                        </PieChart>
                      </div>
                    </div>
                  </div>
                </div>
              </DemoCard>
            </Own>

            {/* App shell */}
            <Own id="shell">
              <h2 class="text-lg tracking-tight">App shell</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Sidebar, topbar and content: a whole product frame from tokens and kit primitives. The nav works; click
                around.
              </p>
              <DemoCard code={SNIPPETS.shell}>
                <div class="grid grid-cols-[150px_1fr] overflow-hidden rounded-lg border border-border/60 text-left sm:grid-cols-[170px_1fr]">
                  {/* Sidebar */}
                  <aside class="flex min-h-[360px] flex-col border-r border-border/60 bg-background/40 p-3">
                    <div class="flex items-center gap-2 px-2 py-1.5">
                      <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
                      <span class="text-[12px] tracking-tight">dither-ui</span>
                    </div>
                    <nav class="mt-4 grid gap-0.5">
                      <For each={SHELL_NAV}>
                        {(item) => (
                          <button
                            type="button"
                            aria-pressed={shellNav() === item}
                            class={`rounded-md px-2 py-1.5 text-left text-[11px] transition-colors ${
                              shellNav() === item
                                ? "bg-card text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => setShellNav(item)}
                          >
                            {item}
                          </button>
                        )}
                      </For>
                    </nav>
                    <div class="mt-auto flex items-center gap-2 px-2 pt-3">
                      <DitherAvatar name="ada" size={24} animate={false} />
                      <div class="min-w-0">
                        <div class="truncate text-[11px] text-foreground/90">ada</div>
                        <div class="text-[10px] text-muted-foreground">admin</div>
                      </div>
                    </div>
                  </aside>
                  {/* Main */}
                  <div class="flex min-w-0 flex-col">
                    <header class="flex h-10 shrink-0 items-center justify-between border-b border-border/60 px-4">
                      <span class="text-[12px]">{shellNav()}</span>
                      <DitherButton color="blue" variant="gradient" class="px-2.5 py-1 text-[10px]">
                        Export
                      </DitherButton>
                    </header>
                    <main class="grid flex-1 content-start gap-3 p-4">
                      <div class="grid grid-cols-3 gap-3">
                        <For each={STATS}>
                          {(s) => (
                            <div class="rounded-md border border-border/60 p-2.5">
                              <div class="truncate text-[10px] text-muted-foreground">{s.label}</div>
                              <div class="text-[13px] tracking-tight tabular-nums">{s.value}</div>
                              <Sparkline data={s.data} color={s.color} class="mt-1.5 h-5 w-full" />
                            </div>
                          )}
                        </For>
                      </div>
                      <div class="rounded-md border border-border/60 p-3">
                        <div class="text-[10px] text-muted-foreground">Revenue vs expenses</div>
                        <div class="mt-2 h-36">
                          <AreaChart data={rows} config={config} stackType="stacked" interactive={false}>
                            <Area dataKey="expenses" variant="dotted" />
                            <Area dataKey="revenue" variant="gradient" />
                          </AreaChart>
                        </div>
                      </div>
                    </main>
                  </div>
                </div>
              </DemoCard>
            </Own>

            {/* Monitoring */}
            <Own id="monitoring">
              <h2 class="text-lg tracking-tight">Monitoring</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                An ops board: system pulse, sprint health and per-service status rows. The grey seed marks what is
                quiet, red what is not.
              </p>
              <DemoCard code={SNIPPETS.monitoring}>
                <div class="grid gap-4 lg:grid-cols-5">
                  <div class="rounded-lg border border-border/60 p-4 lg:col-span-3">
                    <div class="text-[11px] text-muted-foreground">System pulse</div>
                    <div class="mt-3 h-44">
                      <LineChart data={rows} config={config} interactive={false}>
                        <Grid horizontal />
                        <XAxis dataKey="month" maxTicks={6} />
                        <Line dataKey="revenue" />
                        <Line dataKey="expenses" />
                      </LineChart>
                    </div>
                  </div>
                  <div class="rounded-lg border border-border/60 p-4 lg:col-span-2">
                    <div class="text-[11px] text-muted-foreground">Sprint health</div>
                    <div class="mt-3 h-44">
                      <RadarChart data={radarRows} config={radarConfig} nameKey="axis">
                        <Radar dataKey="current" />
                        <Radar dataKey="previous" />
                      </RadarChart>
                    </div>
                  </div>
                  <div class="rounded-lg border border-border/60 lg:col-span-5">
                    <For each={SERVICES}>
                      {(s, i) => (
                        <div
                          class={`flex items-center gap-4 px-4 py-2.5 ${i() > 0 ? "border-t border-border/40" : ""}`}
                        >
                          <span
                            class="size-1.5 shrink-0 rounded-full"
                            style={{ "background-color": cssColor(s.ok ? "green" : "red") }}
                          />
                          <span class="w-28 truncate text-[11px] text-foreground/90 sm:w-36">{s.name}</span>
                          <Sparkline data={s.data} color={s.color} class="h-5 min-w-0 flex-1" />
                          <span
                            class={`w-14 text-right text-[11px] tabular-nums ${s.ok ? "text-muted-foreground" : "text-foreground"}`}
                            style={s.ok ? {} : { color: cssColor("red") }}
                          >
                            {s.uptime}
                          </span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </DemoCard>
            </Own>

            {/* Team */}
            <Own id="team">
              <h2 class="text-lg tracking-tight">Team</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                A contributors panel: deterministic avatars, a commit pulse per person, one palette seed each.
              </p>
              <DemoCard code={SNIPPETS.team}>
                <div class="mx-auto max-w-md rounded-lg border border-border/60">
                  <div class="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
                    <span class="text-[11px] text-muted-foreground">dither-ui contributors</span>
                    <span class="text-[11px] tabular-nums text-muted-foreground">this quarter</span>
                  </div>
                  <For each={TEAM}>
                    {(m, i) => (
                      <div class={`flex items-center gap-3 px-4 py-2.5 ${i() > 0 ? "border-t border-border/40" : ""}`}>
                        <DitherAvatar name={m.name} size={32} animate={false} />
                        <div class="w-20 min-w-0 sm:w-24">
                          <div class="truncate text-[11px] text-foreground/90">{m.name}</div>
                          <div class="truncate text-[10px] text-muted-foreground">{m.role}</div>
                        </div>
                        <Sparkline data={m.data} color={m.color} class="h-5 min-w-0 flex-1" />
                        <span class="w-10 text-right text-[11px] tabular-nums text-muted-foreground">{m.commits}</span>
                      </div>
                    )}
                  </For>
                </div>
              </DemoCard>
            </Own>

            {/* Usage & billing */}
            <Own id="usage">
              <h2 class="text-lg tracking-tight">Usage &amp; billing</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Renders per month, quota as a donut, and the one button every billing page needs.
              </p>
              <DemoCard code={SNIPPETS.usage}>
                <div class="grid gap-4 sm:grid-cols-5">
                  <div class="rounded-lg border border-border/60 p-4 sm:col-span-3">
                    <div class="text-[11px] text-muted-foreground">Renders per month</div>
                    <div class="mt-3 h-40">
                      <BarChart data={usageRows} config={usageConfig} interactive={false}>
                        <XAxis dataKey="month" maxTicks={4} />
                        <Bar dataKey="renders" />
                      </BarChart>
                    </div>
                  </div>
                  <div class="flex flex-col rounded-lg border border-border/60 p-4 sm:col-span-2">
                    <div class="text-[11px] text-muted-foreground">dither-ui pro quota</div>
                    <div class="mt-3 h-28">
                      <PieChart data={quotaRows} config={quotaConfig} dataKey="value" nameKey="name" innerRadius={0.62}>
                        <Pie variant="gradient" />
                      </PieChart>
                    </div>
                    <div class="mt-2 text-center text-[11px] tabular-nums text-muted-foreground">
                      6.8M / 10M renders
                    </div>
                    <DitherButton color="blue" variant="gradient" class="mt-3 w-full py-2 text-[11px]">
                      Upgrade
                    </DitherButton>
                  </div>
                </div>
              </DemoCard>
            </Own>

            {/* Sign in */}
            <Own id="signin">
              <h2 class="text-lg tracking-tight">Sign in</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                An auth card washed by a DitherGradient: the pixels do the decoration, the form stays plain.
              </p>
              <DemoCard code={SNIPPETS.signin}>
                <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
                  <DitherGradient
                    from="blue"
                    to="transparent"
                    direction="up"
                    opacity={0.18}
                    cell={4}
                    renderMode="static"
                    class="-z-10"
                  />
                  <div class="flex items-center gap-2">
                    <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
                    <span class="text-[12px] tracking-tight">dither-ui</span>
                  </div>
                  <p class="mt-1.5 text-[11px] text-muted-foreground">Sign in to your workspace</p>
                  <div class="mt-5 grid gap-2.5">
                    <input
                      type="email"
                      name="demo-email"
                      placeholder="you@dither-ui.com"
                      autocomplete="off"
                      class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
                    />
                    <input
                      type="password"
                      name="demo-password"
                      placeholder="••••••••"
                      autocomplete="off"
                      class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
                    />
                    <DitherButton color="blue" variant="gradient" class="w-full py-2 text-[11px]">
                      Sign in
                    </DitherButton>
                  </div>
                  <p class="mt-4 text-center text-[10px] text-muted-foreground">
                    No account?{" "}
                    <a
                      href="#/docs/signin"
                      class="text-foreground/80 underline decoration-border underline-offset-2"
                      onClick={(e) => e.preventDefault()}
                    >
                      Request access
                    </a>
                  </p>
                </div>
              </DemoCard>
            </Own>

            {/* Auth cards: sign up, magic link, two-factor */}
            <Pack name="AuthExamples" />

            {/* Product blocks: pricing, activity feed, changelog */}
            <Pack name="ProductExamples" />

            {/* Sidebar blocks: dashboard, docs nav, admin panel */}
            <Pack name="SidebarExamples" />

            {/* Stat blocks: KPI cards, chart cards */}
            <Pack name="StatsExamples" />

            {/* Table block: filter + sort + select + paginate */}
            <Pack name="TableExamples" />

            {/* Chat block: conversations + live thread */}
            <Pack name="ChatExamples" />

            {/* Notification block: tabs + unread state */}
            <Pack name="NotificationsExamples" />

            {/* Area */}
            <Own id="area">
              <StudioHead title="Area chart" type="area" />
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Revenue against expenses, stacked. Hover for the tooltip; click a legend entry to isolate a series.
              </p>
              <DemoCard code={areaCode()}>
                <div class="h-64">
                  <AreaChart data={rows} config={config} stackType="stacked" replayToken={galleryReplay.area}>
                    <Grid horizontal />
                    <XAxis dataKey="month" maxTicks={6} />
                    <YAxis tickCount={4} />
                    <Area dataKey="expenses" variant="dotted" />
                    <Area dataKey="revenue" variant={picked.area} />
                    <Legend align="right" isClickable={true} />
                    <Tooltip labelKey="month" />
                  </AreaChart>
                </div>
              </DemoCard>
              <h3 class="mt-8 text-[12px] text-muted-foreground">Variants</h3>
              <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <For each={VARIANTS}>
                  {(v) => (
                    <button
                      type="button"
                      aria-pressed={picked.area === v}
                      class={thumbClass(picked.area === v)}
                      onClick={() => pick("area", v)}
                    >
                      <Sparkline data={wave} color="blue" variant={v} class="pointer-events-none h-14 w-full" />
                      <div class={thumbLabel(picked.area === v)}>{v}</div>
                    </button>
                  )}
                </For>
              </div>
              <h3 class="mt-8 text-[12px] text-muted-foreground">Seed-generative</h3>
              <p class="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                A number is a seed: the same deterministic idea as the avatar, applied to texture.{" "}
                <code class="text-foreground/80">{"variant={1984}"}</code> renders the same fill on every chart,
                forever.
              </p>
              <div class="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                <For each={SEEDS}>
                  {(s) => (
                    <button
                      type="button"
                      aria-pressed={picked.area === s}
                      class={thumbClass(picked.area === s)}
                      onClick={() => pick("area", s)}
                    >
                      <Sparkline data={wave} color="blue" variant={s} class="pointer-events-none h-14 w-full" />
                      <div class={`${thumbLabel(picked.area === s)} tabular-nums`}>{s}</div>
                    </button>
                  )}
                </For>
                <button
                  type="button"
                  class={`${thumbClass(rolled() !== null)} grid content-center`}
                  onClick={randomSeed}
                >
                  <div class="text-center text-[13px] text-muted-foreground" aria-hidden="true">
                    ~
                  </div>
                  <div class={`${thumbLabel(rolled() !== null)} tabular-nums`}>{rolled() ?? "random"}</div>
                </button>
              </div>
              <PropsTable rows={API.cartesian} />
            </Own>

            {/* Line */}
            <Own id="line">
              <StudioHead title="Line chart" type="line" />
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Bright series lines with sparkles on the live edge; nest a <code class="text-foreground/80">Dot</code>{" "}
                inside a line for markers.
              </p>
              <DemoCard code={lineCode()}>
                <div class="h-64">
                  <LineChart data={rows} config={config} replayToken={galleryReplay.line}>
                    <Grid horizontal />
                    <XAxis dataKey="month" maxTicks={6} />
                    <Line dataKey="revenue">
                      <Dot variant={picked.dot} r={2} />
                    </Line>
                    <Line dataKey="expenses" />
                    <Legend align="right" />
                    <Tooltip labelKey="month" />
                  </LineChart>
                </div>
              </DemoCard>
              <h3 class="mt-8 text-[12px] text-muted-foreground">Dot variants</h3>
              <div class="mt-2 grid grid-cols-3 gap-2">
                <For each={DOT_VARIANTS}>
                  {(d) => (
                    <button
                      type="button"
                      aria-pressed={picked.dot === d}
                      class={thumbClass(picked.dot === d)}
                      onClick={() => pickDot(d)}
                    >
                      <div class="pointer-events-none h-20">
                        <LineChart
                          data={miniRows}
                          config={miniConfig}
                          interactive={false}
                          margins={{ top: 6, right: 6, bottom: 6, left: 6 }}
                        >
                          <Line dataKey="v">
                            <Dot variant={d} r={2.5} />
                          </Line>
                        </LineChart>
                      </div>
                      <div class={thumbLabel(picked.dot === d)}>{d}</div>
                    </button>
                  )}
                </For>
              </div>
              <PropsTable rows={API.cartesian} />
            </Own>

            {/* Bar */}
            <Own id="bar">
              <StudioHead title="Bar chart" type="bar" />
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Organic vs paid traffic, grouped. Set <code class="text-foreground/80">stackType</code> to stacked or
                percent to pile the columns.
              </p>
              <DemoCard code={barCode()}>
                <div class="h-64">
                  <BarChart data={trafficRows} config={trafficConfig} replayToken={galleryReplay.bar}>
                    <Grid horizontal />
                    <XAxis dataKey="month" />
                    <YAxis tickCount={4} />
                    <Bar dataKey="organic" variant={picked.bar} />
                    <Bar dataKey="paid" variant={picked.bar} />
                    <Legend align="right" />
                    <Tooltip labelKey="month" />
                  </BarChart>
                </div>
              </DemoCard>
              <h3 class="mt-8 text-[12px] text-muted-foreground">Variants</h3>
              <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <For each={VARIANTS}>
                  {(v) => (
                    <button
                      type="button"
                      aria-pressed={picked.bar === v}
                      class={thumbClass(picked.bar === v)}
                      onClick={() => pick("bar", v)}
                    >
                      <div class="pointer-events-none h-20">
                        <BarChart
                          data={miniRows}
                          config={miniConfig}
                          interactive={false}
                          margins={{ top: 6, right: 6, bottom: 6, left: 6 }}
                        >
                          <Bar dataKey="v" variant={v} />
                        </BarChart>
                      </div>
                      <div class={thumbLabel(picked.bar === v)}>{v}</div>
                    </button>
                  )}
                </For>
              </div>
              <PropsTable rows={API.cartesian} />
            </Own>

            {/* Pie */}
            <Own id="pie">
              <StudioHead title="Pie chart" type="pie" />
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Browser share as a donut. Click a slice or a legend entry to isolate it.
              </p>
              <DemoCard code={pieCode()}>
                <div class="h-64">
                  <PieChart
                    data={pieRows}
                    config={pieConfig}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={0.55}
                    replayToken={galleryReplay.pie}
                  >
                    {/* Pie takes no `isClickable`: the legend isolates */}
                    <Pie variant={picked.pie} />
                    <Legend align="center" isClickable={true} />
                  </PieChart>
                </div>
              </DemoCard>
              <h3 class="mt-8 text-[12px] text-muted-foreground">Variants</h3>
              <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <For each={VARIANTS}>
                  {(v) => (
                    <button
                      type="button"
                      aria-pressed={picked.pie === v}
                      class={thumbClass(picked.pie === v)}
                      onClick={() => pick("pie", v)}
                    >
                      <div class="pointer-events-none h-24">
                        <PieChart
                          data={miniPieRows}
                          config={miniPieConfig}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={0.5}
                        >
                          <Pie variant={v} />
                        </PieChart>
                      </div>
                      <div class={thumbLabel(picked.pie === v)}>{v}</div>
                    </button>
                  )}
                </For>
              </div>
              <PropsTable rows={API.pie} />
            </Own>

            {/* Radar */}
            <Own id="radar">
              <StudioHead title="Radar chart" type="radar" />
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Sprint health across five axes, this sprint against the last.
              </p>
              <DemoCard code={SNIPPETS.radar}>
                <div class="h-72">
                  <RadarChart data={radarRows} config={radarConfig} nameKey="axis">
                    <Radar dataKey="current" />
                    <Radar dataKey="previous" />
                    <Legend align="center" />
                  </RadarChart>
                </div>
              </DemoCard>
              <PropsTable rows={API.radar} />
            </Own>

            {/* Sparkline */}
            <Own id="sparkline">
              <h2 class="text-lg tracking-tight">Sparkline</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                A plain numeric series with zero margins, built for stat cards, table cells and dashboard rows. Set{" "}
                <code>interactive</code> and it scrubs: its own crosshair marks the point under the pointer and{" "}
                <code>onHoverChange</code> reports it, here rolling each card's figure to that hour.
              </p>
              <DemoCard code={SNIPPETS.sparkline}>
                <div class="grid gap-4 sm:grid-cols-3">
                  <For each={STATS}>
                    {(s) => (
                      <div class="rounded-lg border border-border/60 p-4">
                        <div class="text-[11px] text-muted-foreground">{s.label}</div>
                        <div class="mt-1 flex items-baseline gap-2">
                          <span class="inline-flex items-center text-lg leading-none tracking-tight tabular-nums">
                            {s.unit.pre}
                            <DitherNumberFlow
                              value={s.read(s.data[scrubbed[s.label] ?? s.data.length - 1] ?? 0)}
                              decimals={s.unit.dec}
                              duration={240}
                            />
                            {s.unit.suf}
                          </span>
                          {/* The delta at rest, the hour while scrubbed: one cell. */}
                          <span class="grid text-[11px] tabular-nums">
                            <span
                              class={`[grid-area:1/1] transition-opacity duration-150 motion-reduce:transition-none ${
                                scrubbed[s.label] == null ? "opacity-100" : "opacity-0"
                              }`}
                              aria-hidden={scrubbed[s.label] != null}
                              style={{ color: cssColor(s.up ? "green" : "red") }}
                            >
                              {s.delta}
                            </span>
                            <span
                              class={`text-muted-foreground [grid-area:1/1] transition-opacity duration-150 motion-reduce:transition-none ${
                                scrubbed[s.label] == null ? "opacity-0" : "opacity-100"
                              }`}
                              aria-hidden={scrubbed[s.label] == null}
                            >
                              {s.data.length - 1 - (scrubbed[s.label] ?? s.data.length - 1)}h ago
                            </span>
                          </span>
                        </div>
                        <Sparkline
                          data={s.data}
                          color={s.color}
                          interactive
                          label={s.label}
                          hoverLift={false}
                          class="mt-3 h-8 w-full cursor-crosshair"
                          onHoverChange={(i) => setScrubbed(s.label, i)}
                        />
                      </div>
                    )}
                  </For>
                </div>
              </DemoCard>
              <PropsTable rows={API.sparkline} />
            </Own>

            {/* Button */}
            <Own id="button">
              <h2 class="text-lg tracking-tight">Button</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Canvas-filled button; density lifts on hover, blooms on press. Four fills, seven colors, optional{" "}
                <code class="text-foreground/80">bloom</code>, and static/precompiled raster paths.
              </p>
              <DemoCard code={buttonCode()}>
                <div class="grid justify-items-center gap-8">
                  <DitherButton color={btn.color} variant={btn.variant} bloom={btn.bloom} class="px-6 py-3 text-[13px]">
                    Deploy
                  </DitherButton>
                  <div class="grid justify-items-center gap-3">
                    <div class="flex flex-wrap items-center justify-center gap-1 rounded-md border border-border/60 p-1">
                      <For each={VARIANTS}>
                        {(v) => (
                          <button
                            type="button"
                            aria-pressed={btn.variant === v}
                            class={chipClass(btn.variant === v)}
                            onClick={() => setBtn("variant", v)}
                          >
                            {v}
                          </button>
                        )}
                      </For>
                    </div>
                    <div class="flex flex-wrap items-center justify-center gap-1 rounded-md border border-border/60 p-1">
                      <For each={BLOOMS}>
                        {(b) => (
                          <button
                            type="button"
                            aria-pressed={btn.bloom === b}
                            class={chipClass(btn.bloom === b)}
                            onClick={() => setBtn("bloom", b)}
                          >
                            bloom {b as string}
                          </button>
                        )}
                      </For>
                    </div>
                    <div class="flex items-center gap-2">
                      <For each={BUTTON_COLORS}>
                        {(c) => (
                          <button
                            type="button"
                            aria-label={`Color ${c}`}
                            aria-pressed={btn.color === c}
                            class={`size-6 rounded-[4px] transition-transform ${
                              btn.color === c
                                ? "ring-1 ring-foreground ring-offset-2 ring-offset-background"
                                : "hover:scale-110"
                            }`}
                            style={{ "background-color": cssColor(c) }}
                            onClick={() => setBtn("color", c)}
                          />
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </DemoCard>
              <PropsTable rows={API.button} />
            </Own>

            {/* Avatar */}
            <Own id="avatar">
              <h2 class="text-lg tracking-tight">Avatar</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                A deterministic identicon: the same name always draws the same face, at any size.
              </p>
              <DemoCard code={avatarCode()}>
                <div class="flex items-end justify-center gap-3">
                  <DitherAvatar name={avatarName()} size={24} replayToken={avatarReplay()} />
                  <DitherAvatar name={avatarName()} size={32} replayToken={avatarReplay()} />
                  <DitherAvatar name={avatarName()} size={48} replayToken={avatarReplay()} />
                  <DitherAvatar name={avatarName()} size={64} replayToken={avatarReplay()} />
                </div>
              </DemoCard>
              <h3 class="mt-8 text-[12px] text-muted-foreground">Names</h3>
              <div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                <For each={AVATAR_NAMES}>
                  {(n) => (
                    <button
                      type="button"
                      aria-pressed={avatarName() === n}
                      class={thumbClass(avatarName() === n)}
                      onClick={() => pickAvatar(n)}
                    >
                      <div class="pointer-events-none flex justify-center">
                        <DitherAvatar name={n} size={40} animate={false} />
                      </div>
                      <div class={thumbLabel(avatarName() === n)}>{n}</div>
                    </button>
                  )}
                </For>
              </div>
              <PropsTable rows={API.avatar} />
            </Own>

            {/* Gradient */}
            <Own id="gradient">
              <h2 class="text-lg tracking-tight">Gradient</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                A background wash that fades through the Bayer matrix instead of alpha, in four directions and any
                palette color.
              </p>
              <DemoCard code={gradientCode()}>
                <div class="grid gap-5">
                  <div class="relative h-40 overflow-hidden rounded-md">
                    <DitherGradient from={grad.from} to="transparent" direction={grad.direction} />
                  </div>
                  <div class="flex flex-wrap items-center justify-center gap-4">
                    <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
                      <For each={DIRECTIONS}>
                        {(dir) => (
                          <button
                            type="button"
                            aria-pressed={grad.direction === dir}
                            class={chipClass(grad.direction === dir)}
                            onClick={() => setGrad("direction", dir)}
                          >
                            {dir}
                          </button>
                        )}
                      </For>
                    </div>
                    <div class="flex items-center gap-2">
                      <For each={COLORS}>
                        {(c) => (
                          <button
                            type="button"
                            aria-label={`Color ${c}`}
                            aria-pressed={grad.from === c}
                            class={`size-6 rounded-[4px] transition-transform ${
                              grad.from === c
                                ? "ring-1 ring-foreground ring-offset-2 ring-offset-background"
                                : "hover:scale-110"
                            }`}
                            style={{ "background-color": cssColor(c) }}
                            onClick={() => setGrad("from", c)}
                          />
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </DemoCard>
              <PropsTable rows={API.gradient} />
            </Own>

            {/* Image */}
            <Own id="image">
              <h2 class="text-lg tracking-tight">Image</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Ordered-dithers any image into chunky cells; edges can dissolve into the page. Below: the site's own
                sprite sheet run through it.
              </p>
              <DemoCard code={SNIPPETS.image}>
                <DitherImage
                  src={assetPath("/sprites.webp")}
                  alt="The dither-ui sprite sheet, re-dithered"
                  cell={3}
                  focusY={0.62}
                  fade={72}
                  class="h-64 w-full"
                />
              </DemoCard>
              <PropsTable rows={API.image} />
            </Own>

            {/* Form controls: switch, checkbox, slider, progress */}
            <Pack name="FormDocs" />

            {/* Feedback: badge, skeleton, spinner, separator */}
            <Pack name="FeedbackDocs" />

            {/* Structure: tabs, collapsible, dialog, kbd */}
            <Pack name="StructureDocs" />

            {/* Layout: shell, rail, console, canvas, grid */}
            <Pack name="LayoutDocs" />

            {/* Media & data: video player, bracket, schedule */}
            <Pack name="MediaDocs" />

            {/* Fields & forms */}
            <Pack name="FieldDocs" />

            {/* Selection */}
            <Pack name="SelectionDocs" />

            {/* Form completions: password, search, scrub, hotkey, inline… */}
            <Pack name="FormsDocs" />

            {/* Overlays & menus */}
            <Pack name="OverlayDocs" />

            {/* Surfaces & status */}
            <Pack name="SurfaceDocs" />

            {/* Navigation & data */}
            <Pack name="NavigationDocs" />

            {/* Backgrounds: aurora, faulty terminal, ferrofluid */}
            <Pack name="BackgroundsDocs" />

            {/* Text animations: gradient, shiny, glitch, split, rotating, count */}
            <Pack name="TextDocs" />

            {/* Animations: content, borders, cursor and hover effects */}
            <Pack name="AnimationsDocs" />

            {/* Palette */}
            <Own id="palette">
              <h2 class="text-lg tracking-tight">Palette</h2>
              <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Seven seeded colors; every component resolves fill, line and sparkle hues from the same seed, so a
                dashboard stays coherent for free.
              </p>
              <DemoCard code={SNIPPETS.palette}>
                <div class="grid gap-3">
                  <For each={COLORS}>
                    {(c) => (
                      <div class="flex items-center gap-4">
                        <span class="w-14 text-[11px] text-muted-foreground">{c}</span>
                        <span class="size-5 rounded-[3px]" style={{ "background-color": cssColor(c) }} />
                        <Sparkline data={wave} color={c} class="h-6 flex-1" />
                      </div>
                    )}
                  </For>
                </div>
              </DemoCard>
              <PropsTable rows={API.palette} />
            </Own>

            {/* Print screens */}
            <ScreensSection />
          </div>

          {/* The book's turn: the sections either side, in the sidebar's order. */}
          <nav aria-label="Previous and next sections" class="mt-16 mb-6 grid max-w-2xl gap-3 sm:grid-cols-2">
            <Show when={near().prev}>
              {(prev) => (
                <a
                  href={docsUrl(prev().id)}
                  class="group rounded-xl border border-border/60 px-4 py-3 transition-colors hover:border-foreground/40"
                  onClick={(e) => to(prev().id)(e)}
                >
                  <span class="block text-[11px] text-muted-foreground">Previous, {prev().group}</span>
                  <span class="mt-1 block text-[14px] text-foreground">{prev().label}</span>
                </a>
              )}
            </Show>
            <Show when={near().next}>
              {(next) => (
                <a
                  href={docsUrl(next().id)}
                  class="group rounded-xl border border-border/60 px-4 py-3 text-right transition-colors hover:border-foreground/40 sm:col-start-2"
                  onClick={(e) => to(next().id)(e)}
                >
                  <span class="block text-[11px] text-muted-foreground">Next, {next().group}</span>
                  <span class="mt-1 block text-[14px] text-foreground">{next().label}</span>
                </a>
              )}
            </Show>
          </nav>
        </main>

        <aside class="sticky top-16 hidden h-[calc(100dvh-4rem)] w-40 shrink-0 overflow-y-auto py-10 pl-6 xl:block">
          <Show when={onPage().length}>
            <OnThisPage parts={onPage()} onGo={goTo} />
          </Show>
          <Show when={activeId() && docsMeta(activeId()).id}>
            <SectionShare id={activeId()} />
          </Show>
        </aside>
      </div>

      {/* Footer */}
      <footer class="border-t border-border/60">
        <div class="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-[11px] text-muted-foreground sm:px-6">
          <a href={routePath("/")} class="-my-1 py-1 transition-colors hover:text-foreground">
            dither-ui.com
          </a>
          <div class="flex items-center gap-4">
            <a
              href="https://github.com/drvova/dither-ui"
              target="_blank"
              rel="noreferrer"
              class="-my-1 flex items-center gap-1.5 py-1 transition-colors hover:text-foreground"
            >
              <ToolMark id="github" size={12} />
              GitHub<span class="sr-only"> (opens in a new tab)</span>
            </a>
            <span class="tabular-nums">v{version}</span>
            <span>MIT license</span>
          </div>
        </div>
      </footer>

      <DocsSheet
        open={sheetOpen()}
        activeId={shown()}
        parts={onPage()}
        onClose={() => setSheetOpen(false)}
        onGo={(id) => fromSheet(() => searchGo(id))}
        onPart={(el) => fromSheet(() => goTo(el))}
      />
      <DitherCommand
        open={searchOpen()}
        items={commandItems}
        placeholder="Search docs…"
        onSelect={searchGo}
        onClose={() => setSearchOpen(false)}
        // No section by that name: the mascot blinks at it.
        empty={(scope) => (
          <span class="flex flex-col items-center gap-2.5">
            <Mascot size={30} pose="blink" class="text-foreground" />
            <span>Nothing in the docs is called “{scope.query}”.</span>
          </span>
        )}
      />
    </div>
  )
}
