// What Vue's `watch` was to the Studio's stores: a callback some time after
// what a getter reads has changed, never as it changes. The stores are
// mutable (`createMutable`), and Solid runs an effect as each write lands;
// history, autosave and the agent's mirror were written for Vue's timing
// (every write of one turn seen once, after the code that made them has
// finished), and their echo guards depend on it. So the callback waits for
// the microtask after the first change, and runs once for all of them.
import { createEffect, createRoot } from "solid-js"
import { isServer } from "solid-js/web"

/** Read everything under a value, so an effect tracks all of it. */
function traverse(v: unknown, seen = new Set<unknown>()): void {
  if (!v || typeof v !== "object" || seen.has(v)) return
  seen.add(v)
  for (const key of Object.keys(v)) traverse((v as Record<string, unknown>)[key], seen)
}

/** Call `changed` after what `source` reads has changed (with `deep`,
 * anything under what it returns); never for the first read. Returns the
 * stop, after which a callback still waiting does not run. A server render
 * watches nothing. */
export function watch(source: () => unknown, changed: () => void, opts: { deep?: boolean } = {}): () => void {
  if (isServer) return () => {}
  let live = true
  let queued = false
  const dispose = createRoot((dispose) => {
    createEffect((first: boolean) => {
      const value = source()
      if (opts.deep) traverse(value)
      if (!first && !queued) {
        queued = true
        queueMicrotask(() => {
          queued = false
          if (live) changed()
        })
      }
      return false
    }, true)
    return dispose
  })
  return () => {
    live = false
    dispose()
  }
}
