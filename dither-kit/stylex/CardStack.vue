<!-- Generated from ../tailwind/CardStack.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", isolation: "isolate", WebkitUserSelect: "none", userSelect: "none" },
  layer: {
    position: "absolute",
    inset: "0px",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "ease",
    transitionDuration: "200ms",
  },
  box: { cursor: { default: "grab", ":active": "grabbing" }, touchAction: " pan-y " },
  box2: { pointerEvents: "none" },
  grid: {
    display: "grid",
    height: "100%",
    width: "100%",
    placeItems: "center",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 80%, transparent)",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
  },
})
</script>

<script setup lang="ts" generic="T">
import { computed, ref } from "vue"
import { project, rubberband, velocityFrom, type VelocitySample } from "../engine/gesture"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn, type StyleProp } from "./lib"

/** Swipe deck — the top card tracks the pointer 1:1, rubber-bands, and a
 * flick or a far drag sends it flying; the stack rises beneath. Cycles
 * forever. Reduced motion swaps instantly. */
const props = withDefaults(
  defineProps<{
    items: T[]
    /** Visible under-cards. */
    depth?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { depth: 2 },
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
      transition: dragging.value ? "none" : undefined,
      zIndex: 10,
    }
  return {
    transform: `translateY(${d * 9}px) scale(${1 - d * 0.05})`,
    zIndex: 10 - d,
    opacity: 1 - d * 0.25,
  }
})
</script>

<template>
  <div ref="el" :class="cn(styles.frame, props.xstyle, props.class)">
    <div
      v-for="(itemIndex, d) in order"
      :key="itemIndex"
      :class="cn(styles.layer, d === 0 ? styles.box : styles.box2)"
      :style="cardStyle(d)"
      :aria-hidden="d !== 0"
      :role="d === 0 ? 'group' : undefined"
      :aria-roledescription="d === 0 ? 'swipeable card' : undefined"
      :aria-label="d === 0 ? `Card ${itemIndex + 1} of ${props.items.length}` : undefined"
      v-bind="d === 0 ? { onPointerdown: down, onPointermove: move, onPointerup: up, onPointercancel: up } : {}"
    >
      <slot :item="props.items[itemIndex]" :index="itemIndex" :top="d === 0">
        <div v-bind="stylex.attrs(styles.grid)">
          {{ String(props.items[itemIndex]) }}
        </div>
      </slot>
    </div>
  </div>
</template>
