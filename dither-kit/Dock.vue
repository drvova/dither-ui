<script setup lang="ts">
import { computed, ref } from "vue"
import { cssColor } from "./palette"
import { pixelPrefersReducedMotion } from "./pixel"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

export type DockItem = { value: string; label: string; color?: PixelColor }

/** Hover-magnifying dock — items swell on a gaussian falloff around the
 * pointer and settle when it leaves. Reduced motion keeps the row still and
 * marks hover by color alone. */
const props = withDefaults(
  defineProps<{
    items: DockItem[]
    /** Peak scale over the pointer. */
    magnify?: number
    /** Falloff radius in px. */
    range?: number
    class?: string
  }>(),
  { magnify: 1.7, range: 80 }
)
const emit = defineEmits<{ select: [value: string] }>()

const px = ref<number | null>(null)
const bar = ref<HTMLDivElement | null>(null)
const still = pixelPrefersReducedMotion()

function track(e: PointerEvent) {
  if (still) return
  const r = bar.value?.getBoundingClientRect()
  if (r) px.value = e.clientX - r.left
}

const scaleOf = computed(() => (i: number) => {
  if (px.value === null || !bar.value) return 1
  const buttons = bar.value.querySelectorAll("button")
  const b = buttons[i] as HTMLElement | undefined
  if (!b) return 1
  const center = b.offsetLeft + b.offsetWidth / 2
  const d = Math.abs(px.value - center)
  const g = Math.exp(-(d * d) / (2 * props.range * props.range))
  return 1 + (props.magnify - 1) * g
})
</script>

<template>
  <div
    ref="bar"
    :class="cn('inline-flex items-end gap-1.5 rounded-xl border border-border/60 bg-background/60 px-2 py-1.5', props.class)"
    role="group"
    aria-label="Dock"
    @pointermove="track"
    @pointerleave="px = null"
  >
    <button
      v-for="(it, i) in props.items"
      :key="it.value"
      type="button"
      :aria-label="it.label"
      :title="it.label"
      class="grid size-9 origin-bottom place-items-center rounded-lg border border-border/60 bg-card/60 transition-transform duration-150 ease-out will-change-transform hover:bg-card motion-reduce:transition-none"
      :style="{ transform: `scale(${scaleOf(i)})` }"
      @click="emit('select', it.value)"
    >
      <span aria-hidden="true" class="size-2 rounded-[2px]" :style="{ background: cssColor(it.color ?? 'blue') }" />
    </button>
  </div>
</template>
