// Capturing a region of a preview stage. A still renders the stage's DOM
// (no prompt; canvases come along through their pixels) or grabs one exact
// frame of the tab; a recording crops the shared tab to the region, frame by
// frame, through MediaRecorder. Everything is feature-detected.
import type { Box } from "./geometry"

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

export function canShareTab(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia
}

export function canRecord(): boolean {
  return (
    canShareTab() &&
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function"
  )
}

/** The recording types this browser can write, best first. */
export function videoTypes(): { mime: string; ext: string; label: string }[] {
  if (typeof MediaRecorder === "undefined") return []
  return [
    { mime: "video/mp4;codecs=avc1", ext: "mp4", label: "MP4" },
    { mime: "video/webm;codecs=vp9", ext: "webm", label: "WebM" },
    { mime: "video/webm", ext: "webm", label: "WebM" },
  ].filter((t, i, all) => MediaRecorder.isTypeSupported(t.mime) && all.findIndex((u) => u.label === t.label) === i)
}

/** The stage drawn from its DOM by html-to-image at device resolution
 * (`scale` canvas px per CSS px). `skip` keeps the workbench's own overlay
 * out of the picture. */
export async function renderStage(
  stage: HTMLElement,
  skip: (node: HTMLElement) => boolean,
): Promise<{ canvas: HTMLCanvasElement; scale: number }> {
  const { toCanvas } = await import("html-to-image")
  const scale = Math.min(3, window.devicePixelRatio || 1)
  const canvas = await toCanvas(stage, {
    pixelRatio: scale,
    backgroundColor: getComputedStyle(document.body).backgroundColor,
    filter: (node) => !(node instanceof HTMLElement && skip(node)),
  })
  return { canvas, scale }
}

/** The region of the stage rendered from the DOM (no prompt). */
export async function renderRegion(
  stage: HTMLElement,
  region: Box,
  skip: (node: HTMLElement) => boolean,
): Promise<Blob> {
  const { canvas, scale } = await renderStage(stage, skip)
  return crop(canvas, region, scale)
}

function crop(source: CanvasImageSource, region: Box, scale: number): Promise<Blob> {
  const out = document.createElement("canvas")
  out.width = Math.max(1, Math.round(region.w * scale))
  out.height = Math.max(1, Math.round(region.h * scale))
  const ctx = out.getContext("2d")!
  ctx.drawImage(
    source,
    region.x * scale,
    region.y * scale,
    region.w * scale,
    region.h * scale,
    0,
    0,
    out.width,
    out.height,
  )
  return new Promise((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  )
}

type CropTargetCtor = { fromElement(el: Element): Promise<unknown> }
type CroppableTrack = MediaStreamTrack & { cropTo?: (target: unknown) => Promise<void> }

/** A transparent box laid exactly over `region` of the stage (border-box
 * coordinates): Region Capture's target, so the shared tab arrives already
 * cropped to the region. Rendered (not hidden), painting nothing. */
function regionTarget(stage: HTMLElement, region: Box): HTMLElement {
  const el = document.createElement("div")
  el.setAttribute("aria-hidden", "true")
  Object.assign(el.style, {
    position: "absolute",
    left: `${region.x - stage.clientLeft}px`,
    top: `${region.y - stage.clientTop}px`,
    width: `${region.w}px`,
    height: `${region.h}px`,
    pointerEvents: "none",
    zIndex: "0",
  })
  stage.appendChild(el)
  return el
}

/** This tab, shared by the reader: cropped to `target` by Region Capture
 * where the browser has it (`cropped`), else the whole viewport. */
async function shareTab(target: Element) {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 30, displaySurface: "browser" },
    audio: false,
    // Chromium's hints: offer this tab first and allow it at all.
    preferCurrentTab: true,
    selfBrowserSurface: "include",
  } as DisplayMediaStreamOptions)
  const track = stream.getVideoTracks()[0] as CroppableTrack
  const Crop = (globalThis as { CropTarget?: CropTargetCtor }).CropTarget
  let cropped = false
  if (Crop && track.cropTo) {
    try {
      await track.cropTo(await Crop.fromElement(target))
      cropped = true
    } catch {
      cropped = false
    }
  }
  return { stream, track, cropped, stop: () => stream.getTracks().forEach((t) => t.stop()) }
}

async function playing(stream: MediaStream): Promise<HTMLVideoElement> {
  const video = document.createElement("video")
  video.muted = true
  video.playsInline = true
  video.srcObject = stream
  await video.play()
  while (!video.videoWidth) await nextFrame()
  return video
}

/** Where `region` lies in a whole-viewport frame of the shared tab. */
function viewportRect(video: HTMLVideoElement, stage: HTMLElement, region: Box): Box {
  const s = stage.getBoundingClientRect()
  const k = video.videoWidth / window.innerWidth
  return { x: (s.left + region.x) * k, y: (s.top + region.y) * k, w: region.w * k, h: region.h * k }
}

/** One exact frame of the region, as the screen shows it. */
export async function grabRegion(stage: HTMLElement, region: Box): Promise<Blob> {
  const target = regionTarget(stage, region)
  const tab = await shareTab(target).catch((err) => {
    target.remove()
    throw err
  })
  try {
    const video = await playing(tab.stream)
    await nextFrame()
    await nextFrame()
    const src = tab.cropped
      ? { x: 0, y: 0, w: video.videoWidth, h: video.videoHeight }
      : viewportRect(video, stage, region)
    const out = document.createElement("canvas")
    out.width = Math.max(1, Math.round(src.w))
    out.height = Math.max(1, Math.round(src.h))
    out.getContext("2d")!.drawImage(video, src.x, src.y, src.w, src.h, 0, 0, out.width, out.height)
    return await new Promise((resolve, reject) =>
      out.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
    )
  } finally {
    tab.stop()
    target.remove()
  }
}

export type Recording = {
  /** Seconds recorded so far. */
  elapsed(): number
  /** Stop and collect the file. */
  stop(): Promise<Blob>
}

export const MAX_SECONDS = 60

function recorderFor(stream: MediaStream, mime: string) {
  const type = videoTypes().find((t) => t.mime === mime)?.mime ?? videoTypes()[0]?.mime
  const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6_000_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }))
  })
  return { recorder, done }
}

/** Record the region of the shared tab until `stop()` (or MAX_SECONDS, or
 * the reader ending the share). With Region Capture the cropped track is
 * recorded as it comes; without it each frame is cut out of the viewport
 * on a canvas. `onEnd` fires however it ends. */
export async function recordRegion(
  stage: HTMLElement,
  region: Box,
  mime: string,
  onEnd: () => void,
): Promise<Recording> {
  const target = regionTarget(stage, region)
  const tab = await shareTab(target).catch((err) => {
    target.remove()
    throw err
  })
  let running = true
  let source: MediaStream = tab.stream
  if (!tab.cropped) {
    const video = await playing(tab.stream)
    const canvas = document.createElement("canvas")
    const scale = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.max(2, Math.round((region.w * scale) / 2) * 2)
    canvas.height = Math.max(2, Math.round((region.h * scale) / 2) * 2)
    const ctx = canvas.getContext("2d")!
    const draw = () => {
      if (!running) return
      const src = viewportRect(video, stage, region)
      ctx.drawImage(video, src.x, src.y, src.w, src.h, 0, 0, canvas.width, canvas.height)
      requestAnimationFrame(draw)
    }
    draw()
    source = canvas.captureStream(30)
  }
  const { recorder, done } = recorderFor(source, mime)
  const started = performance.now()
  recorder.start(250)
  let finished: Promise<Blob> | null = null
  const stop = () =>
    (finished ??= (async () => {
      running = false
      clearTimeout(limit)
      if (recorder.state !== "inactive") recorder.stop()
      const blob = await done
      tab.stop()
      target.remove()
      onEnd()
      return blob
    })())
  const limit = setTimeout(stop, MAX_SECONDS * 1000)
  tab.track.addEventListener("ended", () => void stop())
  return { elapsed: () => (performance.now() - started) / 1000, stop }
}

/** A recording cut to [start, end] seconds: replayed into a canvas and
 * recorded again (real time, the length of the cut). A tab capture can
 * change frame size mid-stream (the first frames before the crop lands),
 * so the canvas takes the size at the cut's start and every frame is
 * drawn scaled to it. */
export async function trimVideo(blob: Blob, start: number, end: number, mime: string): Promise<Blob> {
  const url = URL.createObjectURL(blob)
  try {
    const video = document.createElement("video")
    video.muted = true
    video.src = url
    await new Promise((r) => (video.onloadeddata = r))
    video.currentTime = start
    await new Promise((r) => (video.onseeked = r))
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")!
    const { recorder, done } = recorderFor(canvas.captureStream(30), mime)
    recorder.start(250)
    await video.play()
    // Each decoded frame once (requestVideoFrameCallback), else per paint.
    const next = (fn: () => void) =>
      "requestVideoFrameCallback" in video ? video.requestVideoFrameCallback(fn) : requestAnimationFrame(fn)
    await new Promise<void>((resolve) => {
      const tick = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        if (video.currentTime >= end || video.ended) resolve()
        else next(tick)
      }
      tick()
    })
    video.pause()
    recorder.stop()
    return await done
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Frames of a recording between `start` and `end` seconds, `fps` per
 * second (fewer when the cut is long: at most `cap` frames), scaled to at
 * most `maxWidth` — the input of a GIF. */
export async function videoFrames(blob: Blob, start: number, end: number, fps = 12, maxWidth = 480, cap = 240) {
  const url = URL.createObjectURL(blob)
  try {
    const video = document.createElement("video")
    video.muted = true
    video.src = url
    await new Promise((r) => (video.onloadeddata = r))
    const seek = (t: number) =>
      new Promise<void>((r) => {
        video.onseeked = () => r()
        video.currentTime = t
      })
    await seek(start)
    const scale = Math.min(1, maxWidth / video.videoWidth)
    const width = Math.max(1, Math.round(video.videoWidth * scale))
    const height = Math.max(1, Math.round(video.videoHeight * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!
    const rate = Math.min(fps, cap / Math.max(0.1, end - start))
    const frames: Uint8ClampedArray[] = []
    for (let t = start; t < end && frames.length < cap; t += 1 / rate) {
      await seek(t)
      ctx.drawImage(video, 0, 0, width, height)
      frames.push(ctx.getImageData(0, 0, width, height).data)
    }
    return { frames, width, height, delay: Math.max(2, Math.round(100 / rate)) }
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** A recording's real length: WebM from MediaRecorder reports Infinity
 * until the browser is made to scan to the end. */
export async function durationOf(video: HTMLVideoElement): Promise<number> {
  if (Number.isFinite(video.duration)) return video.duration
  video.currentTime = 1e9
  await new Promise((r) => (video.ontimeupdate = r))
  const d = video.duration
  video.ontimeupdate = null
  video.currentTime = 0
  return Number.isFinite(d) ? d : 0
}

export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Put a PNG on the clipboard; false where the browser will not. */
export async function copyImage(blob: Blob): Promise<boolean> {
  try {
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) return false
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    return true
  } catch {
    return false
  }
}
