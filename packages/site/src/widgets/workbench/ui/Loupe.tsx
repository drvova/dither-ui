// The pixel loupe (beyond Kobra): the pixels under the pointer magnified on
// their grid — the dither as the screen draws it — with the centre pixel's
// colour and position. Live: animated canvases are read as they are now.
// The wheel zooms; a click samples the centre pixel.
import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js"
import { formatColor, type RGBA } from "@/shared/lib/inspect/color"
import { useBench } from "../context"
import "./Loupe.css"

const SIZE = 132

export default function Loupe() {
  const b = useBench()
  let view: HTMLCanvasElement | undefined
  const [center, setCenter] = createSignal<RGBA | null>(null)

  const place = createMemo(() => {
    const p = b.pointer()
    if (!p) return null
    const flipX = p.x + 20 + SIZE > b.size().w
    const flipY = p.y + 20 + SIZE + 24 > b.size().h
    return {
      left: `${flipX ? p.x - 20 - SIZE : p.x + 20}px`,
      top: `${flipY ? Math.max(0, p.y - 20 - SIZE - 24) : p.y + 20}px`,
    }
  })

  onMount(() => {
    const tiny = document.createElement("canvas")
    let raf = 0
    let last = 0
    function draw(now: number) {
      raf = requestAnimationFrame(draw)
      const p = b.pointer()
      // The lens is in the page only while the pointer is on the stage.
      const c = view?.isConnected ? view : null
      if (!p || !c || now - last < 50) return
      last = now
      const z = b.loupeZoom()
      const cols = Math.ceil(SIZE / z) | 1
      tiny.width = cols
      tiny.height = cols
      const t = tiny.getContext("2d", { willReadFrequently: true })
      if (!t) return
      b.paintPixels(t, p, cols, cols)
      const mid = Math.floor(cols / 2)
      const [r, g, bl, a] = t.getImageData(mid, mid, 1, 1).data
      setCenter({ r, g, b: bl, a: Math.round((a / 255) * 1000) / 1000 })
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.width = SIZE * dpr
      c.height = SIZE * dpr
      const ctx = c.getContext("2d")!
      ctx.imageSmoothingEnabled = false
      const off = (SIZE - cols * z) / 2
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.drawImage(tiny, off, off, cols * z, cols * z)
      if (z >= 6) {
        ctx.strokeStyle = "rgb(127 127 127 / 0.28)"
        ctx.lineWidth = 1 / dpr
        ctx.beginPath()
        for (let i = 0; i <= cols; i++) {
          ctx.moveTo(off + i * z, 0)
          ctx.lineTo(off + i * z, SIZE)
          ctx.moveTo(0, off + i * z)
          ctx.lineTo(SIZE, off + i * z)
        }
        ctx.stroke()
      }
      ctx.lineWidth = 1.5
      ctx.strokeStyle = "rgb(0 0 0 / 0.9)"
      ctx.strokeRect(off + mid * z - 0.75, off + mid * z - 0.75, z + 1.5, z + 1.5)
      ctx.strokeStyle = "rgb(255 255 255 / 0.95)"
      ctx.lineWidth = 1
      ctx.strokeRect(off + mid * z + 0.5, off + mid * z + 0.5, z - 1, z - 1)
    }
    raf = requestAnimationFrame(draw)
    onCleanup(() => cancelAnimationFrame(raf))
  })

  return (
    <Show when={place()}>
      {(at) => (
        <div class="wb-loupe loupe-scope" style={at()} aria-hidden="true">
          <canvas ref={(el) => (view = el)} class="lens" style={{ width: `${SIZE}px`, height: `${SIZE}px` }} />
          <span class="read">
            <i class="sw" style={{ background: center() ? formatColor(center()!, "hex") : "transparent" }} />
            {center() ? formatColor(center()!, b.settings.format) : "none"}{" "}
            <em>
              {b.pointer()?.x},{b.pointer()?.y} at {b.loupeZoom()}×
            </em>
          </span>
        </div>
      )}
    </Show>
  )
}
