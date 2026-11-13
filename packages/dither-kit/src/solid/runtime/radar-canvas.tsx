// Solid's binding of the radar chart canvas: it mounts the canvases and
// starts the framework-free paint loop (`engine/radar-loop.ts`).

import { createEffect, createMemo, type JSX, on, onCleanup, onMount, Show } from "solid-js"
import type { Box, PolarChartContextValue } from "../../engine/chart-types"
import { backingSize, bloomLayerStyle } from "../../engine/dither-paint"
import { startRadarLoop } from "../../engine/radar-loop"
import { usePolarChart } from "./polar-context"
import { createCanvasVisibility } from "./visibility"

/** Dither canvas for radar charts — polygon-membership dither, scale-in. */
export function RadarCanvas() {
  const ctx = usePolarChart()
  let canvasEl: HTMLCanvasElement | undefined
  let bloomEl: HTMLCanvasElement | undefined
  let loop: { stop: () => void; wake: () => void } | undefined
  const isVisible = createCanvasVisibility(
    () => canvasEl,
    () => loop?.wake(),
  )
  const backing = createMemo(() => backingSize(ctx.plot.width, ctx.plot.height, ctx.cell))
  const stateBox: Box<PolarChartContextValue> = { current: ctx }

  const restart = () => {
    loop?.stop()
    loop = undefined
    // A precompiled image stands in place of the canvases: nothing to paint.
    const canvas = ctx.precompiled ? undefined : canvasEl
    if (!canvas) return
    const { cols, rows } = backing()
    loop = startRadarLoop({
      canvas,
      visible: isVisible,
      bloomCanvas: bloomEl ?? null,
      cols,
      rows,
      width: ctx.plot.width,
      height: ctx.plot.height,
      state: stateBox,
    })
  }

  onMount(restart)
  createEffect(
    on(() => [backing().cols, backing().rows, ctx.plot.width, ctx.plot.height, ctx.precompiled], restart, {
      defer: true,
    }),
  )
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
        ctx.radar,
        ctx.revision,
        ctx.variantRevision,
        ctx.configKeys.map((key) => [key, ctx.config[key]?.color]),
        ctx.selectedDataKey,
        ctx.focusDataKey,
        ctx.hoverIndex,
        ctx.isMouseInChart,
        ctx.animate,
        ctx.animationDuration,
        ctx.animationDelay,
        ctx.easing,
        ctx.hoverLift,
        ctx.hoverStrength,
        ctx.dimOpacity,
        ctx.outerRadius,
        ctx.falloff,
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
  const bloom = createMemo(() => bloomLayerStyle(ctx.bloom, ctx.bloomOnHover ? ctx.isMouseInChart : true))
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
