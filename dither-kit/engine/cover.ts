// The cover: a layer that hides the page while it stands (a full-screen
// sheet, a modal). One moving layer at a time: while a cover stands, every
// kit loop under it holds its last frame (nothing it would paint can be
// seen, and its frames would only steal the cover's own), and each wakes as
// the cover lifts, its timing kept. Loops inside the cover run on. Plain DOM,
// no framework.

let layer: Element | null = null
const listeners = new Set<() => void>()

/** Raise `el` as the cover, or lift it (`null`). */
export function coverPage(el: Element | null): void {
  if (layer === el) return
  layer = el
  for (const fn of [...listeners]) fn()
}

/** Whether `el` lies under the cover: one stands and `el` is not inside it. */
export function isCovered(el: Element | null | undefined): boolean {
  return layer !== null && !!el && !layer.contains(el)
}

/** Call `fn` whenever a cover is raised or lifted; returns the unsubscribe. */
export function onCoverChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
