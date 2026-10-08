// The reel's timeline: clips laid end to end by the kit's sequence algebra,
// a moment resolved to the clip on screen, the clip it is coming in over and
// the eased progress of that transition. Pure — the renderer, the inspector
// and the export all read the same answer for the same time.
import type { ReelClip, ReelTransitionKind } from "@/entities/widget"
import { planSequence, resolveEasing, type WipeDirection } from "@dither-kit"

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
  const plan = planSequence({ kind: "serial", nodes: clips.map((c, i) => ({ kind: "track", id: String(i), duration: Math.max(0.001, c.seconds) })) })
  const time = Math.min(Math.max(0, Number.isFinite(t) ? t : 0), Math.max(0, plan.duration - 1e-6))
  let index = plan.tracks.findIndex((tr) => time >= tr.t0 && time < tr.end)
  if (index < 0) index = clips.length - 1
  const local = time - plan.tracks[index].t0
  const tr = clips[index].transition
  // The first clip comes in over the frame's own background.
  const running = tr.kind !== "cut" && tr.seconds > 0 && local < tr.seconds
  return { index, local, outgoing: running && index > 0 ? index - 1 : null, progress: running ? ease(local / tr.seconds) : 1 }
}

/** Free-running playback wraps around. */
export const reelLoop = (clips: ReelClip[], t: number): number => {
  const total = reelDuration(clips)
  return total > 0 ? ((t % total) + total) % total : 0
}

export const wipeDirectionOf = (kind: ReelTransitionKind): WipeDirection =>
  kind === "wipe-right" ? "right" : kind === "wipe-left" ? "left" : kind === "wipe-down" ? "down" : kind === "wipe-up" ? "up" : "none"
