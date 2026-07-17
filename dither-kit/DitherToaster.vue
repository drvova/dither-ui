<script lang="ts">
import { rgb } from "./palette"
import { BAYER4, fillOf, type PixelColor } from "./pixel"

const CELL = 2

/** Paint the 3px left rail — DitherCollapsible's vertical dither ramp. */
function paintRail(canvas: HTMLCanvasElement, color: PixelColor, matrix: number[][] = BAYER4): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  const height = canvas.offsetHeight
  if (!ctx || height <= 0) return
  const rows = Math.max(4, Math.round(height / CELL))
  canvas.width = 1
  canvas.height = rows
  const fill = fillOf(color)
  ctx.clearRect(0, 0, 1, rows)
  for (let y = 0; y < rows; y++) {
    const density = 1 - (y + 0.5) / rows
    const lit = density > matrix[y & 3][0]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    ctx.fillStyle = rgb(fill, 1, alpha)
    ctx.fillRect(0, y, 1, 1)
  }
}
</script>

<script setup lang="ts">
import { dismiss, toasts } from "./toast"

function setRail(el: unknown, color: PixelColor) {
  if (el instanceof HTMLCanvasElement)
    requestAnimationFrame(() => paintRail(el, color))
}
</script>

<template>
  <Teleport to="body">
    <div
      role="status"
      aria-live="polite"
      class="pointer-events-none fixed right-4 bottom-4 z-[60] grid justify-items-end gap-2"
    >
      <TransitionGroup name="dk-toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex gap-2 rounded-lg border border-border bg-card px-3 py-2 font-mono text-[12px]"
        >
          <canvas
            :ref="(el) => setRail(el, t.color)"
            aria-hidden="true"
            class="w-[3px] self-stretch"
            style="image-rendering: pixelated"
          />
          <span class="min-w-0 flex-1 self-center">{{ t.message }}</span>
          <button
            type="button"
            aria-label="Dismiss"
            class="self-center text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
            @click="dismiss(t.id)"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.dk-toast-enter-active,
.dk-toast-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}
.dk-toast-enter-from,
.dk-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
@media (prefers-reduced-motion: reduce) {
  .dk-toast-enter-active,
  .dk-toast-leave-active {
    transition: none;
  }
}
</style>
