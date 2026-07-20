<script lang="ts" module>
  import { BAYER4, pixelMatrixFromSeed } from "../engine/pixel"
  import {
    DEFAULT_MAX_COLS,
    DEFAULT_MAX_ROWS,
    STATIC_DEFAULT_MAX_COLS,
    STATIC_DEFAULT_MAX_ROWS,
  } from "../engine/precompile"

  /** Ordered-dither an image into chunky cells: each cell keeps its source hue,
   * the Bayer matrix decides whether it renders lit or dimmed — the same
   * texture the buttons and charts use, applied to arbitrary artwork. */
  function paintImage(
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    width: number,
    height: number,
    cell: number,
    focusY: number,
    fade: number,
    matrix: number[][],
    maxCols: number,
    maxRows: number
  ): void {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx || width <= 0 || height <= 0 || !img.naturalWidth) return
    const cols = Math.min(maxCols, Math.max(4, Math.round(width / cell)))
    const rows = Math.min(maxRows, Math.max(4, Math.round(height / cell)))
    canvas.width = cols
    canvas.height = rows

    // Cover-fit: scale source to fill the cell grid, crop centered.
    const scale = Math.max(cols / img.naturalWidth, rows / img.naturalHeight)
    const sw = cols / scale
    const sh = rows / scale
    const sx = (img.naturalWidth - sw) / 2
    const sy = (img.naturalHeight - sh) * focusY
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows)

    const px = ctx.getImageData(0, 0, cols, rows)
    const d = px.data
    const f = Math.max(1, Math.round(fade / cell)) // fade margin in cells
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4
        const t = matrix[y & 3][x & 3]
        // Dithered dissolve: toward every edge pixels first darken, then drop
        // out through the same Bayer matrix — the image melts into the page.
        let e = 1
        if (fade > 0) {
          e = Math.min(Math.min(x, cols - 1 - x, y, rows - 1 - y) / f, 1)
          if (e < 1 && e * e <= t) {
            d[i + 3] = 0
            continue
          }
        }
        const luma = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255
        const k = (luma > t ? 1 : 0.45) * (0.25 + 0.75 * e)
        d[i] = Math.round(d[i] * k)
        d[i + 1] = Math.round(d[i + 1] * k)
        d[i + 2] = Math.round(d[i + 2] * k)
      }
    }
    ctx.putImageData(px, 0, 0)
  }
</script>

<script lang="ts">
  import { cn } from "../runtime/lib"
  import { kitFromSeed } from "../engine/dither-paint"
  import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"

  type Props = {
    src: string
    alt?: string
    /** css px per dither cell — bigger means chunkier. */
    cell?: number
    /** vertical crop focus for cover-fit: 0 top, 0.5 center, 1 bottom. */
    focusY?: number
    /** css px of dithered edge dissolve — 0 keeps hard edges. */
    fade?: number
    seed?: number
    class?: string
    renderMode?: DitherRenderMode
    precompiled?: PrecompiledDither
    maxCols?: number
    maxRows?: number
  }

  let {
    src,
    alt = "",
    cell: cellProp,
    focusY: focusYProp,
    fade: fadeProp,
    seed,
    class: className,
    renderMode = "live",
    precompiled: precompiledProp,
    maxCols: maxColsProp,
    maxRows: maxRowsProp,
  }: Props = $props()

  const s = $derived(seed !== undefined ? kitFromSeed(seed) : null)
  const effCell = $derived(cellProp ?? s?.cell ?? 3)
  const effFocusY = $derived(focusYProp ?? s?.focusY ?? 0.5)
  const effFade = $derived(fadeProp ?? s?.fade ?? 0)
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)
  const precompiled = $derived(precompiledSrc(precompiledProp))

  /** Effective resolution caps: static mode auto-uses lower caps unless overridden. */
  const effMaxCols = $derived(
    maxColsProp ?? (renderMode === "static" ? STATIC_DEFAULT_MAX_COLS : DEFAULT_MAX_COLS)
  )
  const effMaxRows = $derived(
    maxRowsProp ?? (renderMode === "static" ? STATIC_DEFAULT_MAX_ROWS : DEFAULT_MAX_ROWS)
  )

  let canvasEl = $state<HTMLCanvasElement | null>(null)

  type ImageParams = {
    canvas: HTMLCanvasElement | null
    src: string
    precompiled: string | undefined
    renderMode: DitherRenderMode
    cell: number
    focusY: number
    fade: number
    matrix: number[][]
    maxCols: number
    maxRows: number
    restartKey: string
    paintKey: string
  }

  /**
   * Local Svelte action owning the source <img>, the ResizeObserver, and the
   * paint pass — the DOM-lifecycle seam that replaces the Vue component's
   * `startRuntime`/`paint` watchers, so no `$effect` is needed. `restartKey`
   * mirrors Vue's src/precompiled/renderMode watch (reload + re-observe);
   * `paintKey` mirrors the cell/focusY/fade/matrix/caps watch (repaint only).
   */
  function imageCanvas(wrap: HTMLDivElement, initial: ImageParams) {
    let p = initial
    let ro: ResizeObserver | null = null
    let token = 0
    const img = new Image()
    img.crossOrigin = "anonymous"

    function paint() {
      const canvas = p.canvas
      if (!canvas) return
      const box = wrap.getBoundingClientRect()
      paintImage(
        canvas,
        img,
        box.width,
        box.height,
        p.cell,
        p.focusY,
        p.fade,
        p.matrix,
        p.maxCols,
        p.maxRows
      )
    }

    function load() {
      if (p.precompiled) return
      img.onload = paint
      if (img.src !== p.src) img.src = p.src
      else if (img.complete) paint()
    }

    function stop() {
      ro?.disconnect()
      ro = null
      img.onload = null
    }

    function restart() {
      const my = ++token
      stop()
      if (p.precompiled) return
      requestAnimationFrame(() => {
        if (my !== token || p.precompiled) return
        load()
        if (p.renderMode !== "static" && typeof ResizeObserver !== "undefined") {
          ro = new ResizeObserver(paint)
          ro.observe(wrap)
        }
      })
    }

    restart()

    return {
      update(next: ImageParams) {
        const needsRestart = next.restartKey !== p.restartKey
        const needsPaint = next.paintKey !== p.paintKey
        p = next
        if (needsRestart) restart()
        else if (needsPaint) paint()
      },
      destroy() {
        token += 1
        stop()
      },
    }
  }

  const params = $derived<ImageParams>({
    canvas: canvasEl,
    src,
    precompiled,
    renderMode,
    cell: effCell,
    focusY: effFocusY,
    fade: effFade,
    matrix,
    maxCols: effMaxCols,
    maxRows: effMaxRows,
    restartKey: JSON.stringify([src, precompiled, renderMode]),
    paintKey: JSON.stringify([effCell, effFocusY, effFade, seed, effMaxCols, effMaxRows]),
  })
</script>

<div
  use:imageCanvas={params}
  role={alt ? "img" : undefined}
  aria-label={alt || undefined}
  aria-hidden={alt ? undefined : "true"}
  class={cn("relative overflow-hidden", className)}
>
  {#if precompiled}
    <img
      src={precompiled}
      {alt}
      class="absolute inset-0 h-full w-full object-cover"
      style="image-rendering: pixelated"
    />
  {:else}
    <canvas
      bind:this={canvasEl}
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
    ></canvas>
  {/if}
</div>
