// The Solid twin of the Vue site's `src/entities/chart/model/codegen.ts`: a
// chart frame as a Solid component file (`.tsx`) on the kit's Solid layer.
import { LABEL_KEY } from "@/entities/chart/model/data"
import { activeSeries, dataOf } from "@/entities/chart/model/derive"
import { defaultEasing } from "@/entities/chart/model/factory"
import type { ChartModel } from "@/entities/chart/model/types"
import { familyOf } from "@/shared/config"
import { componentFile, js, key, prop } from "../../../shared/lib/sfc"

const ROOT: Record<string, string> = {
  area: "AreaChart",
  line: "LineChart",
  bar: "BarChart",
  pie: "PieChart",
  radar: "RadarChart",
}
const SERIES: Record<string, string> = { area: "Area", line: "Line", bar: "Bar", pie: "Pie", radar: "Radar" }
const DEFAULT_MARGINS = { top: 10, right: 12, bottom: 22, left: 36 }

// Every document value reaches the file through `shared/lib/sfc`: rows,
// labels and keys as JS literals, every prop through `prop`.

function dataLiteral(chart: ChartModel): string {
  const fam = familyOf(chart.type)
  const rows = dataOf(chart) as Record<string, unknown>[]
  const keys = fam === "pie" ? ["name", "value"] : [LABEL_KEY[fam], ...activeSeries(chart).map((s) => s.key)]
  const body = rows.map((row) => `  { ${keys.map((k) => `${key(k)}: ${js(row[k])}`).join(", ")} },`).join("\n")
  return `const data = [\n${body}\n]`
}

function configLiteral(chart: ChartModel): string {
  const entries = activeSeries(chart).map((s) => `  ${key(s.key)}: { label: ${js(s.label)}, color: ${js(s.color)} },`)
  return `const config: ChartConfig = {\n${entries.join("\n")}\n}`
}

const tag = (name: string, attrs: string[], close = " />"): string =>
  `<${name}${attrs.length ? ` ${attrs.join(" ")}` : ""}${close}`

export function chartCode(chart: ChartModel): string {
  const fam = familyOf(chart.type)
  const root = ROOT[chart.type]
  const series = SERIES[chart.type]
  const g = chart.grid,
    x = chart.xAxis,
    yx = chart.yAxis,
    lg = chart.legend,
    tt = chart.tooltip
  const cart = fam === "cartesian"

  const parts: string[] = []
  if (cart && g.on) parts.push("Grid")
  if (cart && x.on) parts.push("XAxis")
  if (cart && yx.on) parts.push("YAxis")
  if (lg.on) parts.push("Legend")
  if (tt.on) parts.push("Tooltip")
  if (cart && activeSeries(chart).some((s) => s.dots.on)) parts.push("Dot")
  if (cart && activeSeries(chart).some((s) => s.activeDot.on)) parts.push("ActiveDot")

  const m = chart.margins
  const marginsChanged = (["top", "right", "bottom", "left"] as const).some((k) => m[k] !== DEFAULT_MARGINS[k])

  const attrs: string[] = []
  if (chart.type === "pie") {
    attrs.push(`dataKey="value"`, `nameKey="name"`, prop("innerRadius", chart.innerRadius))
  } else if (fam === "radar") attrs.push(`nameKey="axis"`)
  if (marginsChanged) attrs.push(prop("margins", { top: m.top, right: m.right, bottom: m.bottom, left: m.left }))
  if (cart && chart.stackType !== "default") attrs.push(prop("stackType", chart.stackType))
  if (chart.bloom !== "off") attrs.push(prop("bloom", chart.bloom))
  if (Number.isFinite(chart.seed)) attrs.push(prop("seed", chart.seed))
  if (cart && Number.isFinite(chart.effect)) attrs.push(prop("effect", chart.effect))
  if (chart.animationDuration !== 900) attrs.push(prop("animationDuration", chart.animationDuration))
  if (chart.animationDelay > 0) attrs.push(prop("animationDelay", chart.animationDelay))
  if (Array.isArray(chart.easing) || chart.easing !== defaultEasing(chart.type))
    attrs.push(prop("easing", chart.easing))
  if ((chart.type === "area" || chart.type === "line") && !chart.sparkles) attrs.push(prop("sparkles", false))
  if (!chart.hoverLift) attrs.push(prop("hoverLift", false))
  if (chart.type === "bar" && chart.stagger !== 0.55) attrs.push(prop("stagger", chart.stagger))
  if (!chart.animate) attrs.push(prop("animate", false))
  if (cart && !chart.interactive) attrs.push(prop("interactive", false))
  if (chart.cell !== 2) attrs.push(prop("cell", chart.cell))
  if ((chart.type === "area" || chart.type === "line") && chart.sparkles) {
    if (chart.sparkleDensity !== 1) attrs.push(prop("sparkleDensity", chart.sparkleDensity))
    if (chart.sparkleSpeed !== 1) attrs.push(prop("sparkleSpeed", chart.sparkleSpeed))
  }
  if (chart.type === "bar" && chart.barGap !== 0.28) attrs.push(prop("barGap", chart.barGap))
  if (chart.type === "line" && chart.glowSize !== 0.16) attrs.push(prop("glowSize", chart.glowSize))
  if (chart.type === "pie") {
    if (chart.popOut !== 6) attrs.push(prop("popOut", chart.popOut))
    if (chart.rimWidth !== 1.4) attrs.push(prop("rimWidth", chart.rimWidth))
  }
  if (chart.type === "radar" && chart.falloff !== 0.45) attrs.push(prop("falloff", chart.falloff))
  if (chart.type === "bar" && chart.barEdge !== 0.18) attrs.push(prop("barEdge", chart.barEdge))
  if (chart.hoverLift && chart.hoverStrength !== 1) attrs.push(prop("hoverStrength", chart.hoverStrength))
  if (chart.dimOpacity !== 0.3) attrs.push(prop("dimOpacity", chart.dimOpacity))
  if (cart && !chart.crosshair) attrs.push(prop("crosshair", false))
  if (chart.type === "pie" && chart.startAngle !== 0) attrs.push(prop("startAngle", chart.startAngle))
  if (chart.type === "radar" && chart.radarRings !== 4) attrs.push(prop("rings", chart.radarRings))

  const openTag =
    attrs.length <= 2
      ? tag(root, ["data={data}", "config={config}", ...attrs], ">")
      : `<${root}\n    data={data}\n    config={config}\n${attrs.map((a) => `    ${a}`).join("\n")}\n  >`

  const kids: string[] = []
  if (cart && g.on) {
    const ga: string[] = []
    if (!g.horizontal) ga.push(prop("horizontal", false))
    if (g.vertical) ga.push(prop("vertical", true))
    if (g.dash !== "3 3") ga.push(prop("strokeDasharray", g.dash))
    if (g.tickCount !== 4) ga.push(prop("tickCount", g.tickCount))
    kids.push(tag("Grid", ga))
  }
  if (cart && x.on) {
    const xa = [`dataKey="${LABEL_KEY.cartesian}"`]
    if (x.tickMargin !== 8) xa.push(prop("tickMargin", x.tickMargin))
    if (x.maxTicks !== 8) xa.push(prop("maxTicks", x.maxTicks))
    kids.push(tag("XAxis", xa))
  }
  if (cart && yx.on) {
    const ya: string[] = []
    if (yx.tickCount !== 4) ya.push(prop("tickCount", yx.tickCount))
    if (yx.tickMargin !== 8) ya.push(prop("tickMargin", yx.tickMargin))
    kids.push(tag("YAxis", ya))
  }
  if (chart.type === "pie") {
    const v = chart.series[0]?.variant ?? "gradient"
    kids.push(tag("Pie", v !== "gradient" ? [prop("variant", v)] : []))
  } else {
    for (const s of activeSeries(chart)) {
      const sa = [prop("dataKey", s.key)]
      if (s.variant !== "gradient") sa.push(prop("variant", s.variant))
      // Only a cartesian series is picked by a click: the radar's takes no such prop.
      if (cart && s.isClickable) sa.push(prop("isClickable", true))
      if (cart && s.opacity !== 1) sa.push(prop("opacity", s.opacity))
      const markers: string[] = []
      if (cart && s.dots.on) {
        const da: string[] = []
        if (s.dots.variant !== "border") da.push(prop("variant", s.dots.variant))
        if (s.dots.r !== 2) da.push(prop("r", s.dots.r))
        markers.push(`  ${tag("Dot", da)}`)
      }
      if (cart && s.activeDot.on) {
        const da: string[] = []
        if (s.activeDot.variant !== "colored-border") da.push(prop("variant", s.activeDot.variant))
        if (s.activeDot.r !== 3) da.push(prop("r", s.activeDot.r))
        markers.push(`  ${tag("ActiveDot", da)}`)
      }
      if (markers.length) kids.push(tag(series, sa, ">"), ...markers, `</${series}>`)
      else kids.push(tag(series, sa))
    }
  }
  if (lg.on) {
    const la: string[] = []
    if (lg.align !== (cart ? "right" : "center")) la.push(prop("align", lg.align))
    if (lg.clickable) la.push(prop("isClickable", true))
    kids.push(tag("Legend", la))
  }
  if (tt.on) {
    const ta: string[] = []
    if (cart) ta.push(`labelKey="${LABEL_KEY.cartesian}"`)
    if (tt.variant !== "default") ta.push(prop("variant", tt.variant))
    kids.push(tag("Tooltip", ta))
  }

  const body = kids.map((k) => `    ${k}`).join("\n")
  return componentFile({
    kit: [root, series, ...parts],
    types: ["ChartConfig"],
    module: [dataLiteral(chart), configLiteral(chart)],
    view: `<div class="h-80">\n  ${openTag}\n${body}\n  </${root}>\n</div>`,
  })
}
