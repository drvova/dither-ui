/**
 * The director: external ownership of kit time.
 *
 * Free-running, every animated surface (the background runtime, the chart
 * canvases, Sequence, the spinner, the text effects) owns a
 * requestAnimationFrame loop fed by wall time. Under direction those loops
 * stand down and each surface paints exactly the moment it is given — the
 * contract a frame-by-frame renderer needs (HyperFrames seeks a page with
 * `hf-seek` events) and a test can drive: same seed + same time → same
 * pixels, in any order.
 *
 * Surfaces subscribe with `onSeek`. A listener receives the directed moment
 * in ms, or null when direction is released and loops may resume.
 */
export type SeekListener = (ms: number | null) => void

const listeners = new Set<SeekListener>()
let directedMs: number | null = null

/** True while an external director owns time. */
export const isDirected = (): boolean => directedMs !== null

/** The directed moment in ms, or null when free-running. */
export const directedTime = (): number | null => directedMs

/** Subscribe a surface; returns the unsubscribe. */
export function onSeek(listener: SeekListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Direct every surface to `ms` of composition time. */
export function seek(ms: number): void {
  directedMs = Number.isFinite(ms) ? Math.max(0, ms) : 0
  for (const l of listeners) l(directedMs)
}

/** Hand time back to the surfaces' own loops. */
export function release(): void {
  if (directedMs === null) return
  directedMs = null
  for (const l of listeners) l(null)
}

/**
 * Take direction from HyperFrames: its runtime dispatches `hf-seek` on
 * `window` (`detail.time` in seconds) for every frame it captures, so a page
 * that installs this renders the kit deterministically under
 * `npx hyperframes render`. Returns the uninstaller.
 */
export function directFromHyperframes(target: EventTarget = window): () => void {
  const on = (e: Event) => {
    const time = (e as CustomEvent<{ time?: unknown }>).detail?.time
    if (typeof time === "number") seek(time * 1000)
  }
  target.addEventListener("hf-seek", on)
  return () => target.removeEventListener("hf-seek", on)
}
