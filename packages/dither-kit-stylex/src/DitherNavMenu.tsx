// Generated from @dither-ui/kit/solid/DitherNavMenu.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createSignal, For, mergeProps, on, onCleanup, onMount } from "solid-js"
import { BAYER4, fillOf, type PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { cellCanvas } from "@dither-ui/kit/engine/raster.ts"
import { cn } from "./lib"

import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  nav: { position: "relative" },
  row: { display: "flex", gap: "1rem" },
  canvas: {
    position: "absolute",
    bottom: "0px",
    height: "2px",
    transitionProperty: { default: "left, width", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  pb2: {
    paddingBottom: "0.5rem",
    fontSize: "12px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
  },
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
})

export type NavMenuItem = { label: string; href?: string }

const CELL = 2

/** Paint the 2px underline — the same horizontal dither ramp as DitherTabs. */
function paintUnderline(
  canvas: HTMLCanvasElement,
  width: number,
  color: PixelColor,
  matrix: number[][] = BAYER4,
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx || width <= 0) return
  const cols = Math.max(4, Math.round(width / CELL))
  canvas.width = cols
  canvas.height = 1
  const fill = fillOf(color)
  const px = cellCanvas(ctx, cols, 1)
  for (let x = 0; x < cols; x++) {
    const density = (x + 0.5) / cols
    const lit = density > matrix[0][x & 3]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    px.cell(x, 0, fill, alpha)
  }
  px.flush()
}

export type DitherNavMenuProps = {
  items: NavMenuItem[]
  modelValue: string
  color?: PixelColor
  onUpdateModelValue?: (value: string) => void
}

export default function DitherNavMenu(raw: DitherNavMenuProps) {
  const props = mergeProps({ color: "blue" as PixelColor }, raw)

  let list: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  const itemRefs: HTMLAnchorElement[] = []
  const [underline, setUnderline] = createSignal({ left: 0, width: 0 })

  function measure() {
    const active = itemRefs[props.items.findIndex((it) => it.label === props.modelValue)]
    if (!active) return
    setUnderline({ left: active.offsetLeft, width: active.offsetWidth })
    if (canvas) paintUnderline(canvas, active.offsetWidth, props.color)
  }

  let ro: ResizeObserver | null = null
  onMount(() => {
    requestAnimationFrame(() => {
      measure()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(measure)
        if (list) ro.observe(list)
      }
    })
    createEffect(
      on(
        () => [props.modelValue, props.items, props.color],
        () => queueMicrotask(measure),
        { defer: true },
      ),
    )
  })
  onCleanup(() => ro?.disconnect())

  return (
    <nav {...stylex.props(styles.nav)}>
      <div ref={(el) => (list = el)} {...stylex.props(styles.row)}>
        <For each={props.items}>
          {(item, i) => (
            <a
              ref={(el) => (itemRefs[i()] = el)}
              href={item.href ?? "#"}
              aria-current={item.label === props.modelValue ? "page" : undefined}
              class={cn([
                styles.pb2,
                item.label === props.modelValue ? styles.textForeground : styles.textMutedForeground,
              ])}
              onClick={(e) => {
                e.preventDefault()
                props.onUpdateModelValue?.(item.label)
              }}
            >
              {item.label}
            </a>
          )}
        </For>
      </div>
      <canvas
        ref={(el) => (canvas = el)}
        aria-hidden="true"
        {...stylex.props(styles.canvas)}
        style={{
          left: underline().left + "px",
          width: underline().width + "px",
          "image-rendering": "pixelated",
        }}
      />
    </nav>
  )
}
