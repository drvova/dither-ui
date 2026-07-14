import { familyOf } from "@/shared/config"
import { LABEL_KEY } from "./data"
import { activeSeries, dataOf } from "./derive"
import type { ChartModel } from "./types"

const ROOT: Record<string, string> = { area: "AreaChart", line: "LineChart", bar: "BarChart", pie: "PieChart", radar: "RadarChart" }
const SERIES: Record<string, string> = { area: "Area", line: "Line", bar: "Bar", pie: "Pie", radar: "Radar" }
const DEFAULT_MARGINS = { top: 10, right: 12, bottom: 22, left: 36 }
const q = (s: string) => `"${s}"`

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
  const imports = [root, series, ...parts].join(", ")

  const m = chart.margins
  const marginsChanged = (["top", "right", "bottom", "left"] as const).some((k) => m[k] !== DEFAULT_MARGINS[k])

  const attrs: string[] = []
  if (chart.type === "pie") {
    attrs.push(`data-key="value"`, `name-key="name"`, `:inner-radius="${chart.innerRadius}"`)
  } else if (fam === "radar") attrs.push(`name-key="axis"`)
  if (marginsChanged) attrs.push(`:margins="{ top: ${m.top}, right: ${m.right}, bottom: ${m.bottom}, left: ${m.left} }"`)
  if (cart && chart.stackType !== "default") attrs.push(`stack-type="${chart.stackType}"`)
  if (chart.bloom !== "off") attrs.push(`bloom="${chart.bloom}"`)
  if (chart.animationDuration !== 900) attrs.push(`:animation-duration="${chart.animationDuration}"`)
  if (!chart.animate) attrs.push(`:animate="false"`)
  if (cart && !chart.interactive) attrs.push(`:interactive="false"`)

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
    kids.push(`<Pie${v !== "gradient" ? ` variant="${v}"` : ""} />`)
  } else {
    for (const s of activeSeries(chart)) {
      const sa = [`dataKey="${s.key}"`]
      if (s.variant !== "gradient") sa.push(`variant="${s.variant}"`)
      if (s.isClickable) sa.push(`is-clickable`)
      kids.push(`<${series} ${sa.join(" ")} />`)
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
