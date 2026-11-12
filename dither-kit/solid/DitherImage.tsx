import { createEffect, createMemo, mergeProps, on, onCleanup, onMount, Show } from "solid-js"
import { kitFromSeed } from "../engine/dither-paint"
import {
  DEFAULT_MAX_COLS,
  DEFAULT_MAX_ROWS,
  precompiledSrc,
  STATIC_DEFAULT_MAX_COLS,
  STATIC_DEFAULT_MAX_ROWS,
  type DitherRenderMode,
  type PrecompiledDither,
} from "../engine/precompile"
import { cn } from "../tailwind/lib"
import { useDitherMatrix } from "./runtime/screen"

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
  maxRows: number,
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

export type DitherImageProps = {
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

export default function DitherImage(raw: DitherImageProps) {
  const props = mergeProps({ alt: "", renderMode: "live" as DitherRenderMode }, raw)

  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const effCell = createMemo(() => props.cell ?? s()?.cell ?? 3)
  const effFocusY = createMemo(() => props.focusY ?? s()?.focusY ?? 0.5)
  const effFade = createMemo(() => props.fade ?? s()?.fade ?? 0)
  const matrix = useDitherMatrix(() => props.seed)
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

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  // Made at mount: a server render has no `Image`.
  let img: HTMLImageElement | undefined

  let ro: ResizeObserver | null = null
  let io: IntersectionObserver | null = null
  let restartToken = 0
  function paint() {
    // The canvas is off the page while a precompiled image stands in for it.
    if (!wrap || !canvas || !img || precompiled()) return
    const box = wrap.getBoundingClientRect()
    paintImage(
      canvas,
      img,
      box.width,
      box.height,
      effCell(),
      effFocusY(),
      effFade(),
      matrix(),
      effMaxCols(),
      effMaxRows(),
    )
  }

  function load() {
    if (precompiled() || !img) return
    img.onload = paint
    if (img.src !== props.src) img.src = props.src
    else if (img.complete) paint()
  }

  function stopRuntime() {
    ro?.disconnect()
    ro = null
    io?.disconnect()
    io = null
    if (img) img.onload = null
  }

  function startRuntime() {
    const token = ++restartToken
    stopRuntime()
    if (precompiled()) return
    queueMicrotask(() => {
      if (token !== restartToken || precompiled()) return
      if (props.renderMode !== "static" && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(paint)
        if (wrap) ro.observe(wrap)
      }
      // Fetch the source only as the frame approaches the viewport: the eager
      // load pulled a multi-hundred-KB sheet at mount on pages where the image
      // sits far below the fold. Falls back to the old eager load when the
      // observer is unavailable or the element never mounts.
      if (typeof IntersectionObserver !== "undefined" && wrap) {
        io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              io?.disconnect()
              io = null
              load()
            }
          },
          { rootMargin: "400px" },
        )
        io.observe(wrap)
      } else {
        load()
      }
    })
  }

  onMount(() => {
    img = new Image()
    img.crossOrigin = "anonymous"
    startRuntime()
    createEffect(on(() => [props.src, precompiled(), props.renderMode], startRuntime, { defer: true }))
    createEffect(on([effCell, effFocusY, effFade, matrix, effMaxCols, effMaxRows], paint, { defer: true }))
  })
  onCleanup(() => {
    restartToken += 1
    stopRuntime()
  })

  return (
    <div
      ref={(el) => (wrap = el)}
      role={props.alt ? "img" : undefined}
      aria-label={props.alt || undefined}
      aria-hidden={props.alt ? undefined : "true"}
      class={cn("relative overflow-hidden", props.class)}
    >
      <Show
        when={precompiled()}
        fallback={
          <canvas
            ref={(el) => (canvas = el)}
            class="absolute inset-0 h-full w-full"
            style={{ "image-rendering": "pixelated" }}
          />
        }
      >
        {(src) => (
          <img
            src={src()}
            alt={props.alt}
            class="absolute inset-0 h-full w-full object-cover"
            style={{ "image-rendering": "pixelated" }}
          />
        )}
      </Show>
    </div>
  )
}
