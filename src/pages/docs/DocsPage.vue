<script setup lang="ts">
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  cssColor,
  DitherAvatar,
  DitherButton,
  DitherGradient,
  DitherImage,
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
} from "@dither-kit"
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue"
import { CodeBlock } from "@/shared/ui"
import DemoCard from "./DemoCard.vue"
import FormDocs from "./components/FormDocs.vue"
import { FORM_NAV } from "./components/form-nav"
import FeedbackDocs from "./components/FeedbackDocs.vue"
import { FEEDBACK_NAV } from "./components/feedback-nav"
import StructureDocs from "./components/StructureDocs.vue"
import { STRUCTURE_NAV } from "./components/structure-nav"
import OverlayDocs from "./components/OverlayDocs.vue"
import { OVERLAY_NAV } from "./components/overlay-nav"
import FieldDocs from "./components/FieldDocs.vue"
import { FIELD_NAV } from "./components/field-nav"
import SelectionDocs from "./components/SelectionDocs.vue"
import { SELECTION_NAV } from "./components/selection-nav"
import SurfaceDocs from "./components/SurfaceDocs.vue"
import { SURFACE_NAV } from "./components/surface-nav"
import AuthExamples from "./examples/AuthExamples.vue"
import { AUTH_NAV } from "./examples/auth-nav"
import ProductExamples from "./examples/ProductExamples.vue"
import { PRODUCT_NAV } from "./examples/product-nav"
import PropsTable, { type PropRow } from "./PropsTable.vue"

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

// Stat-card sparklines — last 24 data points each.
const trend = (seed: number, drift: number) =>
  Array.from({ length: 24 }, (_, i) => 10 + i * drift + Math.sin(i * 0.8 + seed) * 2 + Math.sin(i * 1.7 + seed * 2) * 1.1)
const STATS = [
  { label: "Revenue", value: "$48.2k", delta: "+12.4%", up: true, color: "green" as DitherColor, data: trend(1, 0.35) },
  { label: "Active users", value: "8,110", delta: "+3.2%", up: true, color: "blue" as DitherColor, data: trend(2, 0.2) },
  { label: "Error rate", value: "0.42%", delta: "−8.1%", up: false, color: "red" as DitherColor, data: trend(3, -0.18).map((v) => v + 8) },
]

const VARIANTS: AreaVariant[] = ["gradient", "dotted", "hatched", "solid"]
const DOT_VARIANTS: DotVariant[] = ["border", "colored-border", "filled"]

// Variant galleries drive the main preview: picking one swaps the prop and
// bumps the chart's replay token, so the kit's own dither entrance IS the
// transition — no CSS theatre required.
const picked = reactive({
  area: "gradient" as AreaVariant,
  bar: "gradient" as AreaVariant,
  pie: "gradient" as AreaVariant,
  dot: "border" as DotVariant,
})
const galleryReplay = reactive({ area: 0, bar: 0, pie: 0, line: 0 })

function pick(section: "area" | "bar" | "pie", v: AreaVariant) {
  picked[section] = v
  galleryReplay[section]++
}
function pickDot(v: DotVariant) {
  picked.dot = v
  galleryReplay.line++
}

const thumbClass = (active: boolean) =>
  `rounded-md p-2 text-left transition-colors ${active ? "bg-card" : "hover:bg-card/50"}`
const thumbLabel = (active: boolean) =>
  `mt-2 text-center text-[10px] transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`
const chipClass = (active: boolean) =>
  `rounded px-2.5 py-1 text-[11px] transition-colors ${active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`

// Button playground — one preview, three pickers.
const btn = reactive({
  variant: "gradient" as ButtonVariant,
  color: "blue" as DitherColor,
  bloom: "off" as PixelBloom,
})
const BLOOMS: PixelBloom[] = ["off", "low", "high", "aura"]

// Avatar playground — picking a name replays the pixel entrance at all sizes.
const AVATAR_NAMES = ["ada", "linus", "grace", "alan", "edsger", "barbara"]
const avatarName = ref("ada")
const avatarReplay = ref(0)
function pickAvatar(n: string) {
  avatarName.value = n
  avatarReplay.value++
}

// Gradient playground.
const grad = reactive({ direction: "up" as GradientDirection, from: "blue" as DitherColor })

// App shell example.
const SHELL_NAV = ["Overview", "Reports", "Alerts", "Settings"]
const shellNav = ref("Overview")

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
  { name: "webhook-relay", uptime: "97.20%", ok: false, color: "red" as DitherColor, data: trend(7, -0.2).map((v) => v + 8) },
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
    { prop: "data", type: "Row[]", default: "—" },
    { prop: "config", type: "ChartConfig", default: "—" },
    { prop: "stack-type", type: '"default" | "stacked" | "percent"', default: '"default"' },
    { prop: "interactive", type: "boolean", default: "true" },
    { prop: "animate", type: "boolean", default: "true" },
    { prop: "animation-duration", type: "number", default: "900" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura"', default: '"off"' },
    { prop: "margins", type: "Partial<Margins>", default: "{}" },
  ],
  pie: [
    { prop: "data / config", type: "Row[] / ChartConfig", default: "—" },
    { prop: "data-key", type: "string", default: "—" },
    { prop: "name-key", type: "string", default: "—" },
    { prop: "inner-radius", type: "number 0…0.85", default: "0" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura"', default: '"off"' },
  ],
  radar: [
    { prop: "data / config", type: "Row[] / ChartConfig", default: "—" },
    { prop: "name-key", type: "string", default: "—" },
    { prop: "rings", type: "number", default: "4" },
  ],
  sparkline: [
    { prop: "data", type: "number[]", default: "—" },
    { prop: "color", type: "DitherColor", default: "—" },
    { prop: "variant", type: '"gradient" | "dotted" | "hatched" | "solid"', default: '"gradient"' },
    { prop: "marker-index", type: "number | null", default: "null" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura"', default: '"off"' },
    { prop: "animate", type: "boolean", default: "false" },
  ],
  motion: [
    { prop: "animate", type: "boolean", default: "true" },
    { prop: "animation-duration", type: "number (ms)", default: "900" },
    { prop: "animation-delay", type: "number (ms)", default: "0" },
    { prop: "replay-token", type: "number — bump to re-run", default: "0" },
  ],
  button: [
    { prop: "color", type: "DitherColor | number", default: '"blue"' },
    { prop: "variant", type: '"gradient" | "dotted" | "hatched" | "solid"', default: '"gradient"' },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura"', default: '"off"' },
  ],
  avatar: [
    { prop: "name", type: "string", default: "—" },
    { prop: "size", type: "number (px)", default: "—" },
    { prop: "hue", type: "number 0…360", default: "from name" },
    { prop: "mirror", type: '"auto" | "on" | "off"', default: '"auto"' },
    { prop: "animate", type: "boolean", default: "true" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura"', default: '"off"' },
  ],
  gradient: [
    { prop: "from", type: "DitherColor", default: "—" },
    { prop: "to", type: 'DitherColor | "transparent"', default: '"transparent"' },
    { prop: "direction", type: '"up" | "down" | "left" | "right"', default: '"up"' },
    { prop: "cell", type: "number (px)", default: "3" },
    { prop: "opacity", type: "number 0…1", default: "1" },
  ],
  image: [
    { prop: "src", type: "string", default: "—" },
    { prop: "cell", type: "number (px)", default: "3" },
    { prop: "focus-y", type: "number 0…1", default: "0.5" },
    { prop: "fade", type: "number (px)", default: "0" },
    { prop: "alt", type: "string", default: '""' },
  ],
  palette: [
    { prop: "cssColor(c)", type: "(DitherColor | number) → css string", default: "—" },
    { prop: "seedFromColor(c)", type: "(DitherColor | number) → Seed", default: "—" },
    { prop: "seedFromHue(h)", type: "(number 0…360) → Seed", default: "—" },
    { prop: "DitherColor", type: '"green" … "grey" — seven seeds', default: "—" },
  ],
}

const GROUPS = [
  {
    title: "Overview",
    items: [{ id: "getting-started", label: "Quick start" }],
  },
  {
    title: "Handbook",
    items: [
      { id: "styling", label: "Styling" },
      { id: "composition", label: "Composition" },
      { id: "motion", label: "Animation" },
      { id: "accessibility", label: "Accessibility" },
    ],
  },
  {
    title: "Examples",
    items: [
      { id: "dashboard", label: "Dashboard" },
      { id: "shell", label: "App shell" },
      { id: "monitoring", label: "Monitoring" },
      { id: "team", label: "Team" },
      { id: "usage", label: "Usage & billing" },
      { id: "signin", label: "Sign in" },
      ...AUTH_NAV,
      ...PRODUCT_NAV,
    ],
  },
  {
    title: "Components",
    items: [
      { id: "area", label: "Area Chart" },
      { id: "line", label: "Line Chart" },
      { id: "bar", label: "Bar Chart" },
      { id: "pie", label: "Pie Chart" },
      { id: "radar", label: "Radar Chart" },
      { id: "sparkline", label: "Sparkline" },
      { id: "button", label: "Button" },
      { id: "avatar", label: "Avatar" },
      { id: "gradient", label: "Gradient" },
      { id: "image", label: "Image" },
      ...FORM_NAV,
      ...FIELD_NAV,
      ...SELECTION_NAV,
      ...FEEDBACK_NAV,
      ...STRUCTURE_NAV,
      ...OVERLAY_NAV,
      ...SURFACE_NAV,
    ],
  },
  { title: "Utils", items: [{ id: "palette", label: "Palette" }] },
]

// Wayfinding: the sidebar tracks the section in view, the hash tracks the
// sidebar — so every section is shareable and survives a reload.
const activeId = ref("")
let observer: IntersectionObserver | null = null

const smooth = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: smooth() })
  history.replaceState(null, "", `#/docs/${id}`)
}

onMounted(() => {
  const ids = GROUPS.flatMap((g) => g.items.map((i) => i.id))

  // Deep link: #/docs/<section> — jump there once the sections have painted.
  const target = window.location.hash.replace(/^#\/docs\/?/, "")
  if (ids.includes(target)) {
    activeId.value = target
    // The deep link owns the scroll: stop the browser's own restoration from
    // overriding it on reload, and jump twice — once now, once after the
    // canvas-heavy sections above have sized (late growth shifts the target).
    history.scrollRestoration = "manual"
    const jump = () => document.getElementById(target)?.scrollIntoView()
    requestAnimationFrame(jump)
    window.setTimeout(jump, 450)
  }

  observer = new IntersectionObserver(
    (entries) => {
      // Topmost visible section wins; keep the previous one while scrolling gaps.
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      const id = visible[0]?.target.id
      if (id && id !== activeId.value) {
        activeId.value = id
        history.replaceState(null, "", `#/docs/${id}`)
      }
    },
    // Compensate for the 56px sticky chrome; trigger in the upper half.
    { rootMargin: "-56px 0px -50% 0px" }
  )
  for (const id of ids) {
    const el = document.getElementById(id)
    if (el) observer.observe(el)
  }
})
onBeforeUnmount(() => observer?.disconnect())

// Motion demo — replay re-runs the entrance, duration is chosen live.
const replayToken = ref(0)
const motionDuration = ref(900)
const DURATIONS = [300, 900, 2000]

const SNIPPETS = {
  install: `// Copy the dither-kit/ folder into your project, then alias it:
// vite.config.ts  →  "@dither-kit": "./dither-kit"
import { AreaChart, Area, DitherButton } from "@dither-kit"`,
  styling: `/* the kit reads shadcn-style tokens — theme by overriding them */
:root {
  --background: #08090b;   /* chart chrome: axes, legend, tooltip */
  --foreground: #ededed;
  --border: #22252b;
  --accent: #3f8ff3;
}

<!-- every component forwards class — compose with your utilities -->
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
    brand · nav (active chip) · <DitherAvatar /> footer
  </aside>
  <div>
    <header class="border-b px-4">      <!-- topbar -->
      title · <DitherButton>Export</DitherButton>
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
  <span :class="s.ok ? 'bg-green' : 'bg-red'" />  <!-- dot -->
  {{ s.name }} <Sparkline :data="s.data" :color="s.color" />
  {{ s.uptime }}
</div>`,
  team: `<div v-for="m in team" class="flex items-center gap-4">
  <DitherAvatar :name="m.name" :size="32" />
  {{ m.name }} · {{ m.role }}
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

<AreaChart :data="rows" :config="config" stack-type="stacked">
  <Grid horizontal />
  <XAxis data-key="month" :max-ticks="6" />
  <YAxis :tick-count="4" />
  <Area data-key="expenses" variant="dotted" />
  <Area data-key="revenue" variant="gradient" />
  <Legend align="right" />
  <Tooltip label-key="month" />
</AreaChart>`,
  line: `<LineChart :data="rows" :config="config">
  <Grid horizontal />
  <XAxis data-key="month" :max-ticks="6" />
  <Line data-key="revenue">
    <Dot variant="border" :r="2" />
  </Line>
  <Line data-key="expenses" />
  <Legend align="right" />
  <Tooltip label-key="month" />
</LineChart>`,
  bar: `<BarChart :data="trafficRows" :config="trafficConfig">
  <Grid horizontal />
  <XAxis data-key="month" />
  <YAxis :tick-count="4" />
  <Bar data-key="organic" />
  <Bar data-key="paid" />
  <Legend align="right" />
  <Tooltip label-key="month" />
</BarChart>`,
  pie: `<PieChart :data="pieRows" :config="pieConfig"
  data-key="value" name-key="name" :inner-radius="0.55">
  <Pie variant="gradient" is-clickable />
  <Legend align="center" />
</PieChart>`,
  radar: `<RadarChart :data="radarRows" :config="radarConfig" name-key="axis">
  <Radar data-key="current" />
  <Radar data-key="previous" />
  <Legend align="center" />
</RadarChart>`,
  sparkline: `<div class="rounded-lg border p-4">
  <div class="text-xs text-muted-foreground">Revenue</div>
  <div class="flex items-baseline gap-2">
    <span class="text-lg tabular-nums">$48.2k</span>
    <span class="text-xs text-green-400">+12.4%</span>
  </div>
  <Sparkline :data="last24h" color="green" class="mt-3 h-8 w-full" />
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

<!-- colors, bloom, disabled -->
<DitherButton color="green" bloom="low">Approve</DitherButton>
<DitherButton color="red" disabled>Delete</DitherButton>`,
  avatar: `<DitherAvatar name="ada" :size="24" />
<DitherAvatar name="ada" :size="32" />
<DitherAvatar name="ada" :size="48" />
<DitherAvatar name="grace" :size="48" bloom="low" />`,
  gradient: `<div class="relative h-40">
  <DitherGradient from="blue" to="transparent" direction="up" />
</div>
<!-- from/to: any DitherColor · direction: up · down · left · right
     cell: px per dither cell · opacity: 0…1 -->`,
  image: `<DitherImage src="/sprites.png" :cell="3" :focus-y="0.62" :fade="72"
  alt="The dither-ui sprite sheet, re-dithered" class="h-64 w-full" />
<!-- cell: px per dither cell · fade: dithered edge dissolve
     focus-y: cover-crop focus (0 top … 1 bottom) -->`,
  palette: `import { cssColor, type DitherColor } from "@dither-kit"
cssColor("blue") // rgb(53,143,243)`,
}

// Code tabs mirror the picked variant — what you see is what you copy.
const areaCode = computed(() =>
  SNIPPETS.area.replace('data-key="revenue" variant="gradient"', `data-key="revenue" variant="${picked.area}"`)
)
const lineCode = computed(() => SNIPPETS.line.replace('variant="border"', `variant="${picked.dot}"`))
const barCode = computed(() =>
  SNIPPETS.bar
    .replace('<Bar data-key="organic" />', `<Bar data-key="organic" variant="${picked.bar}" />`)
    .replace('<Bar data-key="paid" />', `<Bar data-key="paid" variant="${picked.bar}" />`)
)
const pieCode = computed(() => SNIPPETS.pie.replace('variant="gradient"', `variant="${picked.pie}"`))
const buttonCode = computed(
  () =>
    `<DitherButton color="${btn.color}" variant="${btn.variant}"${btn.bloom === "off" ? "" : ` bloom="${btn.bloom}"`}>
  Deploy
</DitherButton>`
)
const avatarCode = computed(
  () => `<DitherAvatar name="${avatarName.value}" :size="48" />
<!-- same name, same face — at any size -->`
)
const gradientCode = computed(
  () => `<div class="relative h-40">
  <DitherGradient from="${grad.from}" to="transparent" direction="${grad.direction}" />
</div>`
)
</script>

<template>
  <div class="min-h-screen bg-background font-mono text-foreground antialiased">
    <!-- Header: translucent material, scroll-edge fade instead of a hard divider -->
    <header class="chrome sticky top-0 z-40">
      <div class="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6 text-xs">
        <div class="flex items-center gap-6">
          <a href="#" class="tracking-tight transition-colors hover:text-foreground">dither-ui</a>
          <span class="hidden text-muted-foreground sm:inline">docs</span>
        </div>
        <nav class="flex items-center gap-5 text-muted-foreground">
          <a href="#/studio" class="-m-3 p-3 transition-colors hover:text-foreground">studio →</a>
        </nav>
      </div>
    </header>

    <div class="mx-auto flex w-full max-w-6xl px-6">
      <!-- Sidebar -->
      <aside class="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-y-auto py-10 pr-8 lg:block">
        <nav class="grid gap-7">
          <div v-for="grp in GROUPS" :key="grp.title">
            <div class="text-[11px] font-medium text-foreground">{{ grp.title }}</div>
            <ul class="mt-2.5 grid gap-1.5 border-l border-border/60">
              <li v-for="it in grp.items" :key="it.id">
                <a
                  :href="`#/docs/${it.id}`"
                  :aria-current="activeId === it.id ? 'true' : undefined"
                  class="-ml-px block border-l py-0.5 pl-3 text-[11px] transition-colors"
                  :class="activeId === it.id
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground'"
                  @click.prevent="scrollTo(it.id)"
                >{{ it.label }}</a>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <!-- Content -->
      <main class="min-w-0 flex-1 pb-24 lg:pl-10">
        <div class="max-w-2xl">
          <h1 class="mt-12 text-2xl tracking-tight">Components</h1>
          <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
            Every component draws on canvas through the same ordered-dither engine.
            Compose charts from parts, or drop in a single primitive.
          </p>

          <!-- Mobile nav -->
          <nav class="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground lg:hidden">
            <a v-for="it in GROUPS.flatMap((g) => g.items)" :key="it.id" :href="`#/docs/${it.id}`" class="transition-colors hover:text-foreground" :class="activeId === it.id ? 'text-foreground' : ''" @click.prevent="scrollTo(it.id)">
              {{ it.label }}
            </a>
          </nav>

          <!-- Installation -->
          <section id="getting-started" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Installation</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              The kit is a folder, not a package — copy
              <code class="text-foreground/80">dither-kit/</code> in and alias it.
              Vue 3, Tailwind, d3-scale and d3-shape are the only dependencies.
            </p>
            <div class="mt-5"><CodeBlock :code="SNIPPETS.install" /></div>
          </section>

          <!-- Styling -->
          <section id="styling" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Styling</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Pixels come from the palette seeds; chrome — axes, legend,
              tooltip, borders — reads shadcn-style CSS tokens. Override the
              tokens to theme, pass <code class="text-foreground/80">class</code>
              to compose with your own utilities.
            </p>
            <div class="mt-5"><CodeBlock :code="SNIPPETS.styling" /></div>
          </section>

          <!-- Composition -->
          <section id="composition" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Composition</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              A chart is a root plus parts. The root measures, builds scales and
              provides context; children register themselves — grid and axes as
              chrome, <code class="text-foreground/80">Area</code>/<code class="text-foreground/80">Line</code>/<code class="text-foreground/80">Bar</code>
              as series, <code class="text-foreground/80">Dot</code> nested inside a
              series. Order in the template is paint order.
            </p>
            <div class="mt-5"><CodeBlock :code="SNIPPETS.composition" /></div>
          </section>

          <!-- Accessibility -->
          <section id="accessibility" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Accessibility</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Canvases are decoration and stay <code class="text-foreground/80">aria-hidden</code>;
              each chart exposes a single labelled node instead of hundreds of
              shapes. Legends are real buttons. Reduced motion snaps entrances
              and stills the sparkles; reduced transparency solidifies floating
              chrome — both from the OS setting, no props required.
            </p>
            <div class="mt-5"><CodeBlock :code="SNIPPETS.accessibility" /></div>
          </section>

          <!-- Motion -->
          <section id="motion" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Motion</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Entrances draw the dither field in; bump
              <code class="text-foreground/80">replay-token</code> to run one again.
              When the OS asks for reduced motion, entrances snap and sparkles hold still — no opt-in needed.
            </p>
            <DemoCard :code="SNIPPETS.motion">
              <div class="grid gap-5">
                <div class="h-48">
                  <BarChart
                    :data="trafficRows"
                    :config="trafficConfig"
                    :interactive="false"
                    :animation-duration="motionDuration"
                    :replay-token="replayToken"
                  >
                    <XAxis data-key="month" />
                    <Bar data-key="organic" />
                    <Bar data-key="paid" />
                  </BarChart>
                </div>
                <div class="flex flex-wrap items-center justify-center gap-3">
                  <DitherButton color="blue" variant="gradient" @click="replayToken++">Replay</DitherButton>
                  <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
                    <button
                      v-for="d in DURATIONS"
                      :key="d"
                      type="button"
                      class="rounded px-2.5 py-1 text-[11px] tabular-nums transition-colors"
                      :class="motionDuration === d ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'"
                      @click="motionDuration = d; replayToken++"
                    >
                      {{ d }}ms
                    </button>
                  </div>
                </div>
              </div>
            </DemoCard>
            <PropsTable :rows="API.motion" />
          </section>


          <!-- Dashboard -->
          <section id="dashboard" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Dashboard example</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Everything composed: stat cards, a stacked area, a donut — one
              palette, one texture, zero SVG.
            </p>
            <DemoCard :code="SNIPPETS.dashboard">
              <div class="grid gap-4">
                <div class="grid gap-4 sm:grid-cols-3">
                  <div v-for="s in STATS" :key="s.label" class="rounded-lg border border-border/60 p-4">
                    <div class="text-[11px] text-muted-foreground">{{ s.label }}</div>
                    <div class="mt-1 flex items-baseline gap-2">
                      <span class="text-lg tracking-tight tabular-nums">{{ s.value }}</span>
                      <span class="text-[11px] tabular-nums" :style="{ color: cssColor(s.up ? 'green' : 'red') }">{{ s.delta }}</span>
                    </div>
                    <Sparkline :data="s.data" :color="s.color" class="mt-3 h-8 w-full" />
                  </div>
                </div>
                <div class="grid gap-4 lg:grid-cols-3">
                  <div class="rounded-lg border border-border/60 p-4 lg:col-span-2">
                    <div class="text-[11px] text-muted-foreground">Revenue vs expenses</div>
                    <div class="mt-3 h-44">
                      <AreaChart :data="rows" :config="config" stack-type="stacked">
                        <XAxis data-key="month" :max-ticks="6" />
                        <Area data-key="expenses" variant="dotted" />
                        <Area data-key="revenue" variant="gradient" />
                        <Tooltip label-key="month" />
                      </AreaChart>
                    </div>
                  </div>
                  <div class="rounded-lg border border-border/60 p-4">
                    <div class="text-[11px] text-muted-foreground">Browser share</div>
                    <div class="mt-3 h-44">
                      <PieChart :data="pieRows" :config="pieConfig" data-key="value" name-key="name" :inner-radius="0.55">
                        <Pie variant="gradient" />
                      </PieChart>
                    </div>
                  </div>
                </div>
              </div>
            </DemoCard>
          </section>

          <!-- App shell -->
          <section id="shell" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">App shell</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Sidebar, topbar, content — a whole product frame from tokens and
              kit primitives. The nav works; click around.
            </p>
            <DemoCard :code="SNIPPETS.shell">
              <div class="grid grid-cols-[150px_1fr] overflow-hidden rounded-lg border border-border/60 text-left sm:grid-cols-[170px_1fr]">
                <!-- Sidebar -->
                <aside class="flex min-h-[360px] flex-col border-r border-border/60 bg-background/40 p-3">
                  <div class="flex items-center gap-2 px-2 py-1.5">
                    <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
                    <span class="text-[12px] tracking-tight">dither-ui</span>
                  </div>
                  <nav class="mt-4 grid gap-0.5">
                    <button
                      v-for="item in SHELL_NAV"
                      :key="item"
                      type="button"
                      :aria-pressed="shellNav === item"
                      class="rounded-md px-2 py-1.5 text-left text-[11px] transition-colors"
                      :class="shellNav === item ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'"
                      @click="shellNav = item"
                    >
                      {{ item }}
                    </button>
                  </nav>
                  <div class="mt-auto flex items-center gap-2 px-2 pt-3">
                    <DitherAvatar name="ada" :size="24" :animate="false" />
                    <div class="min-w-0">
                      <div class="truncate text-[11px] text-foreground/90">ada</div>
                      <div class="text-[10px] text-muted-foreground">admin</div>
                    </div>
                  </div>
                </aside>
                <!-- Main -->
                <div class="flex min-w-0 flex-col">
                  <header class="flex h-10 shrink-0 items-center justify-between border-b border-border/60 px-4">
                    <span class="text-[12px]">{{ shellNav }}</span>
                    <DitherButton color="blue" variant="gradient" class="px-2.5 py-1 text-[10px]">Export</DitherButton>
                  </header>
                  <main class="grid flex-1 content-start gap-3 p-4">
                    <div class="grid grid-cols-3 gap-3">
                      <div v-for="s in STATS" :key="s.label" class="rounded-md border border-border/60 p-2.5">
                        <div class="truncate text-[10px] text-muted-foreground">{{ s.label }}</div>
                        <div class="text-[13px] tracking-tight tabular-nums">{{ s.value }}</div>
                        <Sparkline :data="s.data" :color="s.color" class="mt-1.5 h-5 w-full" />
                      </div>
                    </div>
                    <div class="rounded-md border border-border/60 p-3">
                      <div class="text-[10px] text-muted-foreground">Revenue vs expenses</div>
                      <div class="mt-2 h-36">
                        <AreaChart :data="rows" :config="config" stack-type="stacked" :interactive="false">
                          <Area data-key="expenses" variant="dotted" />
                          <Area data-key="revenue" variant="gradient" />
                        </AreaChart>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
            </DemoCard>
          </section>

          <!-- Monitoring -->
          <section id="monitoring" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Monitoring</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              An ops board: system pulse, sprint health, and per-service status
              rows — the grey seed marks what is quiet, red what is not.
            </p>
            <DemoCard :code="SNIPPETS.monitoring">
              <div class="grid gap-4 lg:grid-cols-5">
                <div class="rounded-lg border border-border/60 p-4 lg:col-span-3">
                  <div class="text-[11px] text-muted-foreground">System pulse</div>
                  <div class="mt-3 h-44">
                    <LineChart :data="rows" :config="config" :interactive="false">
                      <Grid horizontal />
                      <XAxis data-key="month" :max-ticks="6" />
                      <Line data-key="revenue" />
                      <Line data-key="expenses" />
                    </LineChart>
                  </div>
                </div>
                <div class="rounded-lg border border-border/60 p-4 lg:col-span-2">
                  <div class="text-[11px] text-muted-foreground">Sprint health</div>
                  <div class="mt-3 h-44">
                    <RadarChart :data="radarRows" :config="radarConfig" name-key="axis">
                      <Radar data-key="current" />
                      <Radar data-key="previous" />
                    </RadarChart>
                  </div>
                </div>
                <div class="rounded-lg border border-border/60 lg:col-span-5">
                  <div v-for="(s, i) in SERVICES" :key="s.name" class="flex items-center gap-4 px-4 py-2.5" :class="i > 0 ? 'border-t border-border/40' : ''">
                    <span class="size-1.5 shrink-0 rounded-full" :style="{ backgroundColor: cssColor(s.ok ? 'green' : 'red') }" />
                    <span class="w-28 truncate text-[11px] text-foreground/90 sm:w-36">{{ s.name }}</span>
                    <Sparkline :data="s.data" :color="s.color" class="h-5 min-w-0 flex-1" />
                    <span class="w-14 text-right text-[11px] tabular-nums" :class="s.ok ? 'text-muted-foreground' : 'text-foreground'" :style="s.ok ? {} : { color: cssColor('red') }">{{ s.uptime }}</span>
                  </div>
                </div>
              </div>
            </DemoCard>
          </section>

          <!-- Team -->
          <section id="team" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Team</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Contributors panel — deterministic avatars, a commit pulse per
              person, one palette seed each.
            </p>
            <DemoCard :code="SNIPPETS.team">
              <div class="mx-auto max-w-md rounded-lg border border-border/60">
                <div class="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
                  <span class="text-[11px] text-muted-foreground">dither-ui · contributors</span>
                  <span class="text-[11px] tabular-nums text-muted-foreground">this quarter</span>
                </div>
                <div v-for="(m, i) in TEAM" :key="m.name" class="flex items-center gap-3 px-4 py-2.5" :class="i > 0 ? 'border-t border-border/40' : ''">
                  <DitherAvatar :name="m.name" :size="32" :animate="false" />
                  <div class="w-20 min-w-0 sm:w-24">
                    <div class="truncate text-[11px] text-foreground/90">{{ m.name }}</div>
                    <div class="truncate text-[10px] text-muted-foreground">{{ m.role }}</div>
                  </div>
                  <Sparkline :data="m.data" :color="m.color" class="h-5 min-w-0 flex-1" />
                  <span class="w-10 text-right text-[11px] tabular-nums text-muted-foreground">{{ m.commits }}</span>
                </div>
              </div>
            </DemoCard>
          </section>

          <!-- Usage & billing -->
          <section id="usage" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Usage &amp; billing</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Renders per month, quota as a donut, and the one button every
              billing page needs.
            </p>
            <DemoCard :code="SNIPPETS.usage">
              <div class="grid gap-4 sm:grid-cols-5">
                <div class="rounded-lg border border-border/60 p-4 sm:col-span-3">
                  <div class="text-[11px] text-muted-foreground">Renders per month</div>
                  <div class="mt-3 h-40">
                    <BarChart :data="usageRows" :config="usageConfig" :interactive="false">
                      <XAxis data-key="month" :max-ticks="4" />
                      <Bar data-key="renders" />
                    </BarChart>
                  </div>
                </div>
                <div class="flex flex-col rounded-lg border border-border/60 p-4 sm:col-span-2">
                  <div class="text-[11px] text-muted-foreground">Quota · dither-ui pro</div>
                  <div class="mt-3 h-28">
                    <PieChart :data="quotaRows" :config="quotaConfig" data-key="value" name-key="name" :inner-radius="0.62">
                      <Pie variant="gradient" />
                    </PieChart>
                  </div>
                  <div class="mt-2 text-center text-[11px] tabular-nums text-muted-foreground">6.8M / 10M renders</div>
                  <DitherButton color="blue" variant="gradient" class="mt-3 w-full py-2 text-[11px]">Upgrade</DitherButton>
                </div>
              </div>
            </DemoCard>
          </section>

          <!-- Sign in -->
          <section id="signin" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Sign in</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              An auth card washed by a DitherGradient — the pixels do the
              decoration, the form stays plain.
            </p>
            <DemoCard :code="SNIPPETS.signin">
              <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
                <DitherGradient from="blue" to="transparent" direction="up" :opacity="0.18" :cell="3" class="-z-10" />
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
                    class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent/60"
                  />
                  <input
                    type="password"
                    name="demo-password"
                    placeholder="••••••••"
                    autocomplete="off"
                    class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent/60"
                  />
                  <DitherButton color="blue" variant="gradient" class="w-full py-2 text-[11px]">Sign in</DitherButton>
                </div>
                <p class="mt-4 text-center text-[10px] text-muted-foreground">
                  No account? <a href="#/docs/signin" class="text-foreground/80 underline decoration-border underline-offset-2" @click.prevent>Request access</a>
                </p>
              </div>
            </DemoCard>
          </section>

          <!-- Auth cards: sign up, magic link, two-factor -->
          <AuthExamples />

          <!-- Product blocks: pricing, activity feed, changelog -->
          <ProductExamples />

          <!-- Area -->
          <section id="area" class="mt-16 scroll-mt-24">
            <div class="flex items-baseline justify-between gap-4">
              <h2 class="text-lg tracking-tight">Area Chart</h2>
              <a href="#/studio/new/area" class="-m-2 shrink-0 p-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground" aria-label="Open a new area chart in the studio">open in studio →</a>
            </div>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Revenue against expenses, stacked. Hover for the tooltip; click a legend
              entry to isolate a series.
            </p>
            <DemoCard :code="areaCode">
              <div class="h-64">
                <AreaChart :data="rows" :config="config" stack-type="stacked" :replay-token="galleryReplay.area">
                  <Grid horizontal />
                  <XAxis data-key="month" :max-ticks="6" />
                  <YAxis :tick-count="4" />
                  <Area data-key="expenses" variant="dotted" />
                  <Area data-key="revenue" :variant="picked.area" />
                  <Legend align="right" :is-clickable="true" />
                  <Tooltip label-key="month" />
                </AreaChart>
              </div>
            </DemoCard>
            <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">variants</h3>
            <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button v-for="v in VARIANTS" :key="v" type="button" :aria-pressed="picked.area === v" :class="thumbClass(picked.area === v)" @click="pick('area', v)">
                <Sparkline :data="wave" color="blue" :variant="v" class="pointer-events-none h-14 w-full" />
                <div :class="thumbLabel(picked.area === v)">{{ v }}</div>
              </button>
            </div>
            <PropsTable :rows="API.cartesian" />
          </section>

          <!-- Line -->
          <section id="line" class="mt-16 scroll-mt-24">
            <div class="flex items-baseline justify-between gap-4">
              <h2 class="text-lg tracking-tight">Line Chart</h2>
              <a href="#/studio/new/line" class="-m-2 shrink-0 p-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground" aria-label="Open a new line chart in the studio">open in studio →</a>
            </div>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Bright series lines with sparkles on the live edge; nest a
              <code class="text-foreground/80">Dot</code> inside a line for markers.
            </p>
            <DemoCard :code="lineCode">
              <div class="h-64">
                <LineChart :data="rows" :config="config" :replay-token="galleryReplay.line">
                  <Grid horizontal />
                  <XAxis data-key="month" :max-ticks="6" />
                  <Line data-key="revenue">
                    <Dot :variant="picked.dot" :r="2" />
                  </Line>
                  <Line data-key="expenses" />
                  <Legend align="right" />
                  <Tooltip label-key="month" />
                </LineChart>
              </div>
            </DemoCard>
            <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">dot variants</h3>
            <div class="mt-2 grid grid-cols-3 gap-2">
              <button v-for="d in DOT_VARIANTS" :key="d" type="button" :aria-pressed="picked.dot === d" :class="thumbClass(picked.dot === d)" @click="pickDot(d)">
                <div class="pointer-events-none h-20">
                  <LineChart :data="miniRows" :config="miniConfig" :interactive="false" :margins="{ top: 6, right: 6, bottom: 6, left: 6 }">
                    <Line data-key="v">
                      <Dot :variant="d" :r="2.5" />
                    </Line>
                  </LineChart>
                </div>
                <div :class="thumbLabel(picked.dot === d)">{{ d }}</div>
              </button>
            </div>
            <PropsTable :rows="API.cartesian" />
          </section>

          <!-- Bar -->
          <section id="bar" class="mt-16 scroll-mt-24">
            <div class="flex items-baseline justify-between gap-4">
              <h2 class="text-lg tracking-tight">Bar Chart</h2>
              <a href="#/studio/new/bar" class="-m-2 shrink-0 p-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground" aria-label="Open a new bar chart in the studio">open in studio →</a>
            </div>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Organic vs paid traffic, grouped. Set
              <code class="text-foreground/80">stack-type</code> to stacked or percent
              to pile the columns.
            </p>
            <DemoCard :code="barCode">
              <div class="h-64">
                <BarChart :data="trafficRows" :config="trafficConfig" :replay-token="galleryReplay.bar">
                  <Grid horizontal />
                  <XAxis data-key="month" />
                  <YAxis :tick-count="4" />
                  <Bar data-key="organic" :variant="picked.bar" />
                  <Bar data-key="paid" :variant="picked.bar" />
                  <Legend align="right" />
                  <Tooltip label-key="month" />
                </BarChart>
              </div>
            </DemoCard>
            <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">variants</h3>
            <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button v-for="v in VARIANTS" :key="v" type="button" :aria-pressed="picked.bar === v" :class="thumbClass(picked.bar === v)" @click="pick('bar', v)">
                <div class="pointer-events-none h-20">
                  <BarChart :data="miniRows" :config="miniConfig" :interactive="false" :margins="{ top: 6, right: 6, bottom: 6, left: 6 }">
                    <Bar data-key="v" :variant="v" />
                  </BarChart>
                </div>
                <div :class="thumbLabel(picked.bar === v)">{{ v }}</div>
              </button>
            </div>
            <PropsTable :rows="API.cartesian" />
          </section>

          <!-- Pie -->
          <section id="pie" class="mt-16 scroll-mt-24">
            <div class="flex items-baseline justify-between gap-4">
              <h2 class="text-lg tracking-tight">Pie Chart</h2>
              <a href="#/studio/new/pie" class="-m-2 shrink-0 p-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground" aria-label="Open a new pie chart in the studio">open in studio →</a>
            </div>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Browser share as a donut — click a slice or legend entry to isolate it.
            </p>
            <DemoCard :code="pieCode">
              <div class="h-64">
                <PieChart :data="pieRows" :config="pieConfig" data-key="value" name-key="name" :inner-radius="0.55" :replay-token="galleryReplay.pie">
                  <Pie :variant="picked.pie" :is-clickable="true" />
                  <Legend align="center" :is-clickable="true" />
                </PieChart>
              </div>
            </DemoCard>
            <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">variants</h3>
            <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button v-for="v in VARIANTS" :key="v" type="button" :aria-pressed="picked.pie === v" :class="thumbClass(picked.pie === v)" @click="pick('pie', v)">
                <div class="pointer-events-none h-24">
                  <PieChart :data="miniPieRows" :config="miniPieConfig" data-key="value" name-key="name" :inner-radius="0.5">
                    <Pie :variant="v" />
                  </PieChart>
                </div>
                <div :class="thumbLabel(picked.pie === v)">{{ v }}</div>
              </button>
            </div>
            <PropsTable :rows="API.pie" />
          </section>

          <!-- Radar -->
          <section id="radar" class="mt-16 scroll-mt-24">
            <div class="flex items-baseline justify-between gap-4">
              <h2 class="text-lg tracking-tight">Radar Chart</h2>
              <a href="#/studio/new/radar" class="-m-2 shrink-0 p-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground" aria-label="Open a new radar chart in the studio">open in studio →</a>
            </div>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Sprint health across five axes, this sprint against the last.
            </p>
            <DemoCard :code="SNIPPETS.radar">
              <div class="h-72">
                <RadarChart :data="radarRows" :config="radarConfig" name-key="axis">
                  <Radar data-key="current" />
                  <Radar data-key="previous" />
                  <Legend align="center" />
                </RadarChart>
              </div>
            </DemoCard>
            <PropsTable :rows="API.radar" />
          </section>

          <!-- Sparkline -->
          <section id="sparkline" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Sparkline</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              A plain numeric series with zero margins — built for stat cards,
              table cells and dashboard rows.
            </p>
            <DemoCard :code="SNIPPETS.sparkline">
              <div class="grid gap-4 sm:grid-cols-3">
                <div v-for="s in STATS" :key="s.label" class="rounded-lg border border-border/60 p-4">
                  <div class="text-[11px] text-muted-foreground">{{ s.label }}</div>
                  <div class="mt-1 flex items-baseline gap-2">
                    <span class="text-lg tracking-tight tabular-nums">{{ s.value }}</span>
                    <span class="text-[11px] tabular-nums" :style="{ color: cssColor(s.up ? 'green' : 'red') }">{{ s.delta }}</span>
                  </div>
                  <Sparkline :data="s.data" :color="s.color" class="mt-3 h-8 w-full" />
                </div>
              </div>
            </DemoCard>
            <PropsTable :rows="API.sparkline" />
          </section>


          <!-- Button -->
          <section id="button" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Button</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Canvas-filled button; density lifts on hover, blooms on press.
              Four fills, seven colors, optional <code class="text-foreground/80">bloom</code>.
            </p>
            <DemoCard :code="buttonCode">
              <div class="grid justify-items-center gap-8">
                <DitherButton :color="btn.color" :variant="btn.variant" :bloom="btn.bloom" class="px-6 py-3 text-[13px]">
                  Deploy
                </DitherButton>
                <div class="grid justify-items-center gap-3">
                  <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
                    <button v-for="v in VARIANTS" :key="v" type="button" :aria-pressed="btn.variant === v" :class="chipClass(btn.variant === v)" @click="btn.variant = v">{{ v }}</button>
                  </div>
                  <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
                    <button v-for="b in BLOOMS" :key="b" type="button" :aria-pressed="btn.bloom === b" :class="chipClass(btn.bloom === b)" @click="btn.bloom = b">bloom {{ b }}</button>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      v-for="c in BUTTON_COLORS"
                      :key="c"
                      type="button"
                      :aria-label="`Color ${c}`"
                      :aria-pressed="btn.color === c"
                      class="size-6 rounded-[4px] transition-transform"
                      :class="btn.color === c ? 'ring-1 ring-foreground ring-offset-2 ring-offset-background' : 'hover:scale-110'"
                      :style="{ backgroundColor: cssColor(c) }"
                      @click="btn.color = c"
                    />
                  </div>
                </div>
              </div>
            </DemoCard>
            <PropsTable :rows="API.button" />
          </section>

          <!-- Avatar -->
          <section id="avatar" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Avatar</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Deterministic identicon — the same name always draws the same face,
              at any size.
            </p>
            <DemoCard :code="avatarCode">
              <div class="flex items-end justify-center gap-3">
                <DitherAvatar :name="avatarName" :size="24" :replay-token="avatarReplay" />
                <DitherAvatar :name="avatarName" :size="32" :replay-token="avatarReplay" />
                <DitherAvatar :name="avatarName" :size="48" :replay-token="avatarReplay" />
                <DitherAvatar :name="avatarName" :size="64" :replay-token="avatarReplay" />
              </div>
            </DemoCard>
            <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">names</h3>
            <div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              <button v-for="n in AVATAR_NAMES" :key="n" type="button" :aria-pressed="avatarName === n" :class="thumbClass(avatarName === n)" @click="pickAvatar(n)">
                <div class="pointer-events-none flex justify-center">
                  <DitherAvatar :name="n" :size="40" :animate="false" />
                </div>
                <div :class="thumbLabel(avatarName === n)">{{ n }}</div>
              </button>
            </div>
            <PropsTable :rows="API.avatar" />
          </section>

          <!-- Gradient -->
          <section id="gradient" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Gradient</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              A background wash that fades through the Bayer matrix instead of alpha —
              four directions, any palette color.
            </p>
            <DemoCard :code="gradientCode">
              <div class="grid gap-5">
                <div class="relative h-40 overflow-hidden rounded-md">
                  <DitherGradient :from="grad.from" to="transparent" :direction="grad.direction" />
                </div>
                <div class="flex flex-wrap items-center justify-center gap-4">
                  <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
                    <button v-for="dir in DIRECTIONS" :key="dir" type="button" :aria-pressed="grad.direction === dir" :class="chipClass(grad.direction === dir)" @click="grad.direction = dir">{{ dir }}</button>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      v-for="c in COLORS"
                      :key="c"
                      type="button"
                      :aria-label="`Color ${c}`"
                      :aria-pressed="grad.from === c"
                      class="size-6 rounded-[4px] transition-transform"
                      :class="grad.from === c ? 'ring-1 ring-foreground ring-offset-2 ring-offset-background' : 'hover:scale-110'"
                      :style="{ backgroundColor: cssColor(c) }"
                      @click="grad.from = c"
                    />
                  </div>
                </div>
              </div>
            </DemoCard>
            <PropsTable :rows="API.gradient" />
          </section>

          <!-- Image -->
          <section id="image" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Image</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Ordered-dithers any image into chunky cells; edges can dissolve
              into the page. Below: the site's own sprite sheet run through it.
            </p>
            <DemoCard :code="SNIPPETS.image">
              <DitherImage
                src="/sprites.png"
                alt="The dither-ui sprite sheet, re-dithered"
                :cell="3"
                :focus-y="0.62"
                :fade="72"
                class="h-64 w-full"
              />
            </DemoCard>
            <PropsTable :rows="API.image" />
          </section>

          <!-- Form controls: switch, checkbox, slider, progress -->
          <FormDocs />

          <!-- Feedback: badge, skeleton, spinner, separator -->
          <FeedbackDocs />

          <!-- Structure: tabs, collapsible, dialog, kbd -->
          <StructureDocs />

          <!-- Fields & forms -->
          <FieldDocs />

          <!-- Selection -->
          <SelectionDocs />

          <!-- Overlays & menus -->
          <OverlayDocs />

          <!-- Surfaces & status -->
          <SurfaceDocs />

          <!-- Palette -->
          <section id="palette" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Palette</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Seven seeded colors; every component resolves fill, line and sparkle
              hues from the same seed, so a dashboard stays coherent for free.
            </p>
            <DemoCard :code="SNIPPETS.palette">
              <div class="grid gap-3">
                <div v-for="c in COLORS" :key="c" class="flex items-center gap-4">
                  <span class="w-14 text-[11px] text-muted-foreground">{{ c }}</span>
                  <span class="size-5 rounded-[3px]" :style="{ backgroundColor: cssColor(c) }" />
                  <Sparkline :data="wave" :color="c" class="h-6 flex-1" />
                </div>
              </div>
            </DemoCard>
            <PropsTable :rows="API.palette" />
          </section>
        </div>
      </main>
    </div>

    <!-- Footer -->
    <footer class="border-t border-border/60">
      <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 text-[11px] text-muted-foreground">
        <a href="#" class="transition-colors hover:text-foreground">← dither-ui.com</a>
        <span>MIT</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Apple-style chrome: a floating translucent material — content scrolls under
   it, the boundary is a faded edge rather than a hard 1px divider. */
.chrome {
  background: color-mix(in oklab, var(--background) 82%, transparent);
  backdrop-filter: blur(14px) saturate(1.5);
  -webkit-backdrop-filter: blur(14px) saturate(1.5);
}

/* Narrow screens put dense tables right under the chrome — frost it harder
   so high-contrast text cannot silhouette through. */
@media (max-width: 640px) {
  .chrome {
    background: color-mix(in oklab, var(--background) 93%, transparent);
  }
}

.chrome::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  top: 100%;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    color-mix(in oklab, var(--border) 80%, transparent) 20%,
    color-mix(in oklab, var(--border) 80%, transparent) 80%,
    transparent
  );
}

@media (prefers-reduced-transparency: reduce) {
  .chrome {
    background: var(--background);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
</style>
