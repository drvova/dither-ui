<script setup lang="ts" generic="T">
import { computed, ref } from "vue"
import { project, rubberband, velocityFrom, type VelocitySample } from "./gesture"
import { pixelPrefersReducedMotion } from "./pixel"
import { cn } from "./lib"

/** Swipe deck — the top card tracks the pointer 1:1, rubber-bands, and a
 * flick or a far drag sends it flying; the stack rises beneath. Cycles
 * forever. Reduced motion swaps instantly. */
const props = withDefaults(
  defineProps<{
    items: T[]
    /** Visible under-cards. */
    depth?: number
    class?: string
  }>(),
  { depth: 2 }
)
const emit = defineEmits<{ advance: [index: number] }>()

const index = ref(0)
const dx = ref(0)
const flying = ref(false)
const dragging = ref(false)
let pointerId = -1
let startX = 0
let samples: VelocitySample[] = []
const el = ref<HTMLDivElement | null>(null)

const order = computed(() => {
  const n = props.items.length
  if (!n) return []
  return Array.from({ length: Math.min(props.depth + 1, n) }, (_, d) => (index.value + d) % n)
})

function down(e: PointerEvent) {
  if (flying.value || props.items.length < 2) return
  dragging.value = true
  pointerId = e.pointerId
  startX = e.clientX
  samples = [{ t: e.timeStamp, p: e.clientX }]
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function move(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== pointerId) return
  const raw = e.clientX - startX
  const w = el.value?.offsetWidth ?? 300
  dx.value = Math.abs(raw) > w ? Math.sign(raw) * (w + rubberband(Math.abs(raw) - w, w)) : raw
  samples.push({ t: e.timeStamp, p: e.clientX })
  if (samples.length > 6) samples.shift()
}
function up(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== pointerId) return
  dragging.value = false
  const w = el.value?.offsetWidth ?? 300
  const v = velocityFrom(samples)
  const destination = dx.value + project(v)
  if (Math.abs(destination) > w * 0.5) {
    if (pixelPrefersReducedMotion()) {
      advance()
      return
    }
    flying.value = true
    dx.value = Math.sign(destination) * w * 1.4
    window.setTimeout(advance, 200)
  } else {
    dx.value = 0
  }
}
function advance() {
  index.value = (index.value + 1) % props.items.length
  flying.value = false
  dx.value = 0
  emit("advance", index.value)
}

const cardStyle = computed(() => (d: number) => {
  if (d === 0)
    return {
      transform: `translateX(${dx.value}px) rotate(${dx.value / 24}deg)`,
      transition: dragging.value ? "none" : "transform 200ms ease",
      zIndex: 10,
    }
  return {
    transform: `translateY(${d * 9}px) scale(${1 - d * 0.05})`,
    transition: "transform 200ms ease",
    zIndex: 10 - d,
    opacity: 1 - d * 0.25,
  }
})
</script>

<template>
  <div ref="el" :class="cn('relative isolate select-none', props.class)">
    <div
      v-for="(itemIndex, d) in order"
      :key="itemIndex"
      class="absolute inset-0 motion-reduce:!transition-none"
      :style="cardStyle(d)"
      :aria-hidden="d !== 0"
      :role="d === 0 ? 'group' : undefined"
      :aria-roledescription="d === 0 ? 'swipeable card' : undefined"
      :aria-label="d === 0 ? `Card ${itemIndex + 1} of ${props.items.length}` : undefined"
      v-bind="d === 0 ? { onPointerdown: down, onPointermove: move, onPointerup: up, onPointercancel: up } : {}"
      :class="d === 0 ? 'cursor-grab touch-pan-y active:cursor-grabbing' : 'pointer-events-none'"
    >
      <slot :item="props.items[itemIndex]" :index="itemIndex" :top="d === 0">
        <div class="grid h-full w-full place-items-center rounded-lg border border-border/60 bg-card/80 font-mono text-[13px] text-foreground">
          {{ String(props.items[itemIndex]) }}
        </div>
      </slot>
    </div>
  </div>
</template>
