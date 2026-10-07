<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"

/** HSV color field: a saturation/value plane over the current hue, a hue
 * strip, and a hex readout input — pointer-driven, keyboard on the plane
 * (arrows nudge S/V). Model is the hex string. */
const props = withDefaults(
  defineProps<{ modelValue?: string; disabled?: boolean; class?: string }>(),
  { modelValue: "#5227FF", disabled: false },
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
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  const to = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0")
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
  emit(
    "update:modelValue",
    hsvToHex(hsv.value[0], Math.min(1, Math.max(0, ns)), Math.min(1, Math.max(0, nv))),
  )
}

function onHexInput(raw: string) {
  const cleaned = raw.startsWith("#") ? raw : `#${raw}`
  if (/^#[0-9a-f]{0,6}$/i.test(cleaned)) {
    emit("update:modelValue", cleaned)
  }
}
</script>

<template>
  <div class="grid w-60 gap-2" :class="cn(props.disabled && 'opacity-40', props.class)">
    <div
      ref="planeEl"
      role="slider"
      tabindex="0"
      aria-label="Saturation and brightness"
      :aria-valuetext="props.modelValue"
      :aria-disabled="props.disabled || undefined"
      class="relative h-36 w-full cursor-crosshair rounded-md border border-border outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      :style="{
        background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${hueColor}`,
      }"
      @pointerdown.prevent="onPlaneDown"
      @keydown="onPlaneKeydown"
    >
      <span
        class="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
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
      class="relative h-4 w-full cursor-ew-resize rounded-full border border-border outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      style="
        background: linear-gradient(
          to right,
          #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%
        );
      "
      @pointerdown.prevent="onHueDown"
      @keydown.left.prevent="emit('update:modelValue', hsvToHex(Math.max(0, hsv[0] - (1 + +$event.shiftKey * 15)), hsv[1], hsv[2]))"
      @keydown.right.prevent="emit('update:modelValue', hsvToHex(Math.min(360, hsv[0] + (1 + +$event.shiftKey * 15)), hsv[1], hsv[2]))"
    >
      <span
        class="pointer-events-none absolute left-0 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        :style="{ marginLeft: `${(hsv[0] / 360) * 100}%`, background: hueColor }"
      />
    </div>

    <label class="flex items-center gap-2 text-[12px] text-muted-foreground">
      Hex
      <input
        :value="props.modelValue"
        :disabled="props.disabled"
        spellcheck="false"
        class="min-h-8 flex-1 rounded border border-border/70 bg-transparent px-2 font-mono text-[12.5px] uppercase text-foreground outline-none focus-visible:border-accent/70 motion-reduce:transition-none"
        @input="onHexInput(($event.target as HTMLInputElement).value)"
      />
    </label>
  </div>
</template>
