<script lang="ts">
  import {
    AreaChart,
    Area,
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Sparkline,
    Dot,
    Grid,
    XAxis,
    YAxis,
    Legend,
    Tooltip,
    cssColor,
    type ButtonVariant,
    type DitherColor,
  } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable from "./PropsTable.svelte"

  // `ButtonVariant` is the shared texture-variant union ("gradient" | "dotted" |
  // "hatched" | "solid"); dot variants are their own small union.
  type DotVariant = "border" | "colored-border" | "filled"

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

  // Stat-card sparklines — last 24 data points each.
  const trend = (seed: number, drift: number) =>
    Array.from({ length: 24 }, (_, i) => 10 + i * drift + Math.sin(i * 0.8 + seed) * 2 + Math.sin(i * 1.7 + seed * 2) * 1.1)
  const STATS = [
    { label: "Revenue", value: "$48.2k", delta: "+12.4%", up: true, color: "green" as DitherColor, data: trend(1, 0.35) },
    { label: "Active users", value: "8,110", delta: "+3.2%", up: true, color: "blue" as DitherColor, data: trend(2, 0.2) },
    { label: "Error rate", value: "0.42%", delta: "\u22128.1%", up: false, color: "red" as DitherColor, data: trend(3, -0.18).map((v) => v + 8) },
  ]

  // Tiny single-series sets for the variant galleries.
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
  const wave = Array.from({ length: 20 }, (_, i) => 5 + Math.sin(i * 0.6) * 2.2 + Math.sin(i * 1.4) * 1)

  const VARIANTS: ButtonVariant[] = ["gradient", "dotted", "hatched", "solid"]
  const DOT_VARIANTS: DotVariant[] = ["border", "colored-border", "filled"]
  const SEEDS = [7, 1984, 4242, 90210, 31337]

  // Variant galleries drive the main preview: picking one swaps the prop and
  // bumps the chart's replay token, so the kit's own dither entrance IS the
  // transition — no CSS theatre required.
  let picked = $state<{
    area: ButtonVariant | number
    bar: ButtonVariant | number
    pie: ButtonVariant | number
    dot: DotVariant
  }>({ area: "gradient", bar: "gradient", pie: "gradient", dot: "border" })
  let galleryReplay = $state({ area: 0, bar: 0, pie: 0, line: 0 })

  function pick(section: "area" | "bar" | "pie", v: ButtonVariant | number) {
    picked[section] = v
    galleryReplay[section]++
  }
  function pickDot(v: DotVariant) {
    picked.dot = v
    galleryReplay.line++
  }
  // Seed-generative textures: one integer, one deterministic texture.
  const randomSeed = () => pick("area", Math.floor(Math.random() * 1_000_000))
  const customSeed = $derived(
    typeof picked.area === "number" && !SEEDS.includes(picked.area) ? picked.area : null
  )

  const thumbClass = (active: boolean) =>
    `rounded-md p-2 text-left transition-colors ${active ? "bg-card" : "hover:bg-card/50"}`
  const thumbLabel = (active: boolean) =>
    `mt-2 text-center text-[10px] transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`

  const SNIPPETS = {
    area: `const rows = [{ month: "Jan", revenue: 42, expenses: 31 }, …]
const config = {
  revenue:  { label: "Revenue",  color: "blue" },
  expenses: { label: "Expenses", color: "purple" },
}

<AreaChart data={rows} {config} stackType="stacked">
  <Grid horizontal />
  <XAxis dataKey="month" maxTicks={6} />
  <YAxis tickCount={4} />
  <Area dataKey="expenses" variant="dotted" />
  <Area dataKey="revenue" variant="gradient" />
  <Legend align="right" />
  <Tooltip labelKey="month" />
</AreaChart>`,
    line: `<LineChart data={rows} {config}>
  <Grid horizontal />
  <XAxis dataKey="month" maxTicks={6} />
  <Line dataKey="revenue">
    <Dot variant="border" r={2} />
  </Line>
  <Line dataKey="expenses" />
  <Legend align="right" />
  <Tooltip labelKey="month" />
</LineChart>`,
    bar: `<BarChart data={trafficRows} config={trafficConfig}>
  <Grid horizontal />
  <XAxis dataKey="month" />
  <YAxis tickCount={4} />
  <Bar dataKey="organic" />
  <Bar dataKey="paid" />
  <Legend align="right" />
  <Tooltip labelKey="month" />
</BarChart>`,
    pie: `<PieChart data={pieRows} config={pieConfig}
  dataKey="value" nameKey="name" innerRadius={0.55}>
  <Pie variant="gradient" />
  <Legend align="center" />
</PieChart>`,
    sparkline: `<div class="rounded-lg border p-4">
  <div class="text-xs text-muted-foreground">Revenue</div>
  <div class="flex items-baseline gap-2">
    <span class="text-lg tabular-nums">$48.2k</span>
    <span class="text-xs text-green-400">+12.4%</span>
  </div>
  <Sparkline data={last24h} color="green" class="mt-3 h-8 w-full" />
</div>`,
  }

  // Code tabs mirror the picked variant — what you see is what you copy.
  const areaCode = $derived(
    SNIPPETS.area.replace(
      'dataKey="revenue" variant="gradient"',
      typeof picked.area === "number"
        ? `dataKey="revenue" variant={${picked.area}}  <!-- a seed — deterministic -->`
        : `dataKey="revenue" variant="${picked.area}"`
    )
  )
  const lineCode = $derived(SNIPPETS.line.replace('variant="border"', `variant="${picked.dot}"`))
  const barCode = $derived(
    SNIPPETS.bar
      .replace('<Bar dataKey="organic" />', `<Bar dataKey="organic" variant="${picked.bar}" />`)
      .replace('<Bar dataKey="paid" />', `<Bar dataKey="paid" variant="${picked.bar}" />`)
  )
  const pieCode = $derived(SNIPPETS.pie.replace('variant="gradient"', `variant="${picked.pie}"`))

  const cartesianRows = [
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
    { prop: "precompiled", type: "string | { src; width?; height? } — packaged plot URL", default: "undefined" },
    { prop: "defaultSelectedDataKey", type: "string | null", default: "null" },
    { prop: "onHoverChange", type: "(index: number | null) => void", default: "undefined" },
    { prop: "onSelectionChange", type: "(key: string | null) => void", default: "undefined" },
    { prop: "variant (series)", type: "name | TextureConfig | number (seed)", default: '"gradient"' },
  ]
  const pieRowsApi = [
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
    { prop: "precompiled", type: "string | { src; width?; height? } — packaged plot URL", default: "undefined" },
    { prop: "defaultSelectedDataKey", type: "string | null", default: "null" },
    { prop: "onSelectionChange", type: "(key: string | null) => void", default: "undefined" },
  ]
  const sparklineRows = [
    { prop: "data", type: "number[]", default: "—" },
    { prop: "color", type: "DitherColor", default: "—" },
    { prop: "variant", type: '"gradient" | "dotted" | "hatched" | "solid"', default: '"gradient"' },
    { prop: "markerIndex", type: "number | null", default: "null" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura"', default: '"off"' },
    { prop: "animate", type: "boolean", default: "false" },
  ]
</script>

<!-- Area -->
<section id="area" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Area Chart</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Revenue against expenses, stacked. Hover for the tooltip; click a legend
    entry to isolate a series.
  </p>
  <DemoCard code={areaCode}>
    <div class="h-64">
      <AreaChart data={rows} {config} stackType="stacked" replayToken={galleryReplay.area}>
        <Grid horizontal />
        <XAxis dataKey="month" maxTicks={6} />
        <YAxis tickCount={4} />
        <Area dataKey="expenses" variant="dotted" />
        <Area dataKey="revenue" variant={picked.area} />
        <Legend align="right" isClickable />
        <Tooltip labelKey="month" />
      </AreaChart>
    </div>
  </DemoCard>
  <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">variants</h3>
  <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
    {#each VARIANTS as v (v)}
      <button type="button" aria-pressed={picked.area === v} class={thumbClass(picked.area === v)} onclick={() => pick("area", v)}>
        <Sparkline data={wave} color="blue" variant={v} class="pointer-events-none h-14 w-full" />
        <div class={thumbLabel(picked.area === v)}>{v}</div>
      </button>
    {/each}
  </div>
  <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">seed-generative</h3>
  <p class="mt-2 text-[12px] leading-relaxed text-muted-foreground">
    A number is a seed: the same deterministic idea as the avatar, applied to
    texture. <code class="text-foreground/80">variant={"{1984}"}</code>
    renders the same fill on every chart, forever.
  </p>
  <div class="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
    {#each SEEDS as s (s)}
      <button type="button" aria-pressed={picked.area === s} class={thumbClass(picked.area === s)} onclick={() => pick("area", s)}>
        <Sparkline data={wave} color="blue" variant={s} class="pointer-events-none h-14 w-full" />
        <div class="{thumbLabel(picked.area === s)} tabular-nums">{s}</div>
      </button>
    {/each}
    <button type="button" class="{thumbClass(customSeed !== null)} grid content-center" onclick={randomSeed}>
      <div class="text-center text-[13px] text-muted-foreground" aria-hidden="true">~</div>
      <div class="{thumbLabel(customSeed !== null)} tabular-nums">
        {customSeed !== null ? customSeed : "random"}
      </div>
    </button>
  </div>
  <PropsTable rows={cartesianRows} />
</section>

<!-- Line -->
<section id="line" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Line Chart</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Bright series lines with sparkles on the live edge; nest a
    <code class="text-foreground/80">Dot</code> inside a line for markers.
  </p>
  <DemoCard code={lineCode}>
    <div class="h-64">
      <LineChart data={rows} {config} replayToken={galleryReplay.line}>
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
  <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">dot variants</h3>
  <div class="mt-2 grid grid-cols-3 gap-2">
    {#each DOT_VARIANTS as d (d)}
      <button type="button" aria-pressed={picked.dot === d} class={thumbClass(picked.dot === d)} onclick={() => pickDot(d)}>
        <div class="pointer-events-none h-20">
          <LineChart data={miniRows} config={miniConfig} interactive={false} margins={{ top: 6, right: 6, bottom: 6, left: 6 }}>
            <Line dataKey="v">
              <Dot variant={d} r={2.5} />
            </Line>
          </LineChart>
        </div>
        <div class={thumbLabel(picked.dot === d)}>{d}</div>
      </button>
    {/each}
  </div>
  <PropsTable rows={cartesianRows} />
</section>

<!-- Bar -->
<section id="bar" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Bar Chart</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Organic vs paid traffic, grouped. Set
    <code class="text-foreground/80">stackType</code> to stacked or percent to
    pile the columns.
  </p>
  <DemoCard code={barCode}>
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
  <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">variants</h3>
  <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
    {#each VARIANTS as v (v)}
      <button type="button" aria-pressed={picked.bar === v} class={thumbClass(picked.bar === v)} onclick={() => pick("bar", v)}>
        <div class="pointer-events-none h-20">
          <BarChart data={miniRows} config={miniConfig} interactive={false} margins={{ top: 6, right: 6, bottom: 6, left: 6 }}>
            <Bar dataKey="v" variant={v} />
          </BarChart>
        </div>
        <div class={thumbLabel(picked.bar === v)}>{v}</div>
      </button>
    {/each}
  </div>
  <PropsTable rows={cartesianRows} />
</section>

<!-- Pie -->
<section id="pie" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Pie Chart</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Browser share as a donut — click a slice or legend entry to isolate it.
  </p>
  <DemoCard code={pieCode}>
    <div class="h-64">
      <PieChart data={pieRows} config={pieConfig} dataKey="value" nameKey="name" innerRadius={0.55} replayToken={galleryReplay.pie}>
        <Pie variant={picked.pie} />
        <Legend align="center" isClickable />
      </PieChart>
    </div>
  </DemoCard>
  <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">variants</h3>
  <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
    {#each VARIANTS as v (v)}
      <button type="button" aria-pressed={picked.pie === v} class={thumbClass(picked.pie === v)} onclick={() => pick("pie", v)}>
        <div class="pointer-events-none h-24">
          <PieChart data={miniPieRows} config={miniPieConfig} dataKey="value" nameKey="name" innerRadius={0.5}>
            <Pie variant={v} />
          </PieChart>
        </div>
        <div class={thumbLabel(picked.pie === v)}>{v}</div>
      </button>
    {/each}
  </div>
  <PropsTable rows={pieRowsApi} />
</section>

<!-- Sparkline -->
<section id="sparkline" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Sparkline</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A plain numeric series with zero margins — built for stat cards, table cells
    and dashboard rows.
  </p>
  <DemoCard code={SNIPPETS.sparkline}>
    <div class="grid gap-4 sm:grid-cols-3">
      {#each STATS as s (s.label)}
        <div class="rounded-lg border border-border/60 p-4">
          <div class="text-[11px] text-muted-foreground">{s.label}</div>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-lg tracking-tight tabular-nums">{s.value}</span>
            <span class="text-[11px] tabular-nums" style:color={cssColor(s.up ? "green" : "red")}>{s.delta}</span>
          </div>
          <Sparkline data={s.data} color={s.color} class="mt-3 h-8 w-full" />
        </div>
      {/each}
    </div>
  </DemoCard>
  <PropsTable rows={sparklineRows} />
</section>
