// The workbench's captures (`../bench.ts`): a still of a region, a
// recording of one, and the recording trimmed and saved as a video or as a
// GIF dithered by the kit.
import { BAYER8 } from "@dither-ui/kit"
import { download } from "@/shared/lib/files"
import { encodeGif } from "@/shared/lib/gif"
import {
  canRecord,
  canShareTab,
  durationOf,
  grabRegion,
  recordRegion,
  renderRegion,
  trimVideo,
  videoFrames,
  videoTypes,
} from "@/widgets/workbench/model/capture"
import type { Box } from "@/shared/lib/inspect/geometry"
import { isOverlay, type Capture, type State } from "@/widgets/workbench/model/state"

/** The export format that is not a video: a GIF through the kit's dither. */
export const GIF = "image/gif"

export function createRecorder(s: State) {
  const { o, settings, say, capture, setCapture, setCapturing, setBusy, videoMime } = s

  // --- captures ----------------------------------------------------------------

  const toHost = (r: Box): Box => ({ x: r.x + o.host.clientLeft, y: r.y + o.host.clientTop, w: r.w, h: r.h })
  const paints = (n: number) =>
    new Promise<void>((res) => {
      const step = (k: number) => (k ? requestAnimationFrame(() => step(k - 1)) : res())
      step(n)
    })

  function drop(c: Capture | null) {
    if (c && "url" in c) URL.revokeObjectURL(c.url)
  }

  async function shoot(region: Box) {
    setBusy(true)
    setCapturing(true)
    await paints(2)
    try {
      const blob =
        settings.stills === "screen" && canShareTab()
          ? await grabRegion(o.host, toHost(region))
          : await renderRegion(o.host, toHost(region), isOverlay)
      drop(capture())
      setCapture({ kind: "shot", blob, url: URL.createObjectURL(blob) })
      say(`Captured ${region.w}×${region.h}`)
    } catch (err) {
      say((err as Error).name === "NotAllowedError" ? "Sharing was declined" : "The capture failed")
    } finally {
      setCapturing(false)
      setBusy(false)
    }
  }

  async function record(region: Box) {
    if (!canRecord()) return say("This browser cannot record a tab")
    setCapturing(true)
    try {
      const rec = await recordRegion(o.host, toHost(region), videoMime(), () => void finishRecording())
      drop(capture())
      setCapture({ kind: "recording", rec })
      say("Recording. Escape or Stop ends it.")
    } catch (err) {
      setCapturing(false)
      say((err as Error).name === "NotAllowedError" ? "Sharing was declined" : "Recording could not start")
    }
  }

  async function finishRecording() {
    const c = capture()
    if (c?.kind !== "recording") return
    const blob = await c.rec.stop()
    if (capture() !== c) return
    setCapturing(false)
    const url = URL.createObjectURL(blob)
    const video = document.createElement("video")
    video.src = url
    await new Promise((r) => (video.onloadedmetadata = r))
    const duration = await durationOf(video)
    setCapture({ kind: "video", blob, url, duration, start: 0, end: duration })
    say(`Recorded ${duration.toFixed(1)} s`)
  }

  async function exportVideo() {
    const c = capture()
    if (c?.kind !== "video") return
    if (videoMime() === GIF) return exportGif(c)
    const type = videoTypes().find((t) => t.mime === videoMime()) ?? videoTypes()[0]
    if (!type) return
    setBusy(true)
    try {
      const trimmed = c.start > 0.05 || c.end < c.duration - 0.05
      const blob =
        trimmed || !c.blob.type.startsWith(type.mime.split(";")[0])
          ? await trimVideo(c.blob, c.start, c.end, type.mime)
          : c.blob
      download(blob, `${o.key.replace(/[^\w-]+/g, "-")}.${type.ext}`)
      say("Video saved")
    } finally {
      setBusy(false)
    }
  }

  /** The cut as a looping GIF, dithered with the kit's matrix. */
  async function exportGif(c: Extract<Capture, { kind: "video" }>) {
    setBusy(true)
    say("Encoding the GIF…")
    try {
      const { frames, width, height, delay } = await videoFrames(c.blob, c.start, c.end)
      await paints(1)
      const bytes = encodeGif(frames, width, height, delay, { matrix: BAYER8 })
      download(new Blob([bytes as BlobPart], { type: "image/gif" }), `${o.key.replace(/[^\w-]+/g, "-")}.gif`)
      say(`GIF saved: ${frames.length} frames, ${(bytes.length / 1024).toFixed(0)} kB`)
    } catch {
      say("The GIF could not be encoded")
    } finally {
      setBusy(false)
    }
  }

  function discardCapture() {
    drop(capture())
    setCapture(null)
  }

  return { drop, shoot, record, finishRecording, exportVideo, discardCapture }
}

export type Recorder = ReturnType<typeof createRecorder>
