// Generated from @dither-ui/kit/solid/DitherToaster.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { For } from "solid-js"
import { Portal } from "solid-js/web"
import type { PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { paintRail } from "@dither-ui/kit/engine/rail.ts"
import { dismiss, toasts } from "@dither-ui/kit/solid/runtime/toast.ts"
import "@dither-ui/kit/solid/DitherToaster.css"
import { cn } from "./lib"

import * as stylex from "@stylexjs/stylex"

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

export type DitherToasterProps = Record<never, never>

export default function DitherToaster(_props: DitherToasterProps) {
  function setRail(el: HTMLCanvasElement, color: PixelColor) {
    requestAnimationFrame(() => paintRail(el, color))
  }

  return (
    <Portal>
      <div role="status" aria-live="polite" {...stylex.props(styles.grid)}>
        <For each={toasts}>
          {(t) => (
            <div class={cn(styles.row, "dk-toast")}>
              <canvas
                ref={(el) => setRail(el, t.color)}
                aria-hidden="true"
                {...stylex.props(styles.canvas)}
                style={{ "image-rendering": "pixelated" }}
              />
              <span {...stylex.props(styles.text)}>{t.message}</span>
              <button type="button" aria-label="Dismiss" {...stylex.props(styles.button)} onClick={() => dismiss(t.id)}>
                ×
              </button>
            </div>
          )}
        </For>
      </div>
    </Portal>
  )
}
