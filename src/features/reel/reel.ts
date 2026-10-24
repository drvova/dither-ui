// The reel's timeline: clips laid end to end by the kit's sequence algebra,
// a moment resolved to the clip on screen, the clip it is coming in over and
// the eased progress of that transition; and the film over it: the camera of
// a clip at a moment (and where a point of the frame lands through it), the
// callouts up, the chapter on screen, and the cut as the score's plan. Pure:
// the renderer, the inspector and the export all read the same answer for
// the same time.
import type {
  ReelCallout,
  ReelCameraKey,
  ReelChapter,
  ReelClip,
  ReelModel,
  ReelTransitionKind,
} from "@/entities/widget"
import { planSequence, resolveEasing, type ScorePlan, type WipeDirection } from "@dither-kit"

export type ReelMoment = {
  /** The clip on screen. */
  index: number
  /** Seconds into that clip. */
  local: number
  /** The previous clip, still underneath while the transition runs (none under the first). */
  outgoing: number | null
  /** Eased 0-1 of the transition; 1 once the clip stands alone. */
  progress: number
}

const ease = resolveEasing("ease-in-out")

export const reelDuration = (clips: ReelClip[]): number => clips.reduce((n, c) => n + Math.max(0, c.seconds), 0)

/** Where `t` seconds lands: before the start is the first clip, past the end holds the last. */
export function reelAt(clips: ReelClip[], t: number): ReelMoment | null {
  if (!clips.length) return null
  const plan = planSequence({
    kind: "serial",
    nodes: clips.map((c, i) => ({ kind: "track", id: String(i), duration: Math.max(0.001, c.seconds) })),
  })
  const time = Math.min(Math.max(0, Number.isFinite(t) ? t : 0), Math.max(0, plan.duration - 1e-6))
  let index = plan.tracks.findIndex((tr) => time >= tr.t0 && time < tr.end)
  if (index < 0) index = clips.length - 1
  const local = time - plan.tracks[index].t0
  const tr = clips[index].transition
  // The first clip comes in over the frame's own background.
  const running = tr.kind !== "cut" && tr.seconds > 0 && local < tr.seconds
  return {
    index,
    local,
    outgoing: running && index > 0 ? index - 1 : null,
    progress: running ? ease(local / tr.seconds) : 1,
  }
}

/** Free-running playback wraps around. */
export const reelLoop = (clips: ReelClip[], t: number): number => {
  const total = reelDuration(clips)
  return total > 0 ? ((t % total) + total) % total : 0
}

export const wipeDirectionOf = (kind: ReelTransitionKind): WipeDirection =>
  kind === "wipe-right"
    ? "right"
    : kind === "wipe-left"
      ? "left"
      : kind === "wipe-down"
        ? "down"
        : kind === "wipe-up"
          ? "up"
          : "none"

/* --------------------------------- camera -------------------------------- */

export type Camera = { x: number; y: number; zoom: number; tilt: number }
/** No keys: the frame fitted and held still. */
export const STILL: Camera = { x: 0.5, y: 0.5, zoom: 1, tilt: 0 }

/** The camera at `t` (0-1 of the clip): keys eased between, the first held
 * before it and the last after it. */
export function cameraAt(keys: ReelCameraKey[], t: number): Camera {
  if (!keys.length) return STILL
  const at = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0))
  let i = 0
  while (i < keys.length - 1 && at >= keys[i + 1].t) i++
  const a = keys[i]
  const b = keys[i + 1] ?? a
  const f = b.t > a.t ? ease(Math.min(1, Math.max(0, (at - a.t) / (b.t - a.t)))) : 0
  const lerp = (u: number, v: number) => u + (v - u) * f
  return { x: lerp(a.x, b.x), y: lerp(a.y, b.y), zoom: lerp(a.zoom, b.zoom), tilt: lerp(a.tilt, b.tilt) }
}

/** The camera as a CSS transform about the stage's centre, for a frame drawn
 * `w` x `h` px there: the look point brought to the centre, zoomed, leaned
 * through a `perspective` px lens. */
export function cameraTransform(cam: Camera, w: number, h: number, perspective: number): string {
  const tx = -cam.zoom * (cam.x - 0.5) * w
  const ty = -cam.zoom * (cam.y - 0.5) * h
  return `perspective(${perspective}px) rotateY(${cam.tilt}deg) translate(${tx}px, ${ty}px) scale(${cam.zoom})`
}

/** Where the point `fx`, `fy` of the frame (fractions) lands through the
 * camera, in px from the stage's centre: the same arithmetic as the CSS
 * transform, so a callout tracks its point exactly. */
export function cameraPoint(
  cam: Camera,
  w: number,
  h: number,
  perspective: number,
  fx: number,
  fy: number,
): [number, number] {
  const qx = cam.zoom * (fx - cam.x) * w
  const qy = cam.zoom * (fy - cam.y) * h
  const a = (cam.tilt * Math.PI) / 180
  const z = -qx * Math.sin(a)
  const s = perspective / (perspective - z)
  return [qx * Math.cos(a) * s, qy * s]
}

/** Camera moves the inspector offers, as keys. */
export const CAMERA_MOVES: Record<string, ReelCameraKey[]> = {
  still: [],
  "push in": [
    { t: 0, x: 0.5, y: 0.5, zoom: 1, tilt: 0 },
    { t: 1, x: 0.5, y: 0.5, zoom: 1.3, tilt: 0 },
  ],
  "pull out": [
    { t: 0, x: 0.5, y: 0.5, zoom: 1.3, tilt: 0 },
    { t: 1, x: 0.5, y: 0.5, zoom: 1, tilt: 0 },
  ],
  "pan right": [
    { t: 0, x: 0.4, y: 0.5, zoom: 1.35, tilt: -4 },
    { t: 1, x: 0.6, y: 0.5, zoom: 1.35, tilt: 4 },
  ],
  "pan left": [
    { t: 0, x: 0.6, y: 0.5, zoom: 1.35, tilt: 4 },
    { t: 1, x: 0.4, y: 0.5, zoom: 1.35, tilt: -4 },
  ],
  drift: [
    { t: 0, x: 0.46, y: 0.46, zoom: 1.12, tilt: -3 },
    { t: 1, x: 0.54, y: 0.54, zoom: 1.22, tilt: 3 },
  ],
}

/** The move a clip's keys are, or "custom". */
export function cameraMoveOf(keys: ReelCameraKey[]): string {
  const same = (a: ReelCameraKey[], b: ReelCameraKey[]) =>
    a.length === b.length &&
    a.every((k, i) => (["t", "x", "y", "zoom", "tilt"] as const).every((p) => Math.abs(k[p] - b[i][p]) < 1e-6))
  return Object.keys(CAMERA_MOVES).find((name) => same(keys, CAMERA_MOVES[name])) ?? "custom"
}

/* -------------------------------- callouts ------------------------------- */

/** A callout drawing in over 0.9s from its `from` and fading over 0.3s to its `to`. */
export type CalloutState = ReelCallout & { drawn: number; fade: number }

/** The callouts up `local` seconds into a clip. */
export function calloutsAt(clip: ReelClip, local: number): CalloutState[] {
  return clip.callouts
    .map((c) => ({
      ...c,
      drawn: Math.min(1, Math.max(0, (local - c.from) / 0.9)),
      fade: Math.min(1, Math.max(0, (c.to - local) / 0.3)),
    }))
    .filter((c) => c.drawn > 0 && c.fade > 0)
}

/* -------------------------------- chapters ------------------------------- */

export type ChapterState = { chapter: ReelChapter; previous: ReelChapter | null; progress: number }

/** The chapter on screen: the last one set at or before the clip on screen,
 * the one before it while it comes in (over 0.5s from its clip's start). */
export function chapterAt(clips: ReelClip[], m: ReelMoment | null): ChapterState | null {
  if (!m) return null
  let at = -1
  for (let i = Math.min(m.index, clips.length - 1); i >= 0; i--)
    if (clips[i].chapter) {
      at = i
      break
    }
  if (at < 0) return null
  let previous: ReelChapter | null = null
  for (let i = at - 1; i >= 0; i--)
    if (clips[i].chapter) {
      previous = clips[i].chapter
      break
    }
  const progress = at === m.index ? ease(Math.min(1, m.local / 0.5)) : 1
  return { chapter: clips[at].chapter as ReelChapter, previous, progress }
}

/** Whether a reel draws a chapter band at all. */
export const hasChapters = (clips: ReelClip[]): boolean => clips.some((c) => c.chapter)

/* ---------------------------------- score -------------------------------- */

/** The cut as the score's plan: where each clip begins, where a chapter turns
 * (not the first), where each callout lands. */
export function scorePlanOf(reel: ReelModel, seconds = reelDuration(reel.clips)): ScorePlan {
  const clips: number[] = []
  const marks: number[] = []
  const ticks: number[] = []
  let t = 0
  reel.clips.forEach((c, i) => {
    clips.push(t)
    if (i > 0 && c.chapter) marks.push(t + 0.1)
    for (const k of c.callouts) ticks.push(t + k.from)
    t += Math.max(0, c.seconds)
  })
  return { seconds, clips, marks, ticks, seed: reel.score?.seed ?? 1 }
}
