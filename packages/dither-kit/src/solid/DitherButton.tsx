import { createEffect, createMemo, For, type JSX, mergeProps, on, onCleanup, onMount, Show, splitProps } from "solid-js"
import { kitFromSeed } from "../engine/dither-paint"
import { labelFill } from "../engine/label-fill"
import {
  fillOf,
  pixelBloomStyle,
  pixelPrefersReducedMotion,
  type PixelBloomInput,
  type PixelColor,
  screenMatrix,
} from "../engine/pixel"
import {
  DEFAULT_MAX_COLS,
  DEFAULT_MAX_ROWS,
  precompiledSrc,
  renderDitherButton,
  STATIC_DEFAULT_MAX_COLS,
  STATIC_DEFAULT_MAX_ROWS,
  type DitherRenderMode,
  type PrecompiledDither,
} from "../engine/precompile"
import { putRasterBuffer, type RasterBuffer } from "../engine/raster"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"

export type ButtonVariant = "gradient" | "dotted" | "hatched" | "solid"
export type { DitherRenderMode, PrecompiledDither }

type Own = {
  color?: PixelColor
  variant?: ButtonVariant
  bloom?: PixelBloomInput
  /** CSS px per dither cell: chunkiness. */
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
}
const OWN = [
  "color",
  "variant",
  "bloom",
  "cell",
  "seed",
  "type",
  "loading",
  "disabled",
  "class",
  "renderMode",
  "precompiled",
  "maxCols",
  "maxRows",
  "children",
] as const satisfies readonly (keyof Own | "children")[]

/** Everything a `<button>` takes (listeners, ARIA) reaches the button. */
export type DitherButtonProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own>

export default function DitherButton(raw: DitherButtonProps) {
  const merged = mergeProps(
    { type: "button" as const, loading: false, disabled: false, renderMode: "live" as DitherRenderMode },
    raw,
  )
  const [props, rest] = splitProps(merged, OWN)
  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  const color = createMemo<PixelColor>(() => props.color ?? s()?.hue ?? "blue")
  const variant = createMemo<ButtonVariant>(() => props.variant ?? s()?.variant ?? "gradient")
  // A bright fill takes black ink: the theme's would sink under AA. The
  // raster (`renderDitherButton`) prints the fill at the same call's tone.
  const darkInk = createMemo(
    () => labelFill(fillOf(color()), variant(), "premultiplied", screenMatrix("bayer", props.seed)).darkInk,
  )
  const bloom = createMemo<PixelBloomInput>(() => props.bloom ?? (props.seed !== undefined ? props.seed : "off"))
  const cell = createMemo(() => props.cell ?? s()?.cell ?? 2)

  /** Effective resolution caps: static mode uses lower caps unless overridden. */
  const effMaxCols = createMemo(
    () => props.maxCols ?? (props.renderMode === "static" ? STATIC_DEFAULT_MAX_COLS : DEFAULT_MAX_COLS),
  )
  const effMaxRows = createMemo(
    () => props.maxRows ?? (props.renderMode === "static" ? STATIC_DEFAULT_MAX_ROWS : DEFAULT_MAX_ROWS),
  )

  let button: HTMLButtonElement | undefined
  let canvas: HTMLCanvasElement | undefined
  let bloomCanvas: HTMLCanvasElement | undefined
  const bloomStyle = createMemo(() => pixelBloomStyle(bloom()))

  let teardown: (() => void) | undefined
  let restartToken = 0

  function init(): (() => void) | undefined {
    if (precompiled()) return undefined
    const el = button
    const surface = canvas
    const ctx = surface?.getContext("2d", { willReadFrequently: true })
    if (!el || !surface || !ctx) return undefined
    const glow = bloomCanvas
    const glowCtx = glow?.getContext("2d") ?? null
    const reduce = pixelPrefersReducedMotion()
    const animated = props.renderMode !== "static" && !reduce

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
          color: color(),
          variant: variant(),
          cell: 1,
          intensity,
          seed: props.seed,
          maxCols: effMaxCols(),
          maxRows: effMaxRows(),
        },
        raster,
      )
      imageData = putRasterBuffer(ctx, raster, imageData)
      if (glow && glowCtx) {
        glowCtx.clearRect(0, 0, cols, rows)
        glowCtx.drawImage(surface, 0, 0)
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

    const resizeTo = (width: number, height: number) => {
      const cellPx = Math.max(1, cell())
      // The canvas is the raster's size, caps included: a wider canvas would
      // leave what lies past the capped raster unpainted.
      cols = Math.max(4, Math.min(effMaxCols(), Math.round(width / cellPx)))
      rows = Math.max(4, Math.min(effMaxRows(), Math.round(height / cellPx)))
      surface.width = cols
      surface.height = rows
      if (glow) {
        glow.width = cols
        glow.height = rows
      }
      paint()
    }
    const resize = () => {
      const box = el.getBoundingClientRect()
      resizeTo(box.width, box.height)
    }

    const enter = () => {
      hovered = true
      setTarget(1)
    }
    const leave = () => {
      hovered = false
      setTarget(0)
    }
    const down = () => {
      if (!el.disabled) setTarget(1.5)
    }
    const up = () => setTarget(hovered ? 1 : 0)
    if (animated) {
      el.addEventListener("pointerenter", enter)
      el.addEventListener("pointerleave", leave)
      el.addEventListener("pointerdown", down)
      el.addEventListener("pointerup", up)
      el.addEventListener("pointercancel", up)
    }

    // Sized by the observer's own report (its first comes on observe, after
    // layout), never a layout read: a wall of buttons starting together read
    // each one's box after the last one's canvas write, a forced layout a
    // button. Without one (a static button), one read.
    const ro =
      props.renderMode !== "static" && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(([entry]) => {
            const box = entry?.borderBoxSize?.[0]
            if (box) resizeTo(box.inlineSize, box.blockSize)
            else resize()
          })
        : null
    if (ro) ro.observe(el)
    else resize()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      el.removeEventListener("pointerenter", enter)
      el.removeEventListener("pointerleave", leave)
      el.removeEventListener("pointerdown", down)
      el.removeEventListener("pointerup", up)
      el.removeEventListener("pointercancel", up)
      ro?.disconnect()
    }
  }

  function restartRuntime() {
    const token = ++restartToken
    teardown?.()
    teardown = undefined
    if (precompiled()) return
    // In a frame, after layout, so the box read inside `resize` is free.
    requestAnimationFrame(() => {
      if (token !== restartToken || precompiled()) return
      teardown = init()
    })
  }

  onMount(() => {
    restartRuntime()
    createEffect(
      on(
        [
          color,
          variant,
          bloom,
          cell,
          () => props.seed,
          precompiled,
          () => props.renderMode,
          () => props.loading,
          () => props.disabled,
          effMaxCols,
          effMaxRows,
        ],
        restartRuntime,
        { defer: true },
      ),
    )
  })
  onCleanup(() => {
    restartToken += 1
    teardown?.()
  })

  const glowStyle = (style: NonNullable<ReturnType<typeof pixelBloomStyle>>): JSX.CSSProperties => ({
    filter: style.filter,
    opacity: style.opacity,
    "mix-blend-mode": style.mixBlendMode,
    "image-rendering": style.imageRendering,
  })

  return (
    <button
      {...rest}
      ref={(el) => (button = el)}
      type={props.type}
      disabled={props.loading || props.disabled}
      aria-busy={props.loading || undefined}
      class={cn(
        CONTROL_BUTTON,
        "relative isolate inline-flex min-h-10 items-center justify-center gap-2 overflow-hidden rounded-md px-4 py-2 font-mono text-xs text-foreground transition-[opacity,scale] active:scale-[0.96] motion-reduce:transition-none",
        darkInk() && "text-black",
        props.class,
      )}
    >
      <Show
        when={precompiled()}
        fallback={
          <>
            <canvas
              ref={(el) => (canvas = el)}
              aria-hidden="true"
              class="absolute inset-0 -z-10 h-full w-full"
              style={{ "image-rendering": "pixelated" }}
            />
            <Show when={bloomStyle()}>
              {(style) => (
                <canvas
                  ref={(el) => (bloomCanvas = el)}
                  aria-hidden="true"
                  class="pointer-events-none absolute inset-0 -z-10 h-full w-full"
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
              aria-hidden="true"
              class="absolute inset-0 -z-10 h-full w-full object-fill"
              style={{ "image-rendering": "pixelated" }}
            />
            <Show when={bloomStyle()}>
              {(style) => (
                <img
                  src={src()}
                  alt=""
                  aria-hidden="true"
                  class="pointer-events-none absolute inset-0 -z-10 h-full w-full object-fill"
                  style={glowStyle(style())}
                />
              )}
            </Show>
          </>
        )}
      </Show>
      <Show when={props.loading}>
        <span aria-hidden="true" class="relative grid grid-cols-3 gap-0.5">
          <For each={[1, 2, 3]}>{() => <span class="size-1 bg-current opacity-70" />}</For>
        </span>
      </Show>
      <span class="relative">{props.children}</span>
    </button>
  )
}
