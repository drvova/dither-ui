// Generated from ../solid/DitherButton.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, For, type JSX, mergeProps, on, onCleanup, onMount, Show, splitProps } from "solid-js"
import { kitFromSeed } from "../engine/dither-paint"
import { darkInkOnDark, LABEL_COVERAGE } from "../engine/palette"
import {
  fillOf,
  pixelBloomStyle,
  pixelPrefersReducedMotion,
  type PixelBloomInput,
  type PixelColor,
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
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", inset: "0px", zIndex: "-10", height: "100%", width: "100%" },
  canvas2: {
    pointerEvents: "none",
    position: "absolute",
    inset: "0px",
    zIndex: "-10",
    height: "100%",
    width: "100%",
  },
  img: {
    position: "absolute",
    inset: "0px",
    zIndex: "-10",
    height: "100%",
    width: "100%",
    objectFit: "fill",
  },
  img2: {
    pointerEvents: "none",
    position: "absolute",
    inset: "0px",
    zIndex: "-10",
    height: "100%",
    width: "100%",
    objectFit: "fill",
  },
  grid: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "0.125rem",
  },
  text: { width: "0.25rem", height: "0.25rem", backgroundColor: "currentcolor", opacity: "70%" },
  frame: { position: "relative" },
  button: {
    position: "relative",
    isolation: "isolate",
    display: "inline-flex",
    minHeight: "2.5rem",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--foreground)",
    transitionProperty: { default: "opacity, scale", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    scale: { default: null, ":active": "0.96" },
  },
  textBlack: { color: "#000" },
})

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
  xstyle?: StyleProp
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
  "xstyle",
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
  // A bright fill takes black ink: white on it would sink under AA. The
  // raster stores its colour already scaled by alpha: the band is coverage².
  const darkInk = createMemo(() => darkInkOnDark(fillOf(color()), LABEL_COVERAGE[variant()] ** 2))
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
      class={cn(CONTROL_BUTTON, styles.button, darkInk() && styles.textBlack, props.xstyle, props.class)}
    >
      <Show
        when={precompiled()}
        fallback={
          <>
            <canvas
              ref={(el) => (canvas = el)}
              aria-hidden="true"
              {...stylex.props(styles.canvas)}
              style={{ "image-rendering": "pixelated" }}
            />
            <Show when={bloomStyle()}>
              {(style) => (
                <canvas
                  ref={(el) => (bloomCanvas = el)}
                  aria-hidden="true"
                  {...stylex.props(styles.canvas2)}
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
              {...stylex.props(styles.img)}
              style={{ "image-rendering": "pixelated" }}
            />
            <Show when={bloomStyle()}>
              {(style) => (
                <img src={src()} alt="" aria-hidden="true" {...stylex.props(styles.img2)} style={glowStyle(style())} />
              )}
            </Show>
          </>
        )}
      </Show>
      <Show when={props.loading}>
        <span aria-hidden="true" {...stylex.props(styles.grid)}>
          <For each={[1, 2, 3]}>{() => <span {...stylex.props(styles.text)} />}</For>
        </span>
      </Show>
      <span {...stylex.props(styles.frame)}>{props.children}</span>
    </button>
  )
}
