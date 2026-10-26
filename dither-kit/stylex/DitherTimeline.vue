<!-- Generated from ../tailwind/DitherTimeline.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { rgb } from "../engine/palette"
import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"
import * as stylex from "@stylexjs/stylex"

export type TimelineItem = {
  title: string
  time?: string
  body?: string
  color?: PixelColor
}

const CELL = 2

/** A small dithered filled dot — dense core fading at the rim through Bayer. */
function paintDot(ctx: CanvasRenderingContext2D, cells: number, color: PixelColor): void {
  ctx.clearRect(0, 0, cells, cells)
  const c = cells / 2
  const fill = fillOf(color)
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const r = Math.hypot(x + 0.5 - c, y + 0.5 - c) / c // 0 center → 1 rim
      const density = 1 - r
      if (density <= 0 || density <= BAYER4[y & 3][x & 3]) continue
      ctx.fillStyle = rgb(fill, 1, 0.5 + 0.5 * density)
      ctx.fillRect(x, y, 1, 1)
    }
  }
}

const styles = stylex.create({
  ol: { position: "relative", display: "flex", flexDirection: "column" },
  li: {
    position: "relative",
    display: "flex",
    gap: "0.75rem",
    paddingBottom: { default: "1.25rem", ":last-child": "0px" },
  },
  stack: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center" },
  text: { marginTop: "0.25rem", width: "1px", flex: "1", backgroundColor: "var(--border)" },
  box: { flex: "1", paddingTop: "1px" },
  row: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem" },
  p: { fontSize: "13px", color: "var(--foreground)" },
  text2: {
    flexShrink: "0",
    fontSize: "11px",
    color: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)",
    fontVariantNumeric: "   tabular-nums ",
  },
  p2: { marginTop: "0.125rem", fontSize: "12px", lineHeight: "1.625", color: "var(--muted-foreground)" },
})
</script>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    items: TimelineItem[]
    dotSize?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { dotSize: 12 },
)

const dots = ref<HTMLCanvasElement[]>([])

onMounted(() => {
  const cells = Math.max(4, Math.round(props.dotSize / CELL))
  dots.value.forEach((canvas, i) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    canvas.width = cells
    canvas.height = cells
    paintDot(ctx, cells, props.items[i]?.color ?? "blue")
  })
})
</script>

<template>
  <ol :class="cn(styles.ol, props.xstyle, props.class)">
    <li v-for="(it, i) in items" :key="i" v-bind="stylex.attrs(styles.li)">
      <!-- rail: dot + connecting line down to the next item -->
      <div v-bind="stylex.attrs(styles.stack)">
        <canvas
          :ref="
            (el) => {
              if (el) dots[i] = el as HTMLCanvasElement
            }
          "
          aria-hidden="true"
          :style="{ width: `${props.dotSize}px`, height: `${props.dotSize}px`, imageRendering: 'pixelated' }"
        />
        <span v-if="i < items.length - 1" aria-hidden="true" v-bind="stylex.attrs(styles.text)" />
      </div>
      <div v-bind="stylex.attrs(styles.box)">
        <div v-bind="stylex.attrs(styles.row)">
          <p v-bind="stylex.attrs(styles.p)">{{ it.title }}</p>
          <span v-if="it.time" v-bind="stylex.attrs(styles.text2)">{{ it.time }}</span>
        </div>
        <p v-if="it.body" v-bind="stylex.attrs(styles.p2)">
          {{ it.body }}
        </p>
      </div>
    </li>
  </ol>
</template>
