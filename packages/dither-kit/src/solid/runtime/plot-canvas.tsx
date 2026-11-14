// Solid's binding of every chart family's canvases: the dither canvas and its
// bloom layer over the plot (or the precompiled image in their place), and
// the paint loop a family starts on them (`engine/chart-loop.ts`), restarted
// when the backing or the plot changes and woken when what it paints does.

import { type Accessor, createEffect, createMemo, type JSX, on, onCleanup, onMount, Show } from "solid-js"
import type { ChartLoop } from "../../engine/chart-loop"
import type { ChartContextValue, PolarChartContextValue } from "../../engine/chart-types"
import { bloomLayerStyle } from "../../engine/dither-paint"
import { createCanvasVisibility } from "./visibility"

type Plotted = Pick<
  ChartContextValue & PolarChartContextValue,
  "margins" | "plot" | "precompiled" | "ready" | "bloom" | "bloomOnHover"
>

/** What a family's loop is started with. */
export type PlotStart = {
  canvas: HTMLCanvasElement
  bloomCanvas: HTMLCanvasElement | null
  visible: () => boolean
  cols: number
  rows: number
}

export type PlotCanvasProps = {
  chart: Plotted
  /** The backing raster's size, in cells. */
  backing: Accessor<{ cols: number; rows: number }>
  /** Start the family's loop on the canvases. */
  start: (s: PlotStart) => ChartLoop | undefined
  /** Besides the backing and the precompiled image, what restarts the loop. */
  restartOn: () => unknown
  /** What the loop paints from: a change wakes it. */
  wakeOn: () => unknown
  /** Whether the pointer shows the bloom layer under `bloomOnHover`. */
  hover: boolean
}

export function PlotCanvas(props: PlotCanvasProps) {
  let canvasEl: HTMLCanvasElement | undefined
  let bloomEl: HTMLCanvasElement | undefined
  let loop: ChartLoop | undefined
  const isVisible = createCanvasVisibility(
    () => canvasEl,
    () => loop?.wake(),
  )

  const restart = () => {
    loop?.stop()
    loop = undefined
    // A precompiled image stands in place of the canvases: nothing to paint.
    const canvas = props.chart.precompiled ? undefined : canvasEl
    if (!canvas) return
    const { cols, rows } = props.backing()
    loop = props.start({ canvas, bloomCanvas: bloomEl ?? null, visible: isVisible, cols, rows })
  }

  onMount(restart)
  createEffect(
    on(() => [props.backing().cols, props.backing().rows, props.restartOn(), props.chart.precompiled], restart, {
      defer: true,
    }),
  )
  // Wake the loop as the chart becomes ready (dimensions > 0): it covers
  // the race where the IntersectionObserver fires before the ResizeObserver
  // and the restart found the canvas not yet visible.
  createEffect(
    on(
      () => props.chart.ready,
      () => loop?.wake(),
      { defer: true },
    ),
  )
  createEffect(on(props.wakeOn, () => loop?.wake(), { defer: true }))
  onCleanup(() => loop?.stop())

  const pos = (): JSX.CSSProperties => ({
    position: "absolute",
    "pointer-events": "none",
    left: `${props.chart.margins.left}px`,
    top: `${props.chart.margins.top}px`,
    width: `${props.chart.plot.width}px`,
    height: `${props.chart.plot.height}px`,
  })
  const bloom = createMemo(() => bloomLayerStyle(props.chart.bloom, props.chart.bloomOnHover ? props.hover : true))
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
      when={props.chart.precompiled}
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
