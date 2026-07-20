<script lang="ts" module>
  import type { PixelBloomInput, PixelColor } from "./pixel"
  import {
    precompiledSrc,
    renderDitherGradient,
    STATIC_DEFAULT_MAX_COLS,
    STATIC_DEFAULT_MAX_ROWS,
    DEFAULT_MAX_COLS,
    DEFAULT_MAX_ROWS,
    type DitherRenderMode,
    type GradientDirection,
    type PrecompiledDither,
  } from "./precompile"
  import { putRasterBuffer } from "./raster"

  export type { DitherRenderMode, GradientDirection, PrecompiledDither }
</script>

<script lang="ts">
  import { cn } from "./lib"
  import { pixelBloomStyle } from "./pixel"
  import { kitFromSeed } from "./dither-paint"

  type Props = {
    from?: PixelColor
    to?: PixelColor | "transparent"
    direction?: GradientDirection
    cell?: number
    opacity?: number
    bloom?: PixelBloomInput
    seed?: number
    class?: string
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    maxCols?: number
    maxRows?: number
  }

  let {
    from,
    to,
    direction,
    cell,
    opacity,
    bloom,
    seed,
    class: className,
    renderMode = "live",
    precompiled: precompiledProp,
    maxCols: maxColsProp,
    maxRows: maxRowsProp,
  }: Props = $props()

  const s = $derived(seed !== undefined ? kitFromSeed(seed) : null)
  const effFrom = $derived<PixelColor>(from ?? s?.hue ?? "blue")
  const effTo = $derived<PixelColor | "transparent">(to ?? "transparent")
  const effDirection = $derived<GradientDirection>(direction ?? s?.direction ?? "up")
  const effCell = $derived(cell ?? s?.cell ?? 3)
  const effOpacity = $derived(opacity ?? s?.opacity ?? 1)
  const effBloom = $derived<PixelBloomInput>(bloom ?? (seed !== undefined ? seed : "off"))
  const precompiled = $derived(precompiledSrc(precompiledProp))

  /** Effective resolution caps: static mode auto-uses lower caps unless overridden. */
  const effMaxCols = $derived(
    maxColsProp ?? (renderMode === "static" ? STATIC_DEFAULT_MAX_COLS : DEFAULT_MAX_COLS)
  )
  const effMaxRows = $derived(
    maxRowsProp ?? (renderMode === "static" ? STATIC_DEFAULT_MAX_ROWS : DEFAULT_MAX_ROWS)
  )
  const bloomStyle = $derived(pixelBloomStyle(effBloom))

  let canvasEl = $state<HTMLCanvasElement | null>(null)
  let bloomEl = $state<HTMLCanvasElement | null>(null)

  type GradientParams = {
    canvas: HTMLCanvasElement | null
    bloom: HTMLCanvasElement | null
    from: PixelColor
    to: PixelColor | "transparent"
    direction: GradientDirection
    cell: number
    opacity: number
    seed: number | undefined
    maxCols: number
    maxRows: number
    renderMode: DitherRenderMode
    precompiled: string | undefined
    restartKey: string
    paintKey: string
  }

  /**
   * Local Svelte action owning the one-shot gradient paint and its resize/idle
   * scheduling — ported from the Vue component's paint/startRuntime/stopRuntime.
   * Actions are Svelte's DOM-lifecycle seam, so no `$effect` is needed.
   */
  function gradientCanvas(wrap: HTMLDivElement, initial: GradientParams) {
    let p = initial
    let ro: ResizeObserver | null = null
    let timer = 0
    let idleHandle = 0
    let token = 0
    let imageData: ImageData | undefined

    function paint() {
      const canvas = p.canvas
      if (!canvas || p.precompiled) return
      const box = wrap.getBoundingClientRect()
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return
      const raster = renderDitherGradient({
        width: box.width,
        height: box.height,
        from: p.from,
        to: p.to,
        direction: p.direction,
        cell: p.cell,
        opacity: p.opacity,
        seed: p.seed,
        maxCols: p.maxCols,
        maxRows: p.maxRows,
      })
      canvas.width = raster.width
      canvas.height = raster.height
      imageData = putRasterBuffer(ctx, raster, imageData)
      const bloomCtx = p.bloom?.getContext("2d")
      if (p.bloom && bloomCtx) {
        p.bloom.width = raster.width
        p.bloom.height = raster.height
        bloomCtx.drawImage(canvas, 0, 0)
      }
    }

    function stopRuntime() {
      clearTimeout(timer)
      timer = 0
      if (idleHandle) {
        if (typeof cancelIdleCallback === "function") cancelIdleCallback(idleHandle)
        idleHandle = 0
      }
      ro?.disconnect()
      ro = null
    }

    function startRuntime() {
      const my = ++token
      stopRuntime()
      if (p.precompiled) return
      if (p.renderMode === "static") {
        // Defer decorative paint to idle so it never blocks first contentful paint.
        // timeout ensures the callback fires even under heavy load (W3C spec).
        // Safari fallback: setTimeout(0) when requestIdleCallback is unavailable.
        if (typeof requestIdleCallback === "function") {
          idleHandle = requestIdleCallback(
            () => {
              idleHandle = 0
              if (my !== token || p.precompiled) return
              paint()
            },
            { timeout: 2000 }
          )
        } else {
          timer = window.setTimeout(() => {
            if (my !== token || p.precompiled) return
            paint()
          })
        }
      } else {
        // Live mode: paint immediately — interactive surfaces need to appear instantly.
        timer = window.setTimeout(() => {
          if (my !== token) return
          paint()
          if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(paint)
            ro.observe(wrap)
          }
        })
      }
    }

    startRuntime()

    return {
      update(next: GradientParams) {
        const restart = next.restartKey !== p.restartKey
        const repaint = next.paintKey !== p.paintKey
        p = next
        if (restart) startRuntime()
        else if (repaint) paint()
      },
      destroy() {
        token += 1
        stopRuntime()
      },
    }
  }

  const params = $derived<GradientParams>({
    canvas: canvasEl,
    bloom: bloomEl,
    from: effFrom,
    to: effTo,
    direction: effDirection,
    cell: effCell,
    opacity: effOpacity,
    seed,
    maxCols: effMaxCols,
    maxRows: effMaxRows,
    renderMode,
    precompiled,
    restartKey: JSON.stringify([precompiled, renderMode]),
    paintKey: JSON.stringify([
      effFrom,
      effTo,
      effDirection,
      effCell,
      effOpacity,
      effBloom,
      effMaxCols,
      effMaxRows,
      !!bloomEl,
    ]),
  })
</script>

<div
  use:gradientCanvas={params}
  aria-hidden="true"
  class={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
>
  {#if precompiled}
    <img
      src={precompiled}
      alt=""
      class="absolute inset-0 h-full w-full object-fill"
      style:image-rendering="pixelated"
    />
  {:else}
    <canvas
      bind:this={canvasEl}
      class="absolute inset-0 h-full w-full"
      style:image-rendering="pixelated"
    ></canvas>
  {/if}
  {#if precompiled && bloomStyle}
    <img
      src={precompiled}
      alt=""
      class="absolute inset-0 h-full w-full object-fill"
      style:filter={bloomStyle.filter}
      style:opacity={bloomStyle.opacity}
      style:mix-blend-mode={bloomStyle.mixBlendMode}
      style:image-rendering={bloomStyle.imageRendering}
    />
  {:else if bloomStyle}
    <canvas
      bind:this={bloomEl}
      class="absolute inset-0 h-full w-full"
      style:filter={bloomStyle.filter}
      style:opacity={bloomStyle.opacity}
      style:mix-blend-mode={bloomStyle.mixBlendMode}
      style:image-rendering={bloomStyle.imageRendering}
    ></canvas>
  {/if}
</div>
