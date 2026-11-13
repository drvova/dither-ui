import { createEffect, createMemo, type JSX, mergeProps, on, onCleanup, onMount, Show } from "solid-js"
import { kitFromSeed } from "../engine/dither-paint"
import { pixelBloomStyle, type PixelBloomInput, type PixelColor } from "../engine/pixel"
import {
  DEFAULT_MAX_COLS,
  DEFAULT_MAX_ROWS,
  precompiledSrc,
  renderDitherGradient,
  STATIC_DEFAULT_MAX_COLS,
  STATIC_DEFAULT_MAX_ROWS,
  type DitherRenderMode,
  type GradientDirection,
  type PrecompiledDither,
} from "../engine/precompile"
import { putRasterBuffer } from "../engine/raster"
import { cn } from "../tailwind/lib"
import { useScreen } from "./runtime/screen"

export type { DitherRenderMode, GradientDirection, PrecompiledDither }

export type DitherGradientProps = {
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

export default function DitherGradient(raw: DitherGradientProps) {
  const props = mergeProps({ renderMode: "live" as DitherRenderMode }, raw)
  const screen = useScreen()

  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const effFrom = createMemo(() => props.from ?? s()?.hue ?? "blue")
  const effTo = createMemo(() => props.to ?? "transparent")
  const effDirection = createMemo(() => props.direction ?? s()?.direction ?? "up")
  const effCell = createMemo(() => props.cell ?? s()?.cell ?? 3)
  const effOpacity = createMemo(() => props.opacity ?? s()?.opacity ?? 1)
  const effBloom = createMemo<PixelBloomInput>(() => props.bloom ?? (props.seed !== undefined ? props.seed : "off"))
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))

  /** Effective resolution caps: static mode auto-uses lower caps unless overridden. */
  const effMaxCols = createMemo(() => {
    if (props.maxCols !== undefined) return props.maxCols
    return props.renderMode === "static" ? STATIC_DEFAULT_MAX_COLS : DEFAULT_MAX_COLS
  })
  const effMaxRows = createMemo(() => {
    if (props.maxRows !== undefined) return props.maxRows
    return props.renderMode === "static" ? STATIC_DEFAULT_MAX_ROWS : DEFAULT_MAX_ROWS
  })
  let wrapEl: HTMLDivElement | undefined
  let canvasEl: HTMLCanvasElement | undefined
  let bloomEl: HTMLCanvasElement | undefined
  const bloomStyle = createMemo(() => pixelBloomStyle(effBloom()))

  let ro: ResizeObserver | null = null
  let timer = 0
  let idleHandle = 0
  let restartToken = 0
  let imageData: ImageData | undefined
  function paint() {
    const wrap = wrapEl
    const canvas = canvasEl
    if (!wrap || !canvas || !canvas.isConnected || precompiled()) return
    const box = wrap.getBoundingClientRect()
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    const raster = renderDitherGradient({
      width: box.width,
      height: box.height,
      from: effFrom(),
      to: effTo(),
      direction: effDirection(),
      cell: effCell(),
      opacity: effOpacity(),
      seed: props.seed,
      screen: screen?.(),
      maxCols: effMaxCols(),
      maxRows: effMaxRows(),
    })
    canvas.width = raster.width
    canvas.height = raster.height
    imageData = putRasterBuffer(ctx, raster, imageData)
    const bloom = bloomStyle() ? bloomEl : undefined
    const bloomCtx = bloom?.getContext("2d")
    if (bloom && bloomCtx) {
      bloom.width = raster.width
      bloom.height = raster.height
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
    const token = ++restartToken
    stopRuntime()
    if (precompiled()) return
    queueMicrotask(() => {
      if (token !== restartToken || precompiled()) return
      if (props.renderMode === "static") {
        // Defer decorative paint to idle so it never blocks first contentful paint.
        // timeout ensures the callback fires even under heavy load (W3C spec).
        // Safari fallback: setTimeout(0) when requestIdleCallback is unavailable.
        if (typeof requestIdleCallback === "function") {
          idleHandle = requestIdleCallback(
            () => {
              idleHandle = 0
              if (token !== restartToken || precompiled()) return
              paint()
            },
            { timeout: 2000 },
          )
        } else {
          timer = window.setTimeout(() => {
            if (token !== restartToken || precompiled()) return
            paint()
          })
        }
      } else {
        // Live mode: paint immediately — interactive surfaces need to appear instantly.
        timer = window.setTimeout(() => {
          paint()
          if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(paint)
            if (wrapEl) ro.observe(wrapEl)
          }
        })
      }
    })
  }

  onMount(() => {
    startRuntime()
    createEffect(on([precompiled, () => props.renderMode], startRuntime, { defer: true }))
    createEffect(
      on(
        [
          effFrom,
          effTo,
          effDirection,
          effCell,
          effOpacity,
          effBloom,
          effMaxCols,
          effMaxRows,
          () => props.seed,
          () => screen?.(),
        ],
        paint,
        { defer: true },
      ),
    )
  })
  onCleanup(() => {
    restartToken += 1
    stopRuntime()
  })

  const glowStyle = (style: NonNullable<ReturnType<typeof pixelBloomStyle>>): JSX.CSSProperties => ({
    filter: style.filter,
    opacity: style.opacity,
    "mix-blend-mode": style.mixBlendMode,
    "image-rendering": style.imageRendering,
  })

  return (
    <div
      ref={(el) => (wrapEl = el)}
      aria-hidden="true"
      class={cn("pointer-events-none absolute inset-0 overflow-hidden", props.class)}
    >
      <Show
        when={precompiled()}
        fallback={
          <>
            <canvas
              ref={(el) => (canvasEl = el)}
              class="absolute inset-0 h-full w-full"
              style={{ "image-rendering": "pixelated" }}
            />
            <Show when={bloomStyle()}>
              {(style) => (
                <canvas
                  ref={(el) => (bloomEl = el)}
                  class="absolute inset-0 h-full w-full"
                  style={glowStyle(style())}
                />
              )}
            </Show>
          </>
        }
      >
        {(src) => (
          <>
            <img
              src={src()}
              alt=""
              class="absolute inset-0 h-full w-full object-fill"
              style={{ "image-rendering": "pixelated" }}
            />
            <Show when={bloomStyle()}>
              {(style) => (
                <img src={src()} alt="" class="absolute inset-0 h-full w-full object-fill" style={glowStyle(style())} />
              )}
            </Show>
          </>
        )}
      </Show>
    </div>
  )
}
