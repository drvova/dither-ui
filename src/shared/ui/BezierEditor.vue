<script setup lang="ts">
import { computed, ref } from "vue"
import type { BezierPoints } from "@dither-kit"

const props = defineProps<{ modelValue: BezierPoints }>()
const emit = defineEmits<{ "update:modelValue": [BezierPoints] }>()

// Screen space: x 0..1 spans the width; y -0.5..1.5 so overshoot is visible.
const W = 232
const H = 148
const Y_MIN = -0.5
const Y_MAX = 1.5
const sx = (x: number) => x * W
const sy = (y: number) => ((Y_MAX - y) / (Y_MAX - Y_MIN)) * H
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

const p = computed(() => props.modelValue)
const path = computed(
  () =>
    `M ${sx(0)} ${sy(0)} C ${sx(p.value[0])} ${sy(p.value[1])}, ${sx(p.value[2])} ${sy(p.value[3])}, ${sx(1)} ${sy(1)}`
)

const svg = ref<SVGSVGElement | null>(null)
function dragHandle(which: 0 | 1, e: PointerEvent) {
  e.preventDefault()
  const move = (ev: PointerEvent) => {
    const r = svg.value?.getBoundingClientRect()
    if (!r) return
    const x = clamp((ev.clientX - r.left) / r.width, 0, 1)
    const y = clamp(Y_MAX - ((ev.clientY - r.top) / r.height) * (Y_MAX - Y_MIN), Y_MIN, Y_MAX)
    const next: [number, number, number, number] = [...p.value] as never
    next[which * 2] = Math.round(x * 100) / 100
    next[which * 2 + 1] = Math.round(y * 100) / 100
    emit("update:modelValue", next)
  }
  move(e)
  const up = () => {
    window.removeEventListener("pointermove", move)
    window.removeEventListener("pointerup", up)
  }
  window.addEventListener("pointermove", move)
  window.addEventListener("pointerup", up)
}

function setNum(i: number, e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (!Number.isFinite(v)) return
  const next: [number, number, number, number] = [...p.value] as never
  next[i] = clamp(v, i % 2 === 0 ? 0 : Y_MIN, i % 2 === 0 ? 1 : Y_MAX)
  emit("update:modelValue", next)
}

// Animator staples — overshoot, anticipation, hard snap.
const PRESETS: { name: string; pts: BezierPoints }[] = [
  { name: "back", pts: [0.34, 1.56, 0.64, 1] },
  { name: "anticipate", pts: [0.36, 0, 0.66, -0.56] },
  { name: "snap", pts: [0.16, 1, 0.3, 1] },
]
</script>

<template>
  <div class="flex flex-col gap-2">
    <svg
      ref="svg"
      :width="W"
      :height="H"
      class="w-full cursor-crosshair touch-none rounded-md bg-background/60 ring-1 ring-border"
      :viewBox="`0 0 ${W} ${H}`"
    >
      <!-- unit box + diagonal reference -->
      <rect :x="sx(0)" :y="sy(1)" :width="W" :height="sy(0) - sy(1)" class="fill-none stroke-border" stroke-dasharray="3 3" />
      <line :x1="sx(0)" :y1="sy(0)" :x2="sx(1)" :y2="sy(1)" class="stroke-border" stroke-dasharray="2 4" />
      <!-- control arms -->
      <line :x1="sx(0)" :y1="sy(0)" :x2="sx(p[0])" :y2="sy(p[1])" class="stroke-accent/50" />
      <line :x1="sx(1)" :y1="sy(1)" :x2="sx(p[2])" :y2="sy(p[3])" class="stroke-accent/50" />
      <!-- curve -->
      <path :d="path" fill="none" class="stroke-foreground" stroke-width="2" />
      <!-- endpoints -->
      <circle :cx="sx(0)" :cy="sy(0)" r="3" class="fill-muted-foreground" />
      <circle :cx="sx(1)" :cy="sy(1)" r="3" class="fill-muted-foreground" />
      <!-- draggable control points -->
      <circle
        :cx="sx(p[0])" :cy="sy(p[1])" r="6"
        class="cursor-grab fill-accent stroke-background active:cursor-grabbing" stroke-width="2"
        @pointerdown="dragHandle(0, $event)"
      />
      <circle
        :cx="sx(p[2])" :cy="sy(p[3])" r="6"
        class="cursor-grab fill-accent stroke-background active:cursor-grabbing" stroke-width="2"
        @pointerdown="dragHandle(1, $event)"
      />
    </svg>

    <div class="flex items-center gap-1.5">
      <span class="shrink-0 text-[10px] text-muted-foreground">cubic-bezier(</span>
      <input
        v-for="(v, i) in p"
        :key="i"
        type="number"
        :name="`bezier-${i}`"
        step="0.01"
        :value="v"
        class="w-full min-w-0 rounded border border-border bg-background/60 px-1 py-0.5 text-center text-[11px] tabular-nums text-foreground outline-none [appearance:textfield] focus:border-accent/60 [&::-webkit-inner-spin-button]:appearance-none"
        @change="setNum(i, $event)"
      />
      <span class="shrink-0 text-[10px] text-muted-foreground">)</span>
    </div>

    <div class="flex flex-wrap gap-1">
      <button
        v-for="pr in PRESETS"
        :key="pr.name"
        type="button"
        class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        @click="emit('update:modelValue', pr.pts)"
      >
        {{ pr.name }}
      </button>
    </div>
  </div>
</template>
