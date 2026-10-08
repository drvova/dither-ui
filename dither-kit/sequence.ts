// Sequence — pure timeline algebra. Many animations moving together: serial
// chains, parallel groups, staggered waves, loops. DOM-free and clock-free by
// contract (see dither-kit/AGENTS.md): `planSequence` flattens a node tree into
// scheduled tracks once, `sampleSequence(plan, t)` maps any moment to every
// track's state — drivers own the clock (Sequence.vue, or your own rAF loop).
// Easing is the same `Easing` shape timing.ts exports, so steps() composes
// straight into a sequence: quantized motion over orchestrated motion.
// tests/sequence.spec.ts pins the algebra; change both together.

import type { Easing } from "./timing"

/** Where a stagger group starts first: `number` = literal index. */
export type StaggerFrom = "start" | "center" | "end" | "edges" | number

/** One cycle of one animation. `loop` multiplies duration; `yoyo` reverses
 * odd cycles (settling at 1 for an odd loop, 0 for an even one). */
export type TrackNode = {
  kind: "track"
  /** Stable handle — defaults to the track's position in the plan. */
  id?: string
  /** One cycle, seconds. */
  duration: number
  /** Seconds before the first cycle starts. */
  delay?: number
  easing?: Easing
  /** Whole cycles ≥ 1 (default 1). */
  loop?: number
  /** Odd cycles play in reverse. */
  yoyo?: boolean
}

/** A runs, then B (…+ `gap` seconds between each). */
export type SerialNode = {
  kind: "serial"
  nodes: SequenceNode[]
  gap?: number
}

/** All run together. `align: "end"` shifts each subtree so they finish
 * together instead of starting together. */
export type ParallelNode = {
  kind: "parallel"
  nodes: SequenceNode[]
  align?: "start" | "end"
}

/** `count` copies of `node(i)`, delays spread by `stagger` seconds from the
 * `from` origin (start / center / end / edges / literal index). */
export type StaggerNode = {
  kind: "stagger"
  count: number
  /** Seconds between neighbouring starts. */
  stagger: number
  from?: StaggerFrom
  node: (index: number) => TrackNode
}

export type SequenceNode = TrackNode | SerialNode | ParallelNode | StaggerNode

/** One flattened track: an absolute start and everything sample() needs. */
export type ScheduledTrack = {
  id: string
  t0: number
  /** One cycle, seconds. */
  duration: number
  /** Effective end (t0 + duration × loop). */
  end: number
  easing: Easing
  loop: number
  yoyo: boolean
}

export type SequencePlan = {
  tracks: ScheduledTrack[]
  /** When every track has settled (max end). */
  duration: number
}

export type TrackState = "before" | "active" | "done"

export type TrackSample = {
  id: string
  /** Position in the plan — for stagger drivers, the child index. */
  index: number
  /** Eased progress, ready to write. */
  progress: number
  /** Raw progress before easing (direction already applied). */
  raw: number
  /** 0-based cycle. */
  cycle: number
  state: TrackState
}

const identity: Easing = (p) => p

/** Seconds until the group's i-th copy starts. */
export function staggerDelay(index: number, count: number, each: number, from: StaggerFrom = "start"): number {
  if (count <= 1) return 0
  const center = (count - 1) / 2
  if (from === "start") return index * each
  if (from === "end") return (count - 1 - index) * each
  if (from === "center") return Math.abs(index - center) * each
  if (from === "edges") return (center - Math.abs(index - center)) * each
  return Math.abs(index - from) * each
}

/** Span of one node without scheduling it (used for align:"end"). */
function durationOf(node: SequenceNode): number {
  switch (node.kind) {
    case "track":
      return (node.delay ?? 0) + node.duration * Math.max(1, Math.floor(node.loop ?? 1))
    case "serial":
      return node.nodes.reduce((sum, child, i) => sum + durationOf(child) + (i ? node.gap ?? 0 : 0), 0)
    case "parallel":
      return Math.max(0, ...node.nodes.map(durationOf))
    case "stagger": {
      let max = 0
      for (let i = 0; i < node.count; i++) {
        max = Math.max(max, staggerDelay(i, node.count, node.stagger, node.from) + durationOf(node.node(i)))
      }
      return max
    }
  }
}

function walk(node: SequenceNode, t0: number, out: ScheduledTrack[]): number {
  switch (node.kind) {
    case "track": {
      const loop = Math.max(1, Math.floor(node.loop ?? 1))
      const start = t0 + (node.delay ?? 0)
      const end = start + node.duration * loop
      out.push({
        id: node.id ?? String(out.length),
        t0: start,
        duration: node.duration,
        end,
        easing: node.easing ?? identity,
        loop,
        yoyo: node.yoyo ?? false,
      })
      return end
    }
    case "serial": {
      let cursor = t0
      node.nodes.forEach((child, i) => {
        cursor = walk(child, cursor, out)
        if (i < node.nodes.length - 1) cursor += node.gap ?? 0
      })
      return cursor
    }
    case "parallel": {
      const span = node.align === "end" ? durationOf(node) : 0
      let end = t0
      for (const child of node.nodes) {
        // align:"end" shifts later-starting (shorter) subtrees so all finish
        // at t0 + span; align:"start" (default) gives everyone t0.
        const shift = node.align === "end" ? span - durationOf(child) : 0
        end = Math.max(end, walk(child, t0 + shift, out))
      }
      return end
    }
    case "stagger": {
      let end = t0
      for (let i = 0; i < node.count; i++) {
        const delay = staggerDelay(i, node.count, node.stagger, node.from)
        end = Math.max(end, walk(node.node(i), t0 + delay, out))
      }
      return end
    }
  }
}

/** Flatten a node tree (or a list of nodes — parallel shorthand) into
 * scheduled tracks with absolute times. */
export function planSequence(input: SequenceNode | SequenceNode[]): SequencePlan {
  const root: SequenceNode = Array.isArray(input) ? { kind: "parallel", nodes: input } : input
  const tracks: ScheduledTrack[] = []
  walk(root, 0, tracks)
  return { tracks, duration: Math.max(0, ...tracks.map((t) => t.end)) }
}

/** All tracks at moment `t` (seconds). Before t0 → progress 0; at/after end →
 * the terminal value (1, or 0 for a yoyo odd loop). */
export function sampleSequence(plan: SequencePlan, t: number): TrackSample[] {
  return plan.tracks.map((track, index) => {
    if (t < track.t0) return { id: track.id, index, progress: 0, raw: 0, cycle: 0, state: "before" as const }
    const elapsed = t - track.t0
    const settled = elapsed >= track.duration * track.loop
    const cycle = Math.min(track.loop - 1, Math.floor(elapsed / Math.max(track.duration, 1e-9)))
    const within = settled ? 1 : Math.min(1, Math.max(0, (elapsed - cycle * track.duration) / Math.max(track.duration, 1e-9)))
    const reversed = track.yoyo && cycle % 2 === 1
    // Terminal value = where the LAST cycle naturally lands: forward legs end
    // at 1, a reversed (even, yoyo) last leg ends at 0 — continuous with the
    // active-leg math above, so settling never jumps.
    const raw = settled ? (track.yoyo ? (track.loop % 2 === 1 ? 1 : 0) : 1) : reversed ? 1 - within : within
    return {
      id: track.id,
      index,
      progress: track.easing(raw),
      raw,
      cycle,
      state: settled ? ("done" as const) : ("active" as const),
    }
  })
}
