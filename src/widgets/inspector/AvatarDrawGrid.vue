<script setup lang="ts">
import { computed } from "vue"
import type { AvatarModel } from "@/entities/widget"
import { clampGrid, cssColor, seededPattern } from "@dither-kit"

/** Click/drag pixel editor for drawn avatars. Symmetry follows the model's
 * mirror setting (horizontal folds left/right, vertical top/bottom, auto =
 * free painting). */
const props = defineProps<{ avatar: AvatarModel }>()
const avatar = computed(() => props.avatar)

const grid = computed(() => clampGrid(avatar.value.grid))
const cells = computed(() => {
  const n = grid.value * grid.value
  const on = avatar.value.pattern?.on ?? []
  return Array.from({ length: n }, (_, i) => !!on[i])
})
const fill = computed(() =>
  avatar.value.autoColor ? "var(--color-foreground)" : cssColor(avatar.value.color)
)

function ensurePattern() {
  const model = avatar.value
  const n = grid.value * grid.value
  if (!model.pattern || model.pattern.on.length !== n) {
    // Seed the canvas-to-be from the current generative pattern so switching
    // to draw starts from something recognisable instead of a blank grid.
    const seeded = seededPattern(model.name, grid.value, model.mirror)
    model.pattern = {
      on: seeded.on.map((b) => (b ? 1 : 0)),
      density: seeded.density.map((d) => Math.round(d * 100) / 100),
    }
  }
}

const twinOf = (i: number): number | null => {
  const g = grid.value
  const r = Math.floor(i / g)
  const c = i % g
  if (avatar.value.mirror === "horizontal") return r * g + (g - 1 - c)
  if (avatar.value.mirror === "vertical") return (g - 1 - r) * g + c
  return null
}

let paintTo: 0 | 1 = 1
function setCell(i: number, value: 0 | 1) {
  ensurePattern()
  const p = avatar.value.pattern!
  p.on[i] = value
  p.density[i] = p.density[i] || 0.85
  const twin = twinOf(i)
  if (twin != null && twin !== i) {
    p.on[twin] = value
    p.density[twin] = p.density[twin] || 0.85
  }
}
function onDown(i: number, e: PointerEvent) {
  e.preventDefault()
  ensurePattern()
  paintTo = avatar.value.pattern!.on[i] ? 0 : 1
  setCell(i, paintTo)
}
function onEnter(i: number, e: PointerEvent) {
  if (e.buttons === 1) setCell(i, paintTo)
}

function fillAll(value: 0 | 1) {
  ensurePattern()
  const p = avatar.value.pattern!
  p.on = p.on.map(() => value)
}
function invert() {
  ensurePattern()
  const p = avatar.value.pattern!
  p.on = p.on.map((v) => (v ? 0 : 1))
}
function reseed() {
  avatar.value.pattern = null
  ensurePattern()
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      class="grid aspect-square w-full touch-none select-none gap-px rounded-md bg-border/60 p-px ring-1 ring-border"
      :style="{ gridTemplateColumns: `repeat(${grid}, 1fr)` }"
    >
      <button
        v-for="(onCell, i) in cells"
        :key="i"
        type="button"
        class="aspect-square rounded-[1px] transition-colors"
        :style="{ backgroundColor: onCell ? fill : 'var(--color-background)' }"
        :aria-label="`Cell ${i + 1}`"
        @pointerdown="onDown(i, $event)"
        @pointerenter="onEnter(i, $event)"
      />
    </div>
    <div class="flex flex-wrap gap-1">
      <button type="button" class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground" @click="fillAll(0)">clear</button>
      <button type="button" class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground" @click="fillAll(1)">fill</button>
      <button type="button" class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground" @click="invert()">invert</button>
      <button type="button" class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground" @click="reseed()">from seed</button>
    </div>
    <p class="text-[10px] leading-relaxed text-muted-foreground/70">
      click / drag to paint — mirror setting paints symmetrically
    </p>
  </div>
</template>
