<script lang="ts" module>
  import type { PixelBloomInput, PixelColor } from "../engine/pixel"
  import {
    precompiledSrc,
    renderDitherButton,
    STATIC_DEFAULT_MAX_COLS,
    STATIC_DEFAULT_MAX_ROWS,
    DEFAULT_MAX_COLS,
    DEFAULT_MAX_ROWS,
    type DitherRenderMode,
    type PrecompiledDither,
  } from "../engine/precompile"
  import { putRasterBuffer, type RasterBuffer } from "../engine/raster"

  export type ButtonVariant = "gradient" | "dotted" | "hatched" | "solid"
  export type { DitherRenderMode, PrecompiledDither }
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLButtonAttributes } from "svelte/elements"
  import { cn } from "../runtime/lib"
  import { pixelBloomStyle, pixelPrefersReducedMotion } from "../engine/pixel"
  import { kitFromSeed } from "../engine/dither-paint"
  import { CONTROL_BUTTON } from "../runtime/control"

  type Props = {
    color?: PixelColor
    variant?: ButtonVariant
    bloom?: PixelBloomInput
    cell?: number
    seed?: number
    type?: "button" | "submit" | "reset"
    loading?: boolean
    disabled?: boolean
    class?: string
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    maxCols?: number
    maxRows?: number
    children?: Snippet
  } & Omit<HTMLButtonAttributes, "type" | "disabled" | "class">

  let {
    color: colorProp,
    variant: variantProp,
    bloom: bloomProp,
    cell: cellProp,
    seed,
    type = "button",
    loading = false,
    disabled = false,
    class: className,
    renderMode = "live",
    precompiled: precompiledProp,
    maxCols: maxColsProp,
    maxRows: maxRowsProp,
    children,
    ...rest
  }: Props = $props()

  const s = $derived(seed !== undefined ? kitFromSeed(seed) : null)
  const precompiled = $derived(precompiledSrc(precompiledProp))
  const color = $derived<PixelColor>(colorProp ?? s?.hue ?? "blue")
  const variant = $derived<ButtonVariant>(variantProp ?? s?.variant ?? "gradient")
  const bloom = $derived<PixelBloomInput>(bloomProp ?? (seed !== undefined ? seed : "off"))
  const cell = $derived(cellProp ?? s?.cell ?? 2)

  /** Effective resolution caps: static mode auto-uses lower caps unless overridden. */
  const effMaxCols = $derived(
    maxColsProp ?? (renderMode === "static" ? STATIC_DEFAULT_MAX_COLS : DEFAULT_MAX_COLS)
  )
  const effMaxRows = $derived(
    maxRowsProp ?? (renderMode === "static" ? STATIC_DEFAULT_MAX_ROWS : DEFAULT_MAX_ROWS)
  )

  const bloomStyle = $derived(pixelBloomStyle(bloom))

  let canvasEl = $state<HTMLCanvasElement | null>(null)
  let bloomEl = $state<HTMLCanvasElement | null>(null)

  type CanvasParams = {
    canvas: HTMLCanvasElement | null
    bloomCanvas: HTMLCanvasElement | null
    color: PixelColor
    variant: ButtonVariant
    cell: number
    seed: number | undefined
    renderMode: DitherRenderMode
    precompiled: string | undefined
    maxCols: number
    maxRows: number
    restartKey: string
  }

  /**
   * Local Svelte action owning the canvas paint loop and pointer easing. Ported
   * from the Vue component's `init()` — actions are Svelte's DOM-lifecycle seam,
   * so no `$effect` is needed. Deferring `init` through rAF avoids a forced
   * reflow, exactly as the Vue version does.
   */
  function buttonCanvas(button: HTMLButtonElement, initial: CanvasParams) {
    let p = initial
    let teardown: (() => void) | undefined
    let token = 0

    function init(): (() => void) | undefined {
      if (p.precompiled) return undefined
      const canvas = p.canvas
      const ctx = canvas?.getContext("2d", { willReadFrequently: true })
      if (!canvas || !ctx) return undefined
      const bloomCanvas = p.bloomCanvas
      const bloomCtx = bloomCanvas?.getContext("2d") ?? null
      const reduce = pixelPrefersReducedMotion()
      const animated = p.renderMode !== "static" && !reduce

      let cols = 0
      let rows = 0
      let intensity = 0
      let target = 0
      let hovered = false
      let raf = 0
      let raster: RasterBuffer | undefined
      let imageData: ImageData | undefined

      const paint = () => {
        raster = renderDitherButton(
          {
            width: cols,
            height: rows,
            color: p.color,
            variant: p.variant,
            cell: 1,
            intensity,
            seed: p.seed,
            maxCols: p.maxCols,
            maxRows: p.maxRows,
          },
          raster
        )
        imageData = putRasterBuffer(ctx, raster, imageData)
        if (bloomCanvas && bloomCtx) {
          bloomCtx.clearRect(0, 0, cols, rows)
          bloomCtx.drawImage(canvas, 0, 0)
        }
      }

      const tick = () => {
        const d = target - intensity
        if (Math.abs(d) < 0.01) {
          intensity = target
          paint()
          raf = 0
          return
        }
        intensity += d * 0.16
        paint()
        raf = requestAnimationFrame(tick)
      }

      const setTarget = (t: number) => {
        target = t
        if (reduce) {
          intensity = t
          paint()
        } else if (animated && !raf) {
          raf = requestAnimationFrame(tick)
        }
      }

      const resize = () => {
        const box = button.getBoundingClientRect()
        const cellPx = Math.max(1, p.cell)
        cols = Math.max(4, Math.round(box.width / cellPx))
        rows = Math.max(4, Math.round(box.height / cellPx))
        canvas.width = cols
        canvas.height = rows
        if (bloomCanvas) {
          bloomCanvas.width = cols
          bloomCanvas.height = rows
        }
        paint()
      }
      resize()

      const enter = () => {
        hovered = true
        setTarget(1)
      }
      const leave = () => {
        hovered = false
        setTarget(0)
      }
      const down = () => {
        if (!button.disabled) setTarget(1.5)
      }
      const up = () => setTarget(hovered ? 1 : 0)
      if (animated) {
        button.addEventListener("pointerenter", enter)
        button.addEventListener("pointerleave", leave)
        button.addEventListener("pointerdown", down)
        button.addEventListener("pointerup", up)
        button.addEventListener("pointercancel", up)
      }

      const ro =
        p.renderMode !== "static" && typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(resize)
          : null
      ro?.observe(button)

      return () => {
        if (raf) cancelAnimationFrame(raf)
        button.removeEventListener("pointerenter", enter)
        button.removeEventListener("pointerleave", leave)
        button.removeEventListener("pointerdown", down)
        button.removeEventListener("pointerup", up)
        button.removeEventListener("pointercancel", up)
        ro?.disconnect()
      }
    }

    function restart() {
      const my = ++token
      teardown?.()
      teardown = undefined
      if (p.precompiled) return
      requestAnimationFrame(() => {
        if (my !== token) return
        teardown = init()
      })
    }

    restart()

    return {
      update(next: CanvasParams) {
        const changed = next.restartKey !== p.restartKey
        p = next
        if (changed) restart()
      },
      destroy() {
        token += 1
        teardown?.()
      },
    }
  }

  const canvasParams = $derived<CanvasParams>({
    canvas: canvasEl,
    bloomCanvas: bloomEl,
    color,
    variant,
    cell,
    seed,
    renderMode,
    precompiled,
    maxCols: effMaxCols,
    maxRows: effMaxRows,
    restartKey: JSON.stringify([
      !!canvasEl,
      color,
      variant,
      bloom,
      cell,
      precompiled,
      renderMode,
      loading,
      disabled,
      effMaxCols,
      effMaxRows,
    ]),
  })
</script>

<button
  {type}
  disabled={loading || disabled}
  aria-busy={loading || undefined}
  use:buttonCanvas={canvasParams}
  class={cn(
    CONTROL_BUTTON,
    "relative isolate inline-flex min-h-10 items-center justify-center gap-2 overflow-hidden rounded-md px-4 py-2 font-mono text-xs text-foreground transition-[opacity,scale] active:scale-[0.96] motion-reduce:transition-none",
    className
  )}
  {...rest}
>
  {#if precompiled}
    <img
      src={precompiled}
      alt=""
      aria-hidden="true"
      class="absolute inset-0 -z-10 h-full w-full object-fill"
      style="image-rendering: pixelated"
    />
  {:else}
    <canvas
      bind:this={canvasEl}
      aria-hidden="true"
      class="absolute inset-0 -z-10 h-full w-full"
      style="image-rendering: pixelated"
    ></canvas>
  {/if}
  {#if precompiled && bloomStyle}
    <img
      src={precompiled}
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-10 h-full w-full object-fill"
      style:filter={bloomStyle.filter}
      style:opacity={bloomStyle.opacity}
      style:mix-blend-mode={bloomStyle.mixBlendMode}
      style:image-rendering={bloomStyle.imageRendering}
    />
  {:else if bloomStyle}
    <canvas
      bind:this={bloomEl}
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      style:filter={bloomStyle.filter}
      style:opacity={bloomStyle.opacity}
      style:mix-blend-mode={bloomStyle.mixBlendMode}
      style:image-rendering={bloomStyle.imageRendering}
    ></canvas>
  {/if}
  {#if loading}
    <span aria-hidden="true" class="relative grid grid-cols-3 gap-0.5">
      {#each Array(3) as _, n (n)}
        <span class="size-1 bg-current opacity-70"></span>
      {/each}
    </span>
  {/if}
  <span class="relative">{@render children?.()}</span>
</button>
