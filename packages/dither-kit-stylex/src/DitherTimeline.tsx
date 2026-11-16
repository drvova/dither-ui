// Generated from @dither-ui/kit/solid/DitherTimeline.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, For, mergeProps, onMount, Show } from "solid-js"
import { BAYER4, fillOf, type PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { cellCanvas } from "@dither-ui/kit/engine/raster.ts"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  li: {
    position: "relative",
    display: "flex",
    gap: "0.75rem",
    paddingBottom: { default: "1.25rem", ":last-child": "0px" },
  },
  stack: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center" },
  text: { marginTop: "0.25rem", width: "1px", flex: "1", backgroundColor: "var(--border)" },
  box: { flex: "1", paddingTop: "1px" },
  row: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem" },
  p: { fontSize: "13px", color: "var(--foreground)" },
  text2: {
    flexShrink: "0",
    fontSize: "11px",
    color: "var(--muted-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
  p2: { marginTop: "0.125rem", fontSize: "12px", lineHeight: "1.625", color: "var(--muted-foreground)" },
  ol: { position: "relative", display: "flex", flexDirection: "column" },
})

export type TimelineItem = {
  title: string
  time?: string
  body?: string
  color?: PixelColor
}

const CELL = 2

/** A small dithered filled dot — dense core fading at the rim through Bayer. */
function paintDot(ctx: CanvasRenderingContext2D, cells: number, color: PixelColor): void {
  const px = cellCanvas(ctx, cells, cells)
  const c = cells / 2
  const fill = fillOf(color)
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const r = Math.hypot(x + 0.5 - c, y + 0.5 - c) / c // 0 center → 1 rim
      const density = 1 - r
      if (density <= 0 || density <= BAYER4[y & 3][x & 3]) continue
      px.cell(x, y, fill, 0.5 + 0.5 * density)
    }
  }
  px.flush()
}

export type DitherTimelineProps = {
  /** @docs { title; time?; body?; color? }[] */
  items: TimelineItem[]
  /** @docs number (px) */
  dotSize?: number
  class?: string
  xstyle?: StyleProp
}

export default function DitherTimeline(raw: DitherTimelineProps) {
  const props = mergeProps({ dotSize: 12 }, raw)

  return (
    <ol class={cn(styles.ol, props.xstyle, props.class)}>
      <For each={props.items}>
        {(it, i) => {
          let dot: HTMLCanvasElement | undefined
          // Each dot prints as its item and the size are now.
          onMount(() =>
            createEffect(() => {
              const ctx = dot?.getContext("2d", { willReadFrequently: true })
              if (!dot || !ctx) return
              const cells = Math.max(4, Math.round(props.dotSize / CELL))
              dot.width = cells
              dot.height = cells
              paintDot(ctx, cells, it.color ?? "blue")
            }),
          )
          return (
            <li {...stylex.props(styles.li)}>
              {/* rail: dot + connecting line down to the next item */}
              <div {...stylex.props(styles.stack)}>
                <canvas
                  ref={(el) => (dot = el)}
                  aria-hidden="true"
                  style={{
                    width: `${props.dotSize}px`,
                    height: `${props.dotSize}px`,
                    "image-rendering": "pixelated",
                  }}
                />
                <Show when={i() < props.items.length - 1}>
                  <span aria-hidden="true" {...stylex.props(styles.text)} />
                </Show>
              </div>
              <div {...stylex.props(styles.box)}>
                <div {...stylex.props(styles.row)}>
                  <p {...stylex.props(styles.p)}>{it.title}</p>
                  <Show when={it.time}>
                    <span {...stylex.props(styles.text2)}>{it.time}</span>
                  </Show>
                </div>
                <Show when={it.body}>
                  <p {...stylex.props(styles.p2)}>{it.body}</p>
                </Show>
              </div>
            </li>
          )
        }}
      </For>
    </ol>
  )
}
