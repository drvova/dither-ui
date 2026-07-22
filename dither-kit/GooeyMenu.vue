<script lang="ts">
export type GooeyItem = { value: string; label: string; color?: PixelColor }
let gooeyCount = 0
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cssColor } from "./palette"
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

/** Action buttons that melt out of one trigger — the classic SVG goo filter
 * (blur + alpha contrast) fuses the circles while they travel. Reduced
 * motion drops the travel; items simply appear. */
const props = withDefaults(
  defineProps<{
    items: GooeyItem[]
    /** Expanded state (v-model). */
    modelValue?: boolean
    direction?: "up" | "down" | "left" | "right"
    /** Gap between item centers, px. */
    spacing?: number
    label?: string
    class?: string
  }>(),
  { modelValue: false, direction: "up", spacing: 52, label: "Actions" }
)
const emit = defineEmits<{ "update:modelValue": [boolean]; select: [value: string] }>()

const id = `dk-goo-${gooeyCount++}`
const VEC: Record<"up" | "down" | "left" | "right", [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}
const offset = computed(() => (i: number) => {
  if (!props.modelValue) return "translate(0px, 0px)"
  const [vx, vy] = VEC[props.direction]
  const d = props.spacing * (i + 1)
  return `translate(${vx * d}px, ${vy * d}px)`
})
function pick(value: string) {
  emit("select", value)
  emit("update:modelValue", false)
}
</script>

<template>
  <div :class="cn('relative inline-block', props.class)" @keydown.escape="emit('update:modelValue', false)">
    <svg class="absolute size-0" aria-hidden="true">
      <defs>
        <filter :id="id">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
    <div :style="{ filter: `url(#${id})` }">
      <button
        v-for="(it, i) in props.items"
        :key="it.value"
        type="button"
        :aria-label="it.label"
        :title="it.label"
        :tabindex="props.modelValue ? 0 : -1"
        :class="
          cn(
            'absolute top-0 left-0 grid size-11 place-items-center rounded-full border border-border/60 bg-card transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none',
            CONTROL_BUTTON,
            props.modelValue ? 'opacity-100' : 'pointer-events-none opacity-0'
          )
        "
        :style="{ transform: offset(i), transitionDelay: props.modelValue ? `${i * 40}ms` : '0ms' }"
        @click="pick(it.value)"
      >
        <span aria-hidden="true" class="size-2 rounded-[2px]" :style="{ background: cssColor(it.color ?? 'blue') }" />
      </button>
      <button
        type="button"
        :aria-label="props.label"
        :aria-expanded="props.modelValue"
        :class="cn('relative grid size-11 place-items-center rounded-full border border-border/60 bg-card text-foreground', CONTROL_BUTTON)"
        @click="emit('update:modelValue', !props.modelValue)"
      >
        <span
          aria-hidden="true"
          class="text-[15px] leading-none transition-transform duration-300 motion-reduce:transition-none"
          :class="props.modelValue ? 'rotate-45' : ''"
        >+</span>
      </button>
    </div>
  </div>
</template>
