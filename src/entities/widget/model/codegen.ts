import type { WidgetModel } from "./types"

const q = (s: string) => `"${s}"`
const objLit = (o: Record<string, unknown>) =>
  `{ ${Object.entries(o)
    .map(([k, v]) => `${k}: ${typeof v === "string" ? q(v) : v}`)
    .join(", ")} }`

const colorAttr = (name: string, v: unknown): string =>
  typeof v === "number" ? ` :${name}="${v}"` : ` ${name}="${v}"`

function bloomAttr(bloom: WidgetModel["bloom"]): string {
  if (bloom === "off") return ""
  if (typeof bloom === "string") return ` bloom="${bloom}"`
  return ` :bloom="${objLit(bloom as unknown as Record<string, unknown>)}"`
}

/** A runnable snippet for a standalone widget, reflecting every non-default. */
export function widgetCode(w: WidgetModel, frame: { w: number; h: number }): string {
  if (w.kind === "avatar") {
    const attrs: string[] = [`name="${w.name}"`, `:size="${Math.round(Math.min(frame.w, frame.h))}"`]
    if (!w.autoColor) attrs.push(colorAttr("color", w.color).trim())
    if (w.mirror !== "auto") attrs.push(`mirror="${w.mirror}"`)
    if (w.grid !== 8) attrs.push(`:grid="${w.grid}"`)
    if (w.cellPx !== 4) attrs.push(`:cell-px="${w.cellPx}"`)
    if (w.density !== 0) attrs.push(`:density="${w.density}"`)
    if (w.offTier !== 0.35) attrs.push(`:off-tier="${w.offTier}"`)
    if (w.bloom !== "off") attrs.push(bloomAttr(w.bloom).trim())
    if (!w.animate) attrs.push(`:animate="false"`)
    if (w.animationDuration !== 600) attrs.push(`:animation-duration="${w.animationDuration}"`)
    return `<script setup lang="ts">
import { DitherAvatar } from "@dither-kit"
</script>

<template>
  <DitherAvatar
${attrs.map((a) => `    ${a}`).join("\n")}
  />
</template>`
  }

  if (w.kind === "button") {
    const attrs: string[] = []
    if (w.color !== "blue") attrs.push(colorAttr("color", w.color).trim())
    if (w.variant !== "gradient") attrs.push(`variant="${w.variant}"`)
    if (w.cell !== 2) attrs.push(`:cell="${w.cell}"`)
    if (w.bloom !== "off") attrs.push(bloomAttr(w.bloom).trim())
    const attrStr = attrs.length ? ` ${attrs.join(" ")}` : ""
    return `<script setup lang="ts">
import { DitherButton } from "@dither-kit"
</script>

<template>
  <DitherButton${attrStr}>${w.label}</DitherButton>
</template>`
  }

  const attrs: string[] = [colorAttr("from", w.from).trim()]
  if (w.twoTone) attrs.push(colorAttr("to", w.to).trim())
  if (w.direction !== "up") attrs.push(`direction="${w.direction}"`)
  if (w.cell !== 3) attrs.push(`:cell="${w.cell}"`)
  if (w.opacity !== 1) attrs.push(`:opacity="${w.opacity}"`)
  if (w.bloom !== "off") attrs.push(bloomAttr(w.bloom).trim())
  return `<script setup lang="ts">
import { DitherGradient } from "@dither-kit"
</script>

<template>
  <!-- Fills its nearest positioned ancestor. -->
  <div class="relative h-64">
    <DitherGradient ${attrs.join(" ")} />
  </div>
</template>`
}
