<script setup lang="ts">
// One layer of a stage: its keyframes sampled at the stage's moment, written
// as a CSS transform that keeps the keyframes' units (the browser measures the
// container), and handed to the slot as px against the measured box for
// painters. Any content — a kit canvas surface, an SVG, text — rides it.
import { computed, inject } from "vue"
import { STAGE } from "./DitherStage.vue"
import { compileTrack, type KeyEasing, type Keyframe, keyframeTransform, resolveSample, sampleKeyframes } from "./keyframes"
import { cn } from "./lib"

/** What the slot receives: every property resolved to px / degrees, then the moment's shape. */
export type LayerSlot = { [resolved: string]: number; progress: number; cycle: number; time: number; width: number; height: number }

const props = withDefaults(
  defineProps<{
    /** The track: { at?, easing?, x, y, rotate, scale, scaleX, scaleY, skewX, skewY, opacity, ...custom } per key. */
    keyframes?: Keyframe[]
    /** Seconds of one cycle; unset, the last key's `at` in seconds, else 1. */
    duration?: number
    delay?: number
    /** Cycles: a count, or true forever. */
    loop?: number | boolean
    yoyo?: boolean
    easing?: KeyEasing
    /** transform-origin — container units welcome. */
    origin?: string
    as?: string
    class?: string
  }>(),
  { keyframes: () => [], delay: 0, loop: 1, yoyo: false, origin: "50% 50%", as: "div" },
)
defineSlots<{ default?: (props: LayerSlot) => unknown }>()

const stage = inject(STAGE, null)
const NONE = { width: 0, height: 0 }
const time = computed(() => (stage?.reduced.value ? Infinity : (stage?.time.value ?? 0)))
const box = computed(() => stage?.box.value ?? NONE)
const track = computed(() => compileTrack({ keyframes: props.keyframes, duration: props.duration, delay: props.delay, loop: props.loop, yoyo: props.yoyo, easing: props.easing }))
const sample = computed(() => sampleKeyframes(track.value, time.value))
const resolved = computed(() => resolveSample(sample.value, box.value))
const fmt = (n: number) => String(Math.round(n * 1000) / 1000)
const style = computed(() => {
  const s: Record<string, string> = { transform: keyframeTransform(sample.value), transformOrigin: props.origin, "--layer-p": fmt(sample.value.progress) }
  if (sample.value.numbers.opacity !== undefined) s.opacity = fmt(sample.value.numbers.opacity)
  for (const [name, value] of Object.entries(resolved.value)) s[`--layer-${name}`] = name in sample.value.lengths ? `${fmt(value)}px` : fmt(value)
  return s
})
const slotProps = computed<LayerSlot>(() => ({
  ...resolved.value,
  progress: sample.value.progress,
  cycle: sample.value.cycle,
  time: Number.isFinite(time.value) ? time.value : 0,
  width: box.value.width,
  height: box.value.height,
}))
</script>

<template>
  <component :is="props.as" :class="cn('dither-layer', props.class)" :style="style" :data-layer="sample.state">
    <slot v-bind="slotProps" />
  </component>
</template>

<style>
.dither-layer {
  position: absolute;
  inset: 0;
}
</style>
