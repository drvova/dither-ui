import { familyOf } from "@/shared/config"
import { LABEL_KEY } from "./data"
import { activeSeries, dataOf } from "./derive"
import { defaultEasing } from "./factory"
import type { ChartModel } from "./types"

const ROOT: Record<string, string> = { area: "AreaChart", line: "LineChart", bar: "BarChart", pie: "PieChart", radar: "RadarChart" }
const SERIES: Record<string, string> = { area: "Area", line: "Line", bar: "Bar", pie: "Pie", radar: "Radar" }
const DEFAULT_MARGINS = { top: 10, right: 12, bottom: 22, left: 36 }
const q = (s: string) => `"${s}"`
/** { blur: 5, opacity: 0.8 } — a JS object literal for a bound attribute. */
const objLit = (o: Record<string, unknown>) =>
  `{ ${Object.entries(o)
    .map(([k, v]) => `${k}: ${typeof v === "string" ? q(v) : v}`)
    .join(", ")} }`

function dataLiteral(chart: ChartModel): string {
  const fam = familyOf(chart.type)
  const rows = dataOf(chart) as Record<string, unknown>[]
  const keys =
    fam === "pie" ? ["name", "value"] : [LABEL_KEY[fam], ...activeSeries(chart).map((s) => s.key)]
  const body = rows
    .map((row) => `  { ${keys.map((k) => (typeof row[k] === "string" ? `${k}: ${q(row[k] as string)}` : `${k}: ${row[k]}`)).join(", ")} },`)
    .join("\n")
  return `const data = [\n${body}\n]`
}

function configLiteral(chart: ChartModel): string {
  const entries = activeSeries(chart).map((s) => {
    const color = typeof s.color === "number" ? String(s.color) : q(s.color)
    return `  ${s.key}: { label: ${q(s.label)}, color: ${color} },`
  })
  return `const config: ChartConfig = {\n${entries.join("\n")}\n}`
}

export function chartCode(chart: ChartModel): string {
  const fam = familyOf(chart.type)
  const root = ROOT[chart.type]
  const series = SERIES[chart.type]
  const g = chart.grid, x = chart.xAxis, yx = chart.yAxis, lg = chart.legend, tt = chart.tooltip
  const cart = fam === "cartesian"

  const parts: string[] = []
  if (cart && g.on) parts.push("Grid")
  if (cart && x.on) parts.push("XAxis")
  if (cart && yx.on) parts.push("YAxis")
  if (lg.on) parts.push("Legend")
  if (tt.on) parts.push("Tooltip")
  if (cart && activeSeries(chart).some((s) => s.dots.on)) parts.push("Dot")
  if (cart && activeSeries(chart).some((s) => s.activeDot.on)) parts.push("ActiveDot")
  const imports = [root, series, ...parts].join(", ")

  const m = chart.margins
  const marginsChanged = (["top", "right", "bottom", "left"] as const).some((k) => m[k] !== DEFAULT_MARGINS[k])

  const attrs: string[] = []
  if (chart.type === "pie") {
    attrs.push(`data-key="value"`, `name-key="name"`, `:inner-radius="${chart.innerRadius}"`)
  } else if (fam === "radar") attrs.push(`name-key="axis"`)
  if (marginsChanged) attrs.push(`:margins="{ top: ${m.top}, right: ${m.right}, bottom: ${m.bottom}, left: ${m.left} }"`)
  if (cart && chart.stackType !== "default") attrs.push(`stack-type="${chart.stackType}"`)
  if (typeof chart.bloom === "object")
    attrs.push(`:bloom="${objLit(chart.bloom as Record<string, unknown>)}"`)
  else if (chart.bloom !== "off") attrs.push(`bloom="${chart.bloom}"`)
  if (chart.seed !== undefined) attrs.push(`:seed="${chart.seed}"`)
  if (cart && chart.effect !== undefined) attrs.push(`:effect="${chart.effect}"`)
  if (chart.animationDuration !== 900) attrs.push(`:animation-duration="${chart.animationDuration}"`)
  if (chart.animationDelay > 0) attrs.push(`:animation-delay="${chart.animationDelay}"`)
  if (Array.isArray(chart.easing))
    attrs.push(`:easing="[${chart.easing.join(', ')}]"`)
  else if (chart.easing !== defaultEasing(chart.type))
    attrs.push(`easing="${chart.easing}"`)
  if ((chart.type === "area" || chart.type === "line") && !chart.sparkles)
    attrs.push(`:sparkles="false"`)
  if (!chart.hoverLift) attrs.push(`:hover-lift="false"`)
  if (chart.type === "bar" && chart.stagger !== 0.55)
    attrs.push(`:stagger="${chart.stagger}"`)
  if (!chart.animate) attrs.push(`:animate="false"`)
  if (cart && !chart.interactive) attrs.push(`:interactive="false"`)
  if (chart.cell !== 2) attrs.push(`:cell="${chart.cell}"`)
  if ((chart.type === "area" || chart.type === "line") && chart.sparkles) {
    if (chart.sparkleDensity !== 1) attrs.push(`:sparkle-density="${chart.sparkleDensity}"`)
    if (chart.sparkleSpeed !== 1) attrs.push(`:sparkle-speed="${chart.sparkleSpeed}"`)
  }
  if (chart.type === "bar" && chart.barGap !== 0.28) attrs.push(`:bar-gap="${chart.barGap}"`)
  if (chart.type === "line" && chart.glowSize !== 0.16) attrs.push(`:glow-size="${chart.glowSize}"`)
  if (chart.type === "pie") {
    if (chart.popOut !== 6) attrs.push(`:pop-out="${chart.popOut}"`)
    if (chart.rimWidth !== 1.4) attrs.push(`:rim-width="${chart.rimWidth}"`)
  }
  if (chart.type === "radar" && chart.falloff !== 0.45) attrs.push(`:falloff="${chart.falloff}"`)
  if (chart.type === "bar" && chart.barEdge !== 0.18) attrs.push(`:bar-edge="${chart.barEdge}"`)
  if (chart.hoverLift && chart.hoverStrength !== 1) attrs.push(`:hover-strength="${chart.hoverStrength}"`)
  if (chart.dimOpacity !== 0.3) attrs.push(`:dim-opacity="${chart.dimOpacity}"`)
  if (cart && !chart.crosshair) attrs.push(`:crosshair="false"`)
  if (chart.type === "pie" && chart.startAngle !== 0) attrs.push(`:start-angle="${chart.startAngle}"`)
  if (chart.type === "radar" && chart.radarRings !== 4) attrs.push(`:rings="${chart.radarRings}"`)

  const openTag =
    attrs.length <= 2
      ? `<${root} :data="data" :config="config"${attrs.length ? " " + attrs.join(" ") : ""}>`
      : `<${root}\n      :data="data"\n      :config="config"\n${attrs.map((a) => `      ${a}`).join("\n")}\n    >`

  const kids: string[] = []
  if (cart && g.on) {
    const ga: string[] = []
    if (!g.horizontal) ga.push(`:horizontal="false"`)
    if (g.vertical) ga.push(`:vertical="true"`)
    if (g.dash !== "3 3") ga.push(`stroke-dasharray="${g.dash}"`)
    if (g.tickCount !== 4) ga.push(`:tick-count="${g.tickCount}"`)
    kids.push(`<Grid${ga.length ? " " + ga.join(" ") : ""} />`)
  }
  if (cart && x.on) {
    const xa = [`dataKey="${LABEL_KEY.cartesian}"`]
    if (x.tickMargin !== 8) xa.push(`:tick-margin="${x.tickMargin}"`)
    if (x.maxTicks !== 8) xa.push(`:max-ticks="${x.maxTicks}"`)
    kids.push(`<XAxis ${xa.join(" ")} />`)
  }
  if (cart && yx.on) {
    const ya: string[] = []
    if (yx.tickCount !== 4) ya.push(`:tick-count="${yx.tickCount}"`)
    if (yx.tickMargin !== 8) ya.push(`:tick-margin="${yx.tickMargin}"`)
    kids.push(`<YAxis${ya.length ? " " + ya.join(" ") : ""} />`)
  }
  if (chart.type === "pie") {
    const v = chart.series[0]?.variant ?? "gradient"
    const va =
      typeof v === "object"
        ? ` :variant="${objLit(v as Record<string, unknown>)}"`
        : v !== "gradient"
          ? ` variant="${v}"`
          : ""
    kids.push(`<Pie${va} />`)
  } else {
    for (const s of activeSeries(chart)) {
      const sa = [`dataKey="${s.key}"`]
      if (typeof s.variant === "object")
        sa.push(`:variant="${objLit(s.variant as Record<string, unknown>)}"`)
      else if (s.variant !== "gradient") sa.push(`variant="${s.variant}"`)
      if (s.isClickable) sa.push(`is-clickable`)
      if (cart && s.opacity !== 1) sa.push(`:opacity="${s.opacity}"`)
      const markers: string[] = []
      if (cart && s.dots.on) {
        const da = [s.dots.variant !== "border" ? ` variant="${s.dots.variant}"` : "", s.dots.r !== 2 ? ` :r="${s.dots.r}"` : ""].join("")
        markers.push(`  <Dot${da} />`)
      }
      if (cart && s.activeDot.on) {
        const da = [s.activeDot.variant !== "colored-border" ? ` variant="${s.activeDot.variant}"` : "", s.activeDot.r !== 3 ? ` :r="${s.activeDot.r}"` : ""].join("")
        markers.push(`  <ActiveDot${da} />`)
      }
      if (markers.length) {
        kids.push(`<${series} ${sa.join(" ")}>`, ...markers, `</${series}>`)
      } else {
        kids.push(`<${series} ${sa.join(" ")} />`)
      }
    }
  }
  if (lg.on) {
    const la: string[] = []
    if (lg.align !== (cart ? "right" : "center")) la.push(`align="${lg.align}"`)
    if (lg.clickable) la.push(`is-clickable`)
    kids.push(`<Legend${la.length ? " " + la.join(" ") : ""} />`)
  }
  if (tt.on) {
    const ta: string[] = []
    if (cart) ta.push(`labelKey="${LABEL_KEY.cartesian}"`)
    if (tt.variant !== "default") ta.push(`variant="${tt.variant}"`)
    kids.push(`<Tooltip${ta.length ? " " + ta.join(" ") : ""} />`)
  }

  const body = kids.map((k) => `      ${k}`).join("\n")
  return `<script setup lang="ts">
import { ${imports} } from "@/components/dither-kit"
import type { ChartConfig } from "@/components/dither-kit"

${dataLiteral(chart)}

${configLiteral(chart)}
</script>

<template>
  <div class="h-80">
    ${openTag}
${body}
    </${root}>
  </div>
</template>`
}
