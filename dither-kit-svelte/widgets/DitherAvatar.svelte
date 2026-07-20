<script lang="ts" module>
  import { rgb } from "../engine/palette"
  import {
    type AvatarPattern,
    clampGrid,
    normalizePattern,
    seededPattern,
  } from "../engine/avatar-pattern"
  import {
    BAYER4,
    clamp01,
    fillOf,
    hueFill,
    pixelMatrixFromSeed,
    type PixelBloomInput,
    type PixelColor,
    pixelPrefersReducedMotion,
  } from "../engine/pixel"

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
    patternProp: AvatarPattern | undefined
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
    animate: boolean
    duration: number
    cellPx: number
    boost: number // additive per-cell density bias
    offTier: number // alpha tier of unlit backing pixels
  }

  function paintAvatar(
    canvas: HTMLCanvasElement,
    bloomCanvas: HTMLCanvasElement | null,
    model: AvatarModel,
    matrix: number[][],
    { animate, duration, cellPx, boost, offTier }: PaintOpts
  ): (() => void) | undefined {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return undefined
    const grid = model.grid
    const cp = Math.max(1, Math.round(cellPx))
    const px = grid * cp
    canvas.width = px
    canvas.height = px
    const bloomCtx = bloomCanvas?.getContext("2d") ?? null
    if (bloomCanvas) {
      bloomCanvas.width = px
      bloomCanvas.height = px
    }

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, px, px)
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
              ctx.fillStyle = rgb(model.fill, 1, alpha)
              ctx.fillRect(gx, gy, 1, 1)
            }
          }
        }
      }
      if (bloomCtx) {
        bloomCtx.clearRect(0, 0, px, px)
        bloomCtx.drawImage(canvas, 0, 0)
      }
    }

    if (!animate || pixelPrefersReducedMotion()) {
      draw(1)
      return undefined
    }

    let raf = 0
    const startTime = performance.now()
    const tick = (now: number) => {
      const t = clamp01((now - startTime) / duration)
      draw(1 - (1 - t) ** 3)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }
</script>

<script lang="ts">
  import { cn } from "../runtime/lib"
  import { pixelBloomStyle } from "../engine/pixel"
  import { kitFromSeed } from "../engine/dither-paint"

  type Props = {
    name: string
    /** Colour override — palette name, hue number, or hex. Derived from the
     * name when omitted (or when the legacy `hue` prop is set). */
    color?: PixelColor
    hue?: number
    mirror?: AvatarMirror
    size?: number
    grid?: number // even cell count per side (4–16)
    /** Explicit cells (drawn or image-derived) — overrides the seeded pattern. */
    pattern?: AvatarPattern
    cellPx?: number // backing px per cell — dither resolution inside a cell
    density?: number // additive density bias (-0.5–0.5)
    offTier?: number // 0–1 alpha of unlit backing pixels
    bloom?: PixelBloomInput
    seed?: number
    animate?: boolean
    animationDuration?: number
    replayToken?: number
    class?: string
  }

  let {
    name,
    color,
    hue,
    mirror = "auto",
    size,
    grid = 8,
    pattern,
    cellPx = 4,
    density = 0,
    offTier = 0.35,
    bloom,
    seed,
    animate = true,
    animationDuration = 600,
    replayToken = 0,
    class: className,
  }: Props = $props()

  const s = $derived(seed !== undefined ? kitFromSeed(seed) : null)
  const effHue = $derived(hue ?? s?.hue)
  const colorOrHue = $derived<PixelColor | undefined>(color ?? effHue)
  const effBloom = $derived<PixelBloomInput>(bloom ?? (seed !== undefined ? seed : "off"))
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)
  const bloomStyle = $derived(pixelBloomStyle(effBloom))

  let canvasEl = $state<HTMLCanvasElement | null>(null)
  let bloomEl = $state<HTMLCanvasElement | null>(null)

  type AvatarParams = {
    canvas: HTMLCanvasElement | null
    bloomCanvas: HTMLCanvasElement | null
    name: string
    color: PixelColor | undefined
    mirror: AvatarMirror
    grid: number
    pattern: AvatarPattern | undefined
    matrix: number[][]
    animate: boolean
    animationDuration: number
    cellPx: number
    density: number
    offTier: number
    restartKey: string
  }

  /**
   * Local Svelte action owning the avatar paint pass. Vue re-runs `paint` from a
   * single broad watcher; here `restartKey` collapses the same source list, and
   * the paint is deferred through rAF so `bind:this` on both canvases is settled
   * before the first draw — no `$effect` needed.
   */
  function avatarCanvas(_root: HTMLDivElement, initial: AvatarParams) {
    let p = initial
    let teardown: (() => void) | undefined
    let token = 0

    function paint() {
      teardown?.()
      teardown = undefined
      const canvas = p.canvas
      if (!canvas) return
      teardown = paintAvatar(
        canvas,
        p.bloomCanvas,
        avatarModel(p.name, p.color, p.mirror, p.grid, p.pattern),
        p.matrix,
        {
          animate: p.animate,
          duration: p.animationDuration,
          cellPx: p.cellPx,
          boost: p.density,
          offTier: p.offTier,
        }
      )
    }

    function restart() {
      const my = ++token
      teardown?.()
      teardown = undefined
      requestAnimationFrame(() => {
        if (my !== token) return
        paint()
      })
    }

    restart()

    return {
      update(next: AvatarParams) {
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

  const params = $derived<AvatarParams>({
    canvas: canvasEl,
    bloomCanvas: bloomEl,
    name,
    color: colorOrHue,
    mirror,
    grid,
    pattern,
    matrix,
    animate,
    animationDuration,
    cellPx,
    density,
    offTier,
    restartKey: JSON.stringify([
      !!canvasEl,
      !!bloomEl,
      name,
      color,
      hue,
      mirror,
      grid,
      cellPx,
      density,
      offTier,
      animate,
      animationDuration,
      replayToken,
      bloom,
      pattern,
      seed,
    ]),
  })
</script>

<div
  role="img"
  aria-label={`${name} avatar`}
  use:avatarCanvas={params}
  class={cn("relative", className)}
  style:width={size != null ? `${size}px` : undefined}
  style:height={size != null ? `${size}px` : undefined}
>
  <canvas
    bind:this={canvasEl}
    class="absolute inset-0 h-full w-full"
    style="image-rendering: pixelated"
  ></canvas>
  {#if bloomStyle}
    <canvas
      bind:this={bloomEl}
      class="pointer-events-none absolute inset-0 h-full w-full"
      style:filter={bloomStyle.filter}
      style:opacity={bloomStyle.opacity}
      style:mix-blend-mode={bloomStyle.mixBlendMode}
      style:image-rendering={bloomStyle.imageRendering}
    ></canvas>
  {/if}
</div>
