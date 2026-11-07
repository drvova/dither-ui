<script lang="ts">
  // A sheet of the heat (`heat.ts`, the Vue landing's painter byte for byte)
  // on the kit's background runtime, where its `field` lets it print: the
  // close's band, a plate. Painted at a film's cadence while the page drives
  // it, held otherwise, one still frame under reduced motion; it follows the
  // hand over its box and prints through the screen around it.
  import { onMount } from "svelte"
  import { fillOf } from "@dither-kit/engine/pixel"
  import { ditherBackground } from "../../../dither-kit-svelte/runtime/use-dither-background"
  import { useDitherMatrix } from "../../../dither-kit-svelte/runtime/screen"
  import { CLOSE, closeField, paintHeat, type HeatField } from "./heat"
  import { RAMP as INKS } from "./plate"

  let { paused, field = closeField }: { paused: boolean; field?: HeatField } = $props()

  const RAMP = INKS.map(fillOf)
  const ditherMatrix = useDitherMatrix()
  const matrix = $derived(ditherMatrix(9))

  let wrapEl = $state<HTMLDivElement | null>(null)
  let canvasEl = $state<HTMLCanvasElement | null>(null)

  let hand: [number, number] | null = null
  function point(e: PointerEvent) {
    const box = wrapEl?.getBoundingClientRect()
    if (!box) return
    const x = e.clientX - box.left
    const y = e.clientY - box.top
    hand = x >= 0 && y >= 0 && x <= box.width && y <= box.height ? [x, y] : null
  }
  onMount(() => {
    addEventListener("pointermove", point, { passive: true })
    return () => removeEventListener("pointermove", point)
  })

  const bg = $derived({
    canvas: canvasEl,
    cell: CLOSE.cell,
    maxCols: 1200,
    maxRows: 900,
    dpr: 1,
    paused,
    frameRate: CLOSE.fps,
    restartKey: "heat",
    render: (buffer: Parameters<typeof paintHeat>[0], clock: number) =>
      paintHeat(buffer, clock, hand, CLOSE.cell, RAMP, matrix, field),
  })
</script>

<div bind:this={wrapEl} use:ditherBackground={bg} aria-hidden="true" class="close-heat">
  <canvas bind:this={canvasEl} style:image-rendering="pixelated"></canvas>
</div>

<style>
  .close-heat {
    position: absolute;
    inset: 0;
    z-index: -1;
    overflow: hidden;
  }

  .close-heat canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
</style>
