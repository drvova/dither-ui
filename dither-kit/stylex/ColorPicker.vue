<!-- Generated from ../tailwind/ColorPicker.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { display: "grid", width: "15rem", gap: "0.5rem" },
  opacity40: { opacity: "40%" },
  frame: {
    position: "relative",
    height: "9rem",
    width: "100%",
    cursor: "crosshair",
    touchAction: "none",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    outlineStyle: "none",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(2px + 0px) var(--ring)" },
  },
  layer: {
    pointerEvents: "none",
    position: "absolute",
    width: "0.875rem",
    height: "0.875rem",
    translate: "calc(calc(1 / 2 * 100%) * -1) calc(calc(1 / 2 * 100%) * -1)",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "2px",
    borderColor: "#fff",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
  frame2: {
    position: "relative",
    height: "1rem",
    width: "100%",
    cursor: "ew-resize",
    touchAction: "none",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    outlineStyle: "none",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(2px + 0px) var(--ring)" },
  },
  layer2: {
    pointerEvents: "none",
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    left: "0px",
    width: "0.875rem",
    height: "0.875rem",
    translate: "calc(calc(1 / 2 * 100%) * -1) calc(calc(1 / 2 * 100%) * -1)",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "2px",
    borderColor: "#fff",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
  input: {
    minHeight: "2rem",
    flex: "1",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "color-mix(in oklab, var(--border) 70%, transparent)",
      ":focus-visible": "var(--ring)",
    },
    backgroundColor: "transparent",
    paddingInline: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12.5px",
    color: "var(--foreground)",
    textTransform: "uppercase",
    outlineStyle: "none",
    transitionProperty: { default: null, "@media (prefers-reduced-motion: reduce)": "none" },
  },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"

/** HSV color field: a saturation/value plane over the current hue, a hue
 * strip, and a hex readout input — pointer-driven, keyboard on the plane
 * (arrows nudge S/V). Model is the hex string. */
const props = withDefaults(
  defineProps<{ modelValue?: string; disabled?: boolean; class?: string; xstyle?: StyleProp }>(),
  {
    modelValue: "#5227FF",
    disabled: false,
  },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

function hexToHsv(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return [0, 0, 0]
  const int = parseInt(m[1], 16)
  const r = ((int >> 16) & 255) / 255
  const g = ((int >> 8) & 255) / 255
  const b = (int & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, max === 0 ? 0 : d / max, max]
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  const to = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0")
  return `#${to(r)}${to(g)}${to(b)}`
}

const hsv = computed(() => hexToHsv(props.modelValue))
const hueColor = computed(() => hsvToHex(hsv.value[0], 1, 1))
const planeCursor = computed(() => ({ s: hsv.value[1] * 100, v: hsv.value[2] * 100 }))

const planeEl = ref<HTMLElement | null>(null)
const hueEl = ref<HTMLElement | null>(null)

function fromPlane(e: PointerEvent) {
  const el = planeEl.value
  if (!el || props.disabled) return
  const rect = el.getBoundingClientRect()
  const s = Math.min(1, Math.max(0, (e.clientX - rect.left) / Math.max(1, rect.width)))
  const v = 1 - Math.min(1, Math.max(0, (e.clientY - rect.top) / Math.max(1, rect.height)))
  emit("update:modelValue", hsvToHex(hsv.value[0], s, v))
}

function fromHue(e: PointerEvent) {
  const el = hueEl.value
  if (!el || props.disabled) return
  const rect = el.getBoundingClientRect()
  const t = Math.min(1, Math.max(0, (e.clientX - rect.left) / Math.max(1, rect.width)))
  emit("update:modelValue", hsvToHex(t * 360, hsv.value[1], hsv.value[2]))
}

function track(onMove: (e: PointerEvent) => void) {
  const stop = () => {
    window.removeEventListener("pointermove", onMove)
    window.removeEventListener("pointerup", stop)
    window.removeEventListener("pointercancel", stop)
  }
  window.addEventListener("pointermove", onMove)
  window.addEventListener("pointerup", stop)
  window.addEventListener("pointercancel", stop)
}

function onPlaneDown(e: PointerEvent) {
  if (props.disabled || e.button !== 0) return
  fromPlane(e)
  track(fromPlane)
}

function onHueDown(e: PointerEvent) {
  if (props.disabled || e.button !== 0) return
  fromHue(e)
  track(fromHue)
}

function onPlaneKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  const [, s, v] = hsv.value
  const d = e.shiftKey ? 0.1 : 0.01
  let ns = s
  let nv = v
  if (e.key === "ArrowLeft") ns = s - d
  else if (e.key === "ArrowRight") ns = s + d
  else if (e.key === "ArrowUp") nv = v + d
  else if (e.key === "ArrowDown") nv = v - d
  else return
  e.preventDefault()
  emit("update:modelValue", hsvToHex(hsv.value[0], Math.min(1, Math.max(0, ns)), Math.min(1, Math.max(0, nv))))
}

function onHexInput(raw: string) {
  const cleaned = raw.startsWith("#") ? raw : `#${raw}`
  if (/^#[0-9a-f]{0,6}$/i.test(cleaned)) {
    emit("update:modelValue", cleaned)
  }
}
</script>

<template>
  <div :class="cn(styles.grid, props.disabled && styles.opacity40, props.xstyle, props.class)">
    <div
      ref="planeEl"
      role="slider"
      tabindex="0"
      aria-label="Saturation and brightness"
      :aria-valuetext="props.modelValue"
      :aria-disabled="props.disabled || undefined"
      v-bind="stylex.attrs(styles.frame)"
      :style="{
        background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${hueColor}`,
      }"
      @pointerdown.prevent="onPlaneDown"
      @keydown="onPlaneKeydown"
    >
      <span
        v-bind="stylex.attrs(styles.layer)"
        :style="{ left: `${planeCursor.s}%`, top: `${100 - planeCursor.v}%`, background: props.modelValue }"
      />
    </div>

    <div
      ref="hueEl"
      role="slider"
      tabindex="0"
      aria-label="Hue"
      :aria-valuemin="0"
      :aria-valuemax="360"
      :aria-valuenow="Math.round(hsv[0])"
      :aria-disabled="props.disabled || undefined"
      v-bind="stylex.attrs(styles.frame2)"
      style="
        background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
      "
      @pointerdown.prevent="onHueDown"
      @keydown.left.prevent="
        emit('update:modelValue', hsvToHex(Math.max(0, hsv[0] - (1 + +$event.shiftKey * 15)), hsv[1], hsv[2]))
      "
      @keydown.right.prevent="
        emit('update:modelValue', hsvToHex(Math.min(360, hsv[0] + (1 + +$event.shiftKey * 15)), hsv[1], hsv[2]))
      "
    >
      <span
        v-bind="stylex.attrs(styles.layer2)"
        :style="{ marginLeft: `${(hsv[0] / 360) * 100}%`, background: hueColor }"
      />
    </div>

    <label v-bind="stylex.attrs(styles.label)">
      Hex
      <input
        :value="props.modelValue"
        :disabled="props.disabled"
        spellcheck="false"
        v-bind="stylex.attrs(styles.input)"
        @input="onHexInput(($event.target as HTMLInputElement).value)"
      />
    </label>
  </div>
</template>
