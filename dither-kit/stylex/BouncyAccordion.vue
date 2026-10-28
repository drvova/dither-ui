<!-- Generated from ../tailwind/BouncyAccordion.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

let uid = 0

/** Weighted spring shared by the layout integrator and the CSS content
 * reveal: mass 1.2, stiffness 240, damping 21 — ~8% overshoot, then calm. */
const MASS = 1.2
const STIFFNESS = 240
const DAMPING = 21

/** The same spring sampled into a CSS linear() easing for the content rise;
 * browsers without linear() fall back to the class timing function. */
const SPRING =
  "linear(0, 0.018, 0.0662, 0.1362, 0.221, 0.3143, 0.4111, 0.5073, 0.5997, 0.6858, 0.7642, 0.8336, 0.8938, 0.9445, 0.9862, 1.0193, 1.0445, 1.0627, 1.0748, 1.0816, 1.0842, 1.0832, 1.0796, 1.074, 1.0671, 1.0593, 1.0512, 1.0431, 1.0352, 1.0278, 1.0211, 1.0151, 1.0099, 1.0055, 1.0018, 0.9989, 0.9966, 0.995, 0.9939, 0.9932, 1)"

const anims = new WeakMap<HTMLElement, number>()

/** Animate height to a px target on the weighted spring (grid 0fr/1fr cannot
 * overshoot — flex factors clamp at content size — so the layout bounce runs
 * on real pixels). Rests at `auto` when open so content may keep growing. */
function springHeight(el: HTMLElement, to: number, openAtRest: boolean) {
  cancelAnimationFrame(anims.get(el) ?? 0)
  let x = el.offsetHeight
  let v = 0
  let last = performance.now()
  const step = (now: number) => {
    const dt = Math.min(0.032, (now - last) / 1000)
    last = now
    const a = (-STIFFNESS * (x - to) - DAMPING * v) / MASS
    v += a * dt
    x += v * dt
    if (Math.abs(x - to) < 0.5 && Math.abs(v) < 5) {
      el.style.height = openAtRest ? "auto" : "0px"
      anims.delete(el)
      return
    }
    el.style.height = `${Math.max(0, x)}px`
    anims.set(el, requestAnimationFrame(step))
  }
  anims.set(el, requestAnimationFrame(step))
}

const styles = stylex.create({
  box: {
    borderTopStyle: { default: "solid", ":first-child": "solid" },
    borderTopWidth: { default: "1px", ":first-child": "0px" },
    borderColor: "color-mix(in oklab, var(--border) 40%, transparent)",
  },
  button: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: "0.75rem",
    paddingBlock: "0.5rem",
    textAlign: "left",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 calc(1px + 0px) color-mix(in oklab, var(--foreground) 40%, transparent)",
    },
    outlineStyle: { default: null, ":focus-visible": "none" },
  },
  grid: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    flexShrink: "0",
    placeItems: "center",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)",
    fontSize: "13px",
  },
  text: { width: "0.5rem", height: "0.5rem", borderRadius: "2px" },
  text2: { minWidth: "0px", flex: "1" },
  text3: { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  text4: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "11px",
    color: "var(--muted-foreground)",
  },
  text5: {
    color: "var(--muted-foreground)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  text6: { rotate: "90deg" },
  box2: { overflow: "hidden" },
  box3: {
    paddingTop: "0.25rem",
    paddingBottom: "0.75rem",
    paddingLeft: "2.75rem",
    fontSize: "13px",
    lineHeight: "1.625",
    color: "var(--muted-foreground)",
    transitionProperty: { default: "opacity, transform", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
})
</script>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue"
import { cssColor } from "../engine/palette"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import type { PixelColor } from "../engine/pixel"
import { cn, type StyleProp } from "./lib"

export type BouncyItem = {
  value: string
  label: string
  hint?: string
  /** Text glyph for the leading icon box; omit for a dithered color dot. */
  icon?: string
  color?: PixelColor
  content?: string
}

/** Single-open accordion with a weighted spring layout — panels overshoot and
 * settle on a damped spring, close briskly, and reveal content with a small
 * rise. Icon rows lead each header; reduced motion swaps every glide for an
 * instant reveal. */
const props = withDefaults(
  defineProps<{
    items: BouncyItem[]
    modelValue?: string
    color?: PixelColor
    class?: string
    xstyle?: StyleProp
  }>(),
  { modelValue: "", color: "blue" },
)
const emit = defineEmits<{ "update:modelValue": [value: string] }>()

const id = `dk-bouncy-${uid++}`
const still = pixelPrefersReducedMotion()
const panels = ref<(HTMLElement | null)[]>([])
const isOpen = (v: string) => props.modelValue === v
const toggle = (v: string) => emit("update:modelValue", isOpen(v) ? "" : v)

function settle(el: HTMLElement | null, open: boolean) {
  if (!el) return
  if (still) {
    el.style.height = open ? "auto" : "0px"
    return
  }
  springHeight(el, open ? el.scrollHeight : 0, open)
}
watch(
  () => props.modelValue,
  () => props.items.forEach((item, i) => settle(panels.value[i] ?? null, isOpen(item.value))),
)
onMounted(() =>
  props.items.forEach((item, i) => {
    const el = panels.value[i]
    if (el) el.style.height = isOpen(item.value) ? "auto" : "0px"
  }),
)
</script>

<template>
  <div :class="cn(props.xstyle, props.class)">
    <div v-for="(item, i) in props.items" :key="item.value" v-bind="stylex.attrs(styles.box)">
      <button
        type="button"
        :aria-expanded="isOpen(item.value)"
        :aria-controls="`${id}-${i}`"
        v-bind="stylex.attrs(styles.button)"
        @click="toggle(item.value)"
      >
        <span
          aria-hidden="true"
          v-bind="stylex.attrs(styles.grid)"
          :style="{ color: cssColor(item.color ?? props.color) }"
        >
          <template v-if="item.icon">{{ item.icon }}</template>
          <span
            v-else
            v-bind="stylex.attrs(styles.text)"
            :style="{ background: cssColor(item.color ?? props.color) }"
          />
        </span>
        <span v-bind="stylex.attrs(styles.text2)">
          <span v-bind="stylex.attrs(styles.text3)">{{ item.label }}</span>
          <span v-if="item.hint" v-bind="stylex.attrs(styles.text4)">{{ item.hint }}</span>
        </span>
        <span aria-hidden="true" :class="cn(styles.text5, isOpen(item.value) ? styles.text6 : null)"> › </span>
      </button>
      <div
        :id="`${id}-${i}`"
        :ref="(el) => (panels[i] = el as HTMLElement | null)"
        :inert="!isOpen(item.value)"
        v-bind="stylex.attrs(styles.box2)"
      >
        <div
          v-bind="stylex.attrs(styles.box3)"
          :style="{
            opacity: isOpen(item.value) ? 1 : 0,
            transform: isOpen(item.value) ? 'none' : 'translateY(-6px)',
            transitionTimingFunction: isOpen(item.value) ? SPRING : 'cubic-bezier(0.3, 0, 0.2, 1)',
            transitionDuration: isOpen(item.value) ? '560ms' : '240ms',
          }"
        >
          <slot :name="item.value">{{ item.content }}</slot>
        </div>
      </div>
    </div>
  </div>
</template>
