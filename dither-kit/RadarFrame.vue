<script setup lang="ts">
import { computed } from "vue"
import { polarX, polarY } from "./polar"
import { usePolarChart } from "./polar-context"

defineOptions({ chartLayer: "back" })

const ctx = usePolarChart()
// Ring count comes from the chart context so the root's `rings` prop drives it.
const LEVELS = computed(() => Math.max(1, Math.round(ctx.rings)))

const axes = computed(() => ctx.radar?.axes ?? [])

function ring(radius: number): string {
  return `${axes.value
    .map(
      (ax, i) =>
        `${i === 0 ? "M" : "L"}${polarX(ctx.center.x, radius, ax.angle).toFixed(
          1
        )},${polarY(ctx.center.y, radius, ax.angle).toFixed(1)}`
    )
    .join(" ")} Z`
}

const rings = computed(() =>
  Array.from({ length: LEVELS.value }, (_, l) =>
    ring((ctx.outerRadius * (l + 1)) / LEVELS.value)
  )
)

function anchorOf(angle: number): "start" | "middle" | "end" {
  if (Math.abs(Math.cos(angle)) < 0.3) return "middle"
  return Math.cos(angle) > 0 ? "start" : "end"
}
</script>

<template>
  <g v-if="ctx.ready && ctx.radar">
    <g class="stroke-border" fill="none">
      <path v-for="(d, l) in rings" :key="l" :d="d" />
      <line
        v-for="(ax, i) in axes"
        :key="ax.label"
        :x1="ctx.center.x"
        :y1="ctx.center.y"
        :x2="polarX(ctx.center.x, ctx.outerRadius, ax.angle)"
        :y2="polarY(ctx.center.y, ctx.outerRadius, ax.angle)"
        :class="ctx.hoverIndex === i ? 'stroke-foreground' : undefined"
      />
    </g>
    <g class="font-mono text-[10px]">
      <text
        v-for="(ax, i) in axes"
        :key="ax.label"
        :x="polarX(ctx.center.x, ctx.outerRadius + 10, ax.angle)"
        :y="polarY(ctx.center.y, ctx.outerRadius + 10, ax.angle)"
        :text-anchor="anchorOf(ax.angle)"
        dominant-baseline="central"
        :class="ctx.hoverIndex === i ? 'fill-foreground' : 'fill-muted-foreground'"
      >
        {{ ax.label }}
      </text>
    </g>
  </g>
</template>
