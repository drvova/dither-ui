import { For } from "solid-js"
import { Portal } from "solid-js/web"
import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"
import { cellCanvas } from "../engine/raster"
import { dismiss, toasts } from "./runtime/toast"
import "./DitherToaster.css"

export type DitherToasterProps = Record<never, never>

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

export default function DitherToaster(_props: DitherToasterProps) {
  function setRail(el: HTMLCanvasElement, color: PixelColor) {
    requestAnimationFrame(() => paintRail(el, color))
  }

  return (
    <Portal>
      <div
        role="status"
        aria-live="polite"
        class="pointer-events-none fixed right-4 bottom-4 z-[60] grid justify-items-end gap-2"
      >
        <For each={toasts}>
          {(t) => (
            <div class="dk-toast pointer-events-auto flex gap-2 rounded-lg border border-border bg-card px-3 py-2 font-mono text-[12px]">
              <canvas
                ref={(el) => setRail(el, t.color)}
                aria-hidden="true"
                class="w-[3px] self-stretch"
                style={{ "image-rendering": "pixelated" }}
              />
              <span class="min-w-0 flex-1 self-center">{t.message}</span>
              <button
                type="button"
                aria-label="Dismiss"
                class="self-center text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => dismiss(t.id)}
              >
                ×
              </button>
            </div>
          )}
        </For>
      </div>
    </Portal>
  )
}
