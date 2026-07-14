import {
  activeRows,
  chartData,
  config as configRef,
  familyOf,
  studio,
} from "./store"

const ROOT: Record<string, string> = {
  area: "AreaChart",
  line: "LineChart",
  bar: "BarChart",
  pie: "PieChart",
  radar: "RadarChart",
}
const SERIES: Record<string, string> = {
  area: "Area",
  line: "Line",
  bar: "Bar",
  pie: "Pie",
  radar: "Radar",
}

const q = (s: string) => `"${s}"`

function dataLiteral(): string {
  const rows = chartData.value as Record<string, unknown>[]
  const keys =
    studio.type === "pie"
      ? ["name", "value"]
      : [
          familyOf(studio.type) === "radar" ? "axis" : "month",
          ...activeRows.value.map((r) => r.key),
        ]
  const lines = rows.map((row) => {
    const pairs = keys.map((k) =>
      typeof row[k] === "string" ? `${k}: ${q(row[k] as string)}` : `${k}: ${row[k]}`
    )
    return `  { ${pairs.join(", ")} },`
  })
  return `const data = [\n${lines.join("\n")}\n]`
}

function configLiteral(): string {
  const entries = Object.entries(configRef.value).map(
    ([k, v]) => `  ${k}: { label: ${q(v.label ?? k)}, color: ${q(v.color)} },`
  )
  return `const config: ChartConfig = {\n${entries.join("\n")}\n}`
}

/** Full runnable SFC for the built chart. */
export function studioCode(): string {
  const family = familyOf(studio.type)
  const root = ROOT[studio.type]
  const series = SERIES[studio.type]
  const p = studio.parts

  const cartesianParts = family === "cartesian"
  const partImports: string[] = []
  if (cartesianParts && p.grid) partImports.push("Grid")
  if (cartesianParts && p.xAxis) partImports.push("XAxis")
  if (cartesianParts && p.yAxis) partImports.push("YAxis")
  if (p.legend) partImports.push("Legend")
  if (p.tooltip) partImports.push("Tooltip")

  const imports = [root, series, ...partImports]
  const importLine = `import { ${imports.join(", ")} } from "@/components/dither-kit"`

  // Root attributes.
  const attrs: string[] = []
  if (studio.type === "pie") {
    attrs.push(`data-key="value"`, `name-key="name"`)
    if (studio.innerRadius > 0) attrs.push(`:inner-radius="${studio.innerRadius}"`)
  } else if (family === "radar") {
    attrs.push(`name-key="axis"`)
  }
  if ((family === "cartesian") && studio.stackType !== "default")
    attrs.push(`stack-type="${studio.stackType}"`)
  if (studio.bloom !== "off") attrs.push(`bloom="${studio.bloom}"`)
  if (!studio.animate) attrs.push(`:animate="false"`)
  if (family !== "pie" && family !== "radar" && !studio.interactive)
    attrs.push(`:interactive="false"`)
  const rootOpen = attrs.length
    ? `<${root} :data="data" :config="config" ${attrs.join(" ")}>`
    : `<${root} :data="data" :config="config">`

  // Children.
  const variantAttr = studio.variant !== "gradient" ? ` variant="${studio.variant}"` : ""
  const kids: string[] = []
  if (cartesianParts && p.grid) kids.push(`  <Grid />`)
  if (cartesianParts && p.xAxis) kids.push(`  <XAxis dataKey="month" />`)
  if (cartesianParts && p.yAxis) kids.push(`  <YAxis />`)
  if (studio.type === "pie") {
    kids.push(`  <Pie${variantAttr} />`)
  } else {
    for (const r of activeRows.value)
      kids.push(`  <${series} dataKey="${r.key}"${variantAttr} is-clickable />`)
  }
  if (p.legend)
    kids.push(family === "cartesian" ? `  <Legend is-clickable />` : `  <Legend align="center" is-clickable />`)
  if (p.tooltip) {
    const label = family === "cartesian" ? ` labelKey="month"` : ""
    kids.push(`  <Tooltip${label} />`)
  }

  const template = `<template>
  <div class="h-80">
    ${rootOpen}
${kids.map((k) => `    ${k}`).join("\n")}
    </${root}>
  </div>
</template>`

  return `<script setup lang="ts">
${importLine}
import type { ChartConfig } from "@/components/dither-kit"

${dataLiteral()}

${configLiteral()}
</script>

${template}`
}
