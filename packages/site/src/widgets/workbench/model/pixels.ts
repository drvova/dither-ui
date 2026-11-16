// The workbench's pixels (`../bench.ts`): the stage's snapshot with the live
// canvases drawn over it, the loupe's and the colour sampler's source, and
// the samples taken (the EyeDropper's where the browser has one).
import { createSignal } from "solid-js"
import { copyText } from "@dither-ui/kit"
import { play } from "@/shared/lib/sound"
import { renderStage } from "@/widgets/workbench/model/capture"
import { formatColor, parseColor, type RGBA } from "@/shared/lib/inspect/color"
import { intersects, type Point } from "@/shared/lib/inspect/geometry"
import { boxOf } from "@/shared/lib/inspect/measure"
import { isOverlay, same, type State } from "@/widgets/workbench/model/state"

export function createPixels(s: State) {
  const { o, settings, overlay, say, samples, setSamples, busy } = s

  // --- pixels: the loupe's and the sampler's source ---------------------------

  const [snapshot, setSnapshot] = createSignal<{ canvas: HTMLCanvasElement; scale: number } | null>(null)
  let snapshotAt = 0

  async function refreshSnapshot() {
    if (busy()) return
    snapshotAt = performance.now()
    try {
      setSnapshot(await renderStage(o.host, isOverlay))
    } catch {
      setSnapshot(null)
    }
  }

  /** The stage's pixels around a point, the live canvases drawn over the
   * snapshot so animated surfaces read as they are now. */
  function paintPixels(ctx: CanvasRenderingContext2D, center: Point, cols: number, rows: number) {
    const snap = snapshot()
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, cols, rows)
    const bx = o.host.clientLeft
    const by = o.host.clientTop
    const x0 = center.x - Math.floor(cols / 2)
    const y0 = center.y - Math.floor(rows / 2)
    if (snap)
      ctx.drawImage(
        snap.canvas,
        (x0 + bx) * snap.scale,
        (y0 + by) * snap.scale,
        cols * snap.scale,
        rows * snap.scale,
        0,
        0,
        cols,
        rows,
      )
    const ov = overlay()
    if (!ov) return
    for (const c of o.content.querySelectorAll("canvas")) {
      const b = boxOf(c, ov)
      if (!intersects(b, { x: x0, y: y0, w: cols, h: rows }) || !c.width || !c.height) continue
      try {
        ctx.drawImage(c, b.x - x0, b.y - y0, b.w, b.h)
      } catch {
        // A tainted or lost context: the snapshot's pixels stand.
      }
    }
    if (performance.now() - snapshotAt > 1500) void refreshSnapshot()
  }

  const probe = typeof document !== "undefined" ? document.createElement("canvas") : null
  function pixelAt(p: Point): RGBA | null {
    if (!probe) return null
    probe.width = 1
    probe.height = 1
    const ctx = probe.getContext("2d", { willReadFrequently: true })
    if (!ctx) return null
    paintPixels(ctx, p, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    return { r, g, b, a: Math.round((a / 255) * 1000) / 1000 }
  }

  async function addSample(c: RGBA) {
    setSamples([c, ...samples().filter((s) => !same(s, c))].slice(0, 8))
    const text = formatColor(c, settings.format)
    const ok = await copyText(text)
    if (ok) play("copy")
    say(ok ? `Copied ${text}` : text)
  }

  async function eyeDropper(): Promise<boolean> {
    const ED = (window as unknown as { EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> } }).EyeDropper
    if (!ED) return false
    try {
      const { sRGBHex } = await new ED().open()
      const c = parseColor(sRGBHex)
      if (c) await addSample(c)
    } catch {
      // Cancelled: the stage sampler stays in hand.
    }
    return true
  }

  return { snapshot, refreshSnapshot, paintPixels, pixelAt, addSample, eyeDropper }
}

export type Pixels = ReturnType<typeof createPixels>
