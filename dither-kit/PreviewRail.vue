<script setup lang="ts">
import { computed, ref } from "vue"
import { POPOVER } from "./control"
import { cssColor } from "./palette"
import { pixelPrefersReducedMotion } from "./pixel"
import type { PixelColor } from "./pixel"
import { cn } from "./lib"

export type PreviewRailItem = { value: string; label: string; hint?: string; color?: PixelColor }

/** Codex-style navigation rail — compact ticks swell into a pyramid around
 * the pointer and float a destination preview beside the hovered or focused
 * tick. Reduced motion keeps the ticks still; the preview remains. */
const props = withDefaults(
  defineProps<{
    items: PreviewRailItem[]
    modelValue?: string
    /** Pyramid falloff radius in px. */
    range?: number
    /** Screen edge the rail hugs; the preview floats toward the other side. */
    side?: "left" | "right"
    class?: string
  }>(),
  { range: 56, side: "left" }
)
const emit = defineEmits<{ "update:modelValue": [value: string] }>()

const rail = ref<HTMLElement | null>(null)
const py = ref<number | null>(null)
const focusIndex = ref<number | null>(null)
const still = pixelPrefersReducedMotion()

function track(e: PointerEvent) {
  const r = rail.value?.getBoundingClientRect()
  if (r) py.value = e.clientY - r.top
}
function onFocusin(e: FocusEvent) {
  const b = (e.target as HTMLElement).closest("button")
  focusIndex.value = b ? Number(b.dataset.i) : null
}

const centerOf = (i: number) => {
  const b = rail.value?.querySelectorAll("button")[i] as HTMLElement | undefined
  return b ? b.offsetTop + b.offsetHeight / 2 : null
}
const widthOf = computed(() => (i: number) => {
  const rest = props.items[i]?.value === props.modelValue ? 16 : 10
  if (still || py.value === null) return rest
  const c = centerOf(i)
  const w = c === null ? 0 : Math.max(0, 1 - Math.abs(py.value - c) / props.range)
  return rest + 16 * w
})
const previewIndex = computed(() => {
  if (focusIndex.value !== null) return focusIndex.value
  if (py.value === null) return null
  let best: number | null = null
  let bd = Infinity
  for (let i = 0; i < props.items.length; i++) {
    const c = centerOf(i)
    if (c === null) continue
    const d = Math.abs(py.value - c)
    if (d < bd) { bd = d; best = i }
  }
  return best
})
const preview = computed(() => (previewIndex.value === null ? null : props.items[previewIndex.value] ?? null))
const previewTop = computed(() => (previewIndex.value === null ? 0 : centerOf(previewIndex.value) ?? 0))
</script>

<template>
  <nav
    ref="rail"
    :class="cn('relative inline-flex flex-col gap-1 py-1', props.class)"
    aria-label="Preview rail"
    @pointermove="track"
    @pointerleave="py = null"
    @focusin="onFocusin"
    @focusout="focusIndex = null"
  >
    <button
      v-for="(it, i) in props.items"
      :key="it.value"
      type="button"
      :data-i="i"
      :aria-label="it.hint ? `${it.label} — ${it.hint}` : it.label"
      :aria-current="it.value === props.modelValue ? 'page' : undefined"
      :class="cn('flex h-4 w-9 items-center rounded-md px-1 hover:bg-card/60', props.side === 'right' ? 'justify-end' : 'justify-start')"
      @click="emit('update:modelValue', it.value)"
    >
      <span
        aria-hidden="true"
        class="h-0.5 rounded-full bg-foreground/30 transition-[width] duration-150 ease-out motion-reduce:transition-none"
        :style="{ width: `${widthOf(i)}px`, ...(it.value === props.modelValue ? { background: cssColor(it.color ?? 'blue') } : {}) }"
      />
    </button>
    <div
      v-if="preview"
      aria-hidden="true"
      :class="cn(POPOVER, 'pointer-events-none absolute z-10 whitespace-nowrap px-3 py-2 transition-[top] duration-150 ease-out motion-reduce:transition-none', props.side === 'right' ? 'right-full mr-2' : 'left-full ml-2')"
      :style="{ top: `${previewTop}px`, transform: 'translateY(-50%)' }"
    >
      <slot name="preview" :item="preview">
        <div class="text-[12px] font-medium text-foreground">{{ preview.label }}</div>
        <p v-if="preview.hint" class="mt-0.5 text-[11px] text-muted-foreground">{{ preview.hint }}</p>
      </slot>
    </div>
  </nav>
</template>
