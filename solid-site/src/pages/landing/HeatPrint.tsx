// A sheet of the heat (`heat.ts`) on the kit's background runtime, where
// its `field` lets it print: the close's band, a plate. Painted at a film's
// cadence while the page drives it (`paused` false), held otherwise, one
// still frame under reduced motion; it follows the hand over its box. It
// prints through the screen around it (`DitherScreen`). The close, while it
// runs, is painted off the main thread (`heat-offload.ts`); a still sheet
// (a plate, the close held) paints here.
import { mergeProps, onCleanup, onMount } from "solid-js"
import { fillOf } from "@dither-kit/engine/pixel"
import { createDitherBackground } from "@dither-kit/solid/runtime/surface"
import { useDitherMatrix } from "@dither-kit/solid/runtime/screen"
import { CLOSE, CLOSE_GRAIN, closeField, paintHeat, type HeatField, type HeatGrain } from "@/pages/landing/heat"
import { offloadHeat, spawnHeatWorker } from "@/pages/landing/heat-offload"
import { RAMP as INKS } from "@/pages/landing/plate"
import "./HeatPrint.css"

export type HeatPrintProps = { paused: boolean; field?: HeatField; grain?: HeatGrain; seed?: number }

const RAMP = INKS.map(fillOf)

export default function HeatPrint(raw: HeatPrintProps) {
  const props = mergeProps({ field: closeField, grain: CLOSE_GRAIN, seed: 9 }, raw)

  const matrix = useDitherMatrix(() => props.seed)
  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined

  let hand: [number, number] | null = null
  function point(e: PointerEvent) {
    const box = wrap?.getBoundingClientRect()
    if (!box) return
    const x = e.clientX - box.left
    const y = e.clientY - box.top
    hand = x >= 0 && y >= 0 && x <= box.width && y <= box.height ? [x, y] : null
  }
  const offload = offloadHeat(spawnHeatWorker)
  onMount(() => {
    addEventListener("pointermove", point, { passive: true })
    onCleanup(() => {
      removeEventListener("pointermove", point)
      offload.stop()
    })
  })
  const running = () => !props.paused && props.field === closeField && props.grain === CLOSE_GRAIN

  createDitherBackground({
    wrap: () => wrap ?? null,
    canvas: () => canvas ?? null,
    cell: CLOSE.cell,
    maxCols: 1200,
    maxRows: 900,
    dpr: () => 1,
    paused: () => props.paused,
    renderMode: () => "live",
    precompiled: () => undefined,
    restart: () => [props.field, props.grain, props.seed],
    frameRate: () => CLOSE.fps,
    render: (buffer, clock) =>
      running()
        ? offload.paint(buffer, clock, clock + 1 / CLOSE.fps, hand, RAMP, matrix())
        : paintHeat(buffer, clock, hand, CLOSE.cell, RAMP, matrix(), props.field, props.grain),
  })

  return (
    <div ref={(el) => (wrap = el)} aria-hidden="true" class="heat-print-scope heat-print">
      <canvas ref={(el) => (canvas = el)} style={{ "image-rendering": "pixelated" }} />
    </div>
  )
}
