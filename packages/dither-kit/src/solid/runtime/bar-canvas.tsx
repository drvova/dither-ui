// Solid's binding of the bar chart canvas: it mounts the canvases and
// starts the framework-free paint loop (`engine/bar-loop.ts`).

import { createEffect, createMemo, type JSX, on, onCleanup, onMount, Show } from "solid-js"
import { type Bars, startBarLoop } from "../../engine/bar-loop"
import type { Box, ChartContextValue } from "../../engine/chart-types"
import { backingSize, bloomLayerStyle } from "../../engine/dither-paint"
import { useChart } from "./chart-context"
import { createCanvasVisibility } from "./visibility"

/**
 * Dither canvas for bar charts. Each category owns a band; grouped series split
 * it into side-by-side bars, stacked series share its full width and pile in y.
 * Bars grow up from their base in a staggered left-to-right wave.
 */
export function BarCanvas() {
  const ctx = useChart()
  let canvasEl: HTMLCanvasElement | undefined
  let bloomEl: HTMLCanvasElement | undefined
  let loop: { stop: () => void; wake: () => void } | undefined
  const isVisible = createCanvasVisibility(
    () => canvasEl,
    () => loop?.wake(),
  )
  const backing = createMemo(() => backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))

  const targets = createMemo<Record<string, Bars>>(() => {
    const out: Record<string, Bars> = {}
    if (!ctx.ready) return out
    const { rows } = backing()
    const h0 = ctx.plot.height || 1
    for (const key of ctx.configKeys) {
      const band = ctx.bands[key]
      if (!band) continue
      out[key] = {
        top: band.map((b) => (ctx.y(b[1]) / h0) * (rows - 1)),
        base: band.map((b) => (ctx.y(b[0]) / h0) * (rows - 1)),
      }
    }
    return out
  })

  const stateBox: Box<ChartContextValue> = { current: ctx }
  const targetsBox: Box<Record<string, Bars>> = {
    get current() {
      return targets()
    },
  }

  const restart = () => {
    loop?.stop()
    loop = undefined
    // A precompiled image stands in place of the canvases: nothing to paint.
    const canvas = ctx.precompiled ? undefined : canvasEl
    if (!canvas) return
    const { cols, rows } = backing()
    loop = startBarLoop({
      canvas,
      visible: isVisible,
      bloomCanvas: bloomEl ?? null,
      cols,
      rows,
      width: ctx.plot.width,
      state: stateBox,
      targets: targetsBox,
    })
  }

  onMount(restart)
  createEffect(on(() => [backing().cols, backing().rows, ctx.plot.width, ctx.precompiled], restart, { defer: true }))
  createEffect(
    on(
      () => ctx.ready,
      () => loop?.wake(),
      { defer: true },
    ),
  )
  createEffect(
    on(
      () => [
        targets(),
        ctx.revision,
        ctx.configKeys.map((key) => [key, ctx.config[key]?.color]),
        ctx.seriesSpecs,
        ctx.selectedDataKey,
        ctx.focusDataKey,
        ctx.hoverIndex,
        ctx.isMouseInChart,
        ctx.hovered,
        ctx.animate,
        ctx.animationDuration,
        ctx.animationDelay,
        ctx.easing,
        ctx.hoverLift,
        ctx.hoverStrength,
        ctx.dimOpacity,
        ctx.bloom,
        ctx.bloomOnHover,
      ],
      () => loop?.wake(),
      { defer: true },
    ),
  )
  onCleanup(() => loop?.stop())

  const pos = (): JSX.CSSProperties => ({
    position: "absolute",
    "pointer-events": "none",
    left: `${ctx.margins.left}px`,
    top: `${ctx.margins.top}px`,
    width: `${ctx.plot.width}px`,
    height: `${ctx.plot.height}px`,
  })
  const bloom = createMemo(() =>
    bloomLayerStyle(ctx.bloom, ctx.bloomOnHover ? ctx.isMouseInChart || ctx.hovered : true),
  )
  const bloomStyle = (): JSX.CSSProperties => {
    const b = bloom()
    return {
      ...pos(),
      transition: "opacity 220ms ease",
      ...(b
        ? {
            filter: b.filter,
            opacity: b.opacity,
            "mix-blend-mode": b.mixBlendMode,
            "image-rendering": b.imageRendering,
          }
        : { opacity: 0 }),
    }
  }

  return (
    <Show
      when={ctx.precompiled}
      fallback={
        <>
          <canvas ref={(el) => (canvasEl = el)} style={{ ...pos(), "image-rendering": "pixelated" }} />
          <canvas ref={(el) => (bloomEl = el)} style={bloomStyle()} />
        </>
      }
    >
      {(src) => <img src={src()} alt="" aria-hidden="true" style={{ ...pos(), "image-rendering": "pixelated" }} />}
    </Show>
  )
}
