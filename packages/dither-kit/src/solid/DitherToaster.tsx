import { For } from "solid-js"
import { Portal } from "solid-js/web"
import type { PixelColor } from "../engine/pixel"
import { paintRail } from "../engine/rail"
import { dismiss, toasts } from "./runtime/toast"
import "./DitherToaster.css"

export type DitherToasterProps = Record<never, never>

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
