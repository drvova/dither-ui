// The changes bar as data: what the latest turn changed on the canvas,
// until it is kept or undone, all at once or frame by frame, and the frame
// just undone, which can go back as the turn left it while nothing else
// changed. Pure: the panel keeps the turns' checkpoints and does the
// canvas's part (restore, undo); these say what the bar shows after.
import type { Changed } from "./steps"
import { changesOf, type Entry } from "./thread"

/** The frame just undone: its name, and the canvas's checkpoint right after
 * (it goes back only while the canvas still stands there). */
type PutBack = { id: string; name: string; after: string }

type Bar = {
  /** Turns whose changes were kept or undone: their bar is gone. */
  settled: ReadonlySet<number>
  /** The latest turn's frames settled one by one. */
  frames: ReadonlySet<string>
  putBack: PutBack | null
}

export const NO_BAR: Bar = { settled: new Set(), frames: new Set(), putBack: null }
/** A chat restored with `turnNo` turns: all of them settled. */
export const settledThrough = (turnNo: number): ReadonlySet<number> =>
  new Set(Array.from({ length: turnNo + 1 }, (_, i) => i))

/** What the bar shows for turn `turnNo`: the frames still to settle (none
 * left, it shows while a frame can be put back), or null. */
export function barChanges(entries: readonly Entry[], turnNo: number, bar: Bar) {
  if (!turnNo || bar.settled.has(turnNo)) return null
  const c = changesOf(entries, turnNo)
  if (!c) return null
  const frames: Changed[] = c.frames.filter((f) => !bar.frames.has(f.id))
  return frames.length || bar.putBack ? { ...c, frames } : null
}

/** A new turn: its frames start unsettled, nothing to put back. */
export const nextTurn = (bar: Bar): Bar => ({ ...bar, frames: NO_BAR.frames, putBack: null })
/** One frame kept. */
export const keptFrame = (bar: Bar, id: string): Bar => ({
  ...bar,
  frames: new Set(bar.frames).add(id),
  putBack: null,
})
/** One frame undone (back where the turn found it): it can be put back. */
export const undoneFrame = (bar: Bar, f: Changed, after: string): Bar => ({
  ...bar,
  frames: new Set(bar.frames).add(f.id),
  putBack: { id: f.id, name: f.name, after },
})
/** The frame just undone, back as the turn left it. */
export function putBack(bar: Bar): Bar {
  const frames = new Set(bar.frames)
  if (bar.putBack) frames.delete(bar.putBack.id)
  return { ...bar, frames, putBack: null }
}
/** Nothing to put back any more (the canvas moved on). */
export const forgotPutBack = (bar: Bar): Bar => ({ ...bar, putBack: null })
/** A turn's changes kept or undone at once. */
export const settledTurn = (bar: Bar, turn: number): Bar => ({ ...bar, settled: new Set(bar.settled).add(turn) })
/** The canvas back to before turn `at`: it and every turn after it settled. */
export const restoredTo = (bar: Bar, at: number, turnNo: number): Bar => ({
  ...bar,
  settled: new Set([...bar.settled, ...Array.from({ length: turnNo - at + 1 }, (_, i) => at + i)]),
})
