import { componentEntry } from "./registry"
import type { PixelBloomInput, WidgetModel } from "./types"

const q = (s: string) => `"${s}"`
const objLit = (o: Record<string, unknown>) =>
  `{ ${Object.entries(o)
    .map(([k, v]) => `${k}: ${typeof v === "string" ? q(v) : v}`)
    .join(", ")} }`

const colorAttr = (name: string, v: unknown): string =>
  typeof v === "number" ? ` :${name}="${v}"` : ` ${name}="${v}"`

function bloomAttr(bloom: PixelBloomInput): string {
  if (bloom === "off") return ""
  if (typeof bloom === "string") return ` bloom="${bloom}"`
  return ` :bloom="${objLit(bloom as unknown as Record<string, unknown>)}"`
}

/** `:prop="..."` for any JSON-serialisable value — arrays/objects inline. */
const boundAttr = (key: string, v: unknown): string => {
  if (typeof v === "string") return `${key}="${v}"`
  if (typeof v === "boolean" || typeof v === "number") return `:${key}="${v}"`
  return `:${key}='${JSON.stringify(v)}'`
}

function componentCode(w: Extract<WidgetModel, { kind: "component" }>): string {
  const entry = componentEntry(w.is)
  const attrs: string[] = []
  if (entry?.vmodel) {
    const v = w.model
    attrs.push(
      typeof v === "string" ? `v-model="value"` : `v-model="value"` // named ref in the snippet
    )
  }
  const mapped = entry?.mapProps ? entry.mapProps(w.props) : w.props
  for (const spec of entry?.props ?? []) {
    const v = mapped[spec.key]
    const raw = w.props[spec.key]
    // emit only non-defaults (compare against the registry default)
    if (JSON.stringify(raw) === JSON.stringify(spec.def)) continue
    attrs.push(boundAttr(spec.key, v))
  }
  const attrStr = attrs.length ? ` ${attrs.join(" ")}` : ""
  const modelSetup = entry?.vmodel
    ? `\nconst value = ref(${JSON.stringify(w.model)})`
    : ""
  const importRef = entry?.vmodel ? `import { ref } from "vue"\n` : ""
  const slot = w.slotText
  return `<script setup lang="ts">
${importRef}import { ${w.is} } from "@dither-kit"${modelSetup}
</script>

<template>
  ${slot != null ? `<${w.is}${attrStr}>${slot}</${w.is}>` : `<${w.is}${attrStr} />`}
</template>`
}

/** A runnable snippet for a standalone widget, reflecting every non-default. */
export function widgetCode(w: WidgetModel, frame: { w: number; h: number }): string {
  if (w.kind === "component") return componentCode(w)
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

  if (w.kind === "image") {
    const attrs: string[] = [`src="${w.src.slice(0, 80)}${w.src.length > 80 ? "…" : ""}"`]
    if (w.alt) attrs.push(`alt="${w.alt}"`)
    if (w.cell !== 3) attrs.push(`:cell="${w.cell}"`)
    if (w.focusY !== 0.5) attrs.push(`:focus-y="${w.focusY}"`)
    if (w.fade !== 0) attrs.push(`:fade="${w.fade}"`)
    return `<script setup lang="ts">
import { DitherImage } from "@dither-kit"
</script>

<template>
  <div class="h-64">
    <DitherImage
${attrs.map((a) => `      ${a}`).join("\n")}
    />
  </div>
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
