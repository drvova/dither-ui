import { createEffect, createMemo, type JSX, mergeProps, on, onCleanup, onMount, Show } from "solid-js"
import { bakedSettled } from "../engine/baked"
import { directedTime, isDirected, onSeek } from "../engine/clock"
import { rasterSrc } from "../engine/png"
import { cellWriter, clearRasterBuffer, createRasterBuffer, putRasterBuffer, type RasterBuffer } from "../engine/raster"
import { type AvatarPattern, clampGrid, normalizePattern, seededPattern } from "../engine/avatar-pattern"
import { kitFromSeed } from "../engine/dither-paint"
import {
  clamp01,
  fillOf,
  hueFill,
  type PixelBloomInput,
  type PixelColor,
  pixelBloomStyle,
  pixelPrefersReducedMotion,
} from "../engine/pixel"
import { cn } from "../tailwind/lib"
import { useDitherMatrix } from "./runtime/screen"

// Defaults: 8×8 cells mirrored across one axis → 32 free pattern bits. With
// the mirror axis bit and 180 hues that's ≈ 1.5 trillion distinct avatars.
// Both are now props — `grid` (even, 4–16) and `cellPx` drive the resolution.

export type AvatarMirror = "auto" | "horizontal" | "vertical"

type AvatarModel = {
  grid: number
  on: boolean[]
  density: number[]
  fill: [number, number, number]
}

function avatarModel(
  name: string,
  colorProp: PixelColor | undefined,
  mirrorProp: AvatarMirror,
  gridProp: number,
  patternProp: AvatarPattern | undefined,
): AvatarModel {
  const grid = clampGrid(gridProp)
  const seeded = seededPattern(name, grid, mirrorProp)
  const fill = colorProp != null ? fillOf(colorProp) : hueFill(seeded.drawnHue)
  // An explicit pattern (drawn cells or a dithered image) overrides the seed;
  // the colour still derives from the name unless overridden.
  if (patternProp) {
    const { on, density } = normalizePattern(patternProp, grid)
    return { grid, on, density, fill }
  }
  return { grid, on: seeded.on, density: seeded.density, fill }
}

type PaintOpts = {
  duration: number
  cellPx: number
  boost: number // additive per-cell density bias
  offTier: number // alpha tier of unlit backing pixels
}

/** The avatar `progress` into its entrance (1: whole), a pixel a backing
 * cell; into `out` when given (the entrance's frames reuse one). */
function avatarFrame(
  model: AvatarModel,
  matrix: number[][],
  progress: number,
  { cellPx, boost, offTier }: Pick<PaintOpts, "cellPx" | "boost" | "offTier">,
  out?: RasterBuffer,
): RasterBuffer {
  const grid = model.grid
  const cp = Math.max(1, Math.round(cellPx))
  const px = grid * cp
  const raster = out?.width === px ? out : createRasterBuffer(px, px)
  clearRasterBuffer(raster)
  const cells = cellWriter(raster)
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      if (!model.on[r * grid + c]) continue
      const start = matrix[r % 4][c % 4] * 0.7
      const cellAlpha = clamp01((progress - start) / 0.3)
      if (cellAlpha <= 0) continue
      const density = clamp01(model.density[r * grid + c] + boost)
      const base = 0.35 + 0.65 * density
      for (let py = 0; py < cp; py++) {
        for (let pxi = 0; pxi < cp; pxi++) {
          const gx = c * cp + pxi
          const gy = r * cp + py
          const lit = density > matrix[gy & 3][gx & 3]
          const alpha = (lit ? base : base * offTier) * cellAlpha
          cells.cell(gx, gy, model.fill, alpha)
        }
      }
    }
  }
  return raster
}

function paintAvatar(
  canvas: HTMLCanvasElement,
  bloomCanvas: HTMLCanvasElement | null,
  model: AvatarModel,
  matrix: number[][],
  { duration, ...opts }: PaintOpts,
): (() => void) | undefined {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return undefined
  const bloomCtx = bloomCanvas?.getContext("2d") ?? null
  let raster: RasterBuffer | undefined
  let image: ImageData | undefined

  const draw = (progress: number) => {
    raster = avatarFrame(model, matrix, progress, opts, raster)
    if (canvas.width !== raster.width) {
      canvas.width = canvas.height = raster.width
      if (bloomCanvas) bloomCanvas.width = bloomCanvas.height = raster.width
    }
    image = putRasterBuffer(ctx, raster, image)
    if (bloomCtx) {
      bloomCtx.clearRect(0, 0, raster.width, raster.width)
      bloomCtx.drawImage(canvas, 0, 0)
    }
  }

  // A canvas showing the build's settled frame starts where its entrance ends.
  if (pixelPrefersReducedMotion() || bakedSettled(canvas)) {
    draw(1)
    return undefined
  }

  let raf = 0
  const ease = (t: number) => 1 - (1 - clamp01(t)) ** 3
  // Directed (clock.ts): the entrance is at the moment's progress, no loop.
  const paintAt = (ms: number) => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    draw(ease(ms / duration))
  }
  const unseek = onSeek((ms) => {
    if (ms !== null) paintAt(ms)
  })
  if (isDirected()) {
    paintAt(directedTime() ?? 0)
  } else {
    const startTime = performance.now()
    const tick = (now: number) => {
      const t = clamp01((now - startTime) / duration)
      draw(ease(t))
      if (t < 1 && !isDirected()) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  }
  return () => {
    cancelAnimationFrame(raf)
    unseek()
  }
}

export type DitherAvatarProps = {
  name: string
  /** Colour override — palette name, hue number, or hex. Derived from the
   * name when omitted (or when the legacy `hue` prop is set). */
  color?: PixelColor
  /** @docs number (px) */
  size?: number
  /** @docs number 0…360
   * @default from name */
  hue?: number
  /** @docs "auto" | "on" | "off" */
  mirror?: AvatarMirror
  grid?: number // even cell count per side (4–16)
  /** Explicit cells (drawn or image-derived) — overrides the seeded pattern. */
  pattern?: AvatarPattern
  cellPx?: number // backing px per cell — dither resolution inside a cell
  density?: number // additive density bias (-0.5–0.5)
  offTier?: number // 0–1 alpha of unlit backing pixels
  seed?: number
  animate?: boolean
  /** @docs "off" | "low" | "high" | "aura"
   * @default "off" */
  bloom?: PixelBloomInput
  animationDuration?: number
  replayToken?: number
  class?: string
}

export default function DitherAvatar(raw: DitherAvatarProps) {
  const props = mergeProps(
    {
      mirror: "auto" as AvatarMirror,
      grid: 8,
      cellPx: 4,
      density: 0,
      offTier: 0.35,
      animate: true,
      animationDuration: 600,
      replayToken: 0,
    },
    raw,
  )

  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const effHue = createMemo(() => props.hue ?? s()?.hue)
  const effBloom = createMemo<PixelBloomInput>(() => props.bloom ?? (props.seed !== undefined ? props.seed : "off"))
  const matrix = useDitherMatrix(() => props.seed)

  let canvas: HTMLCanvasElement | undefined
  let bloomCanvas: HTMLCanvasElement | undefined
  const bloomStyle = createMemo(() => pixelBloomStyle(effBloom()))

  const model = () => avatarModel(props.name, props.color ?? effHue(), props.mirror, props.grid, props.pattern)
  const opts = () => ({ cellPx: props.cellPx, boost: props.density, offTier: props.offTier })
  // An avatar that does not enter is one frame known at render: printed once
  // at a pixel a backing cell (on the server too) and scaled crisp, no canvas.
  const still = createMemo(() => (props.animate ? undefined : rasterSrc(avatarFrame(model(), matrix(), 1, opts()))))

  let teardown: (() => void) | undefined
  function paint() {
    teardown?.()
    teardown = undefined
    if (!canvas || still()) return
    teardown = paintAvatar(canvas, bloomStyle() ? (bloomCanvas ?? null) : null, model(), matrix(), {
      duration: props.animationDuration,
      ...opts(),
    })
  }

  onMount(() => {
    paint()
    createEffect(
      on(
        () => [
          props.name,
          props.color,
          props.hue,
          props.mirror,
          props.grid,
          props.cellPx,
          props.density,
          props.offTier,
          props.animate,
          props.animationDuration,
          props.replayToken,
          props.bloom,
          props.pattern,
          props.seed,
          matrix(),
        ],
        paint,
        { defer: true },
      ),
    )
  })
  onCleanup(() => teardown?.())

  const glowStyle = (style: NonNullable<ReturnType<typeof pixelBloomStyle>>): JSX.CSSProperties => ({
    filter: style.filter,
    opacity: style.opacity,
    "mix-blend-mode": style.mixBlendMode,
    "image-rendering": style.imageRendering,
  })

  return (
    <div
      role="img"
      aria-label={`${props.name} avatar`}
      class={cn("relative", props.class)}
      style={props.size != null ? { width: `${props.size}px`, height: `${props.size}px` } : undefined}
    >
      <Show
        when={still()}
        fallback={
          <>
            <canvas
              ref={(el) => (canvas = el)}
              class="absolute inset-0 h-full w-full"
              style={{ "image-rendering": "pixelated" }}
            />
            <Show when={bloomStyle()}>
              {(style) => (
                <canvas
                  ref={(el) => (bloomCanvas = el)}
                  class="pointer-events-none absolute inset-0 h-full w-full"
                  style={glowStyle(style())}
                />
              )}
            </Show>
          </>
        }
      >
        {(src) => (
          <>
            <img src={src()} alt="" class="absolute inset-0 h-full w-full" style={{ "image-rendering": "pixelated" }} />
            <Show when={bloomStyle()}>
              {(style) => (
                <img
                  src={src()}
                  alt=""
                  class="pointer-events-none absolute inset-0 h-full w-full"
                  style={glowStyle(style())}
                />
              )}
            </Show>
          </>
        )}
      </Show>
    </div>
  )
}
