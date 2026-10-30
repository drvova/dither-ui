<!-- Generated from ../tailwind/DitherToaster.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { cellCanvas } from "../engine/raster"
import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"
import * as stylex from "@stylexjs/stylex"

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
  const px = cellCanvas(ctx, 1, rows)
  for (let y = 0; y < rows; y++) {
    const density = 1 - (y + 0.5) / rows
    const lit = density > matrix[y & 3][0]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    px.cell(0, y, fill, alpha)
  }
  px.flush()
}

const styles = stylex.create({
  grid: {
    pointerEvents: "none",
    position: "fixed",
    right: "1rem",
    bottom: "1rem",
    zIndex: "60",
    display: "grid",
    justifyItems: "end",
    gap: "0.5rem",
  },
  row: {
    pointerEvents: "auto",
    display: "flex",
    gap: "0.5rem",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
  },
  canvas: { width: "3px", alignSelf: "stretch" },
  text: { minWidth: "0px", flex: "1", alignSelf: "center" },
  button: {
    alignSelf: "center",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
  },
})
</script>

<script setup lang="ts">
import { dismiss, toasts } from "../engine/toast"

function setRail(el: unknown, color: PixelColor) {
  if (el instanceof HTMLCanvasElement) requestAnimationFrame(() => paintRail(el, color))
}
</script>

<template>
  <Teleport to="body">
    <div role="status" aria-live="polite" v-bind="stylex.attrs(styles.grid)">
      <TransitionGroup name="dk-toast">
        <div v-for="t in toasts" :key="t.id" v-bind="stylex.attrs(styles.row)">
          <canvas
            :ref="(el) => setRail(el, t.color)"
            aria-hidden="true"
            v-bind="stylex.attrs(styles.canvas)"
            style="image-rendering: pixelated"
          />
          <span v-bind="stylex.attrs(styles.text)">{{ t.message }}</span>
          <button type="button" aria-label="Dismiss" v-bind="stylex.attrs(styles.button)" @click="dismiss(t.id)">
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
