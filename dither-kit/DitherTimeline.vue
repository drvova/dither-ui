<script lang="ts">
import { rgb } from "./palette"
import { BAYER4, fillOf, type PixelColor } from "./pixel"

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
</script>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    items: TimelineItem[]
    dotSize?: number
    class?: string
  }>(),
  { dotSize: 12 }
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
  <ol :class="cn('relative flex flex-col', props.class)">
    <li v-for="(it, i) in items" :key="i" class="relative flex gap-3 pb-5 last:pb-0">
      <!-- rail: dot + connecting line down to the next item -->
      <div class="relative flex flex-col items-center">
        <canvas
          :ref="(el) => { if (el) dots[i] = el as HTMLCanvasElement }"
          aria-hidden="true"
          :style="{ width: `${props.dotSize}px`, height: `${props.dotSize}px`, imageRendering: 'pixelated' }"
        />
        <span
          v-if="i < items.length - 1"
          aria-hidden="true"
          class="mt-1 w-px flex-1 bg-border"
        />
      </div>
      <div class="flex-1 pt-px">
        <div class="flex items-baseline justify-between gap-2">
          <p class="text-[13px] text-foreground">{{ it.title }}</p>
          <span v-if="it.time" class="shrink-0 text-[11px] tabular-nums text-muted-foreground/70">{{
            it.time
          }}</span>
        </div>
        <p v-if="it.body" class="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
          {{ it.body }}
        </p>
      </div>
    </li>
  </ol>
</template>
