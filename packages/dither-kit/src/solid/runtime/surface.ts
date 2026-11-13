// Solid's binding of the surface loop (`engine/surface-loop.ts`, where the
// behaviour lives): a component hands it accessors for its elements and
// getters into its props, and the loop follows the component's lifecycle.
// Nothing here runs while rendering on a server: the loop is made (which
// touches nothing) and everything else waits for the mount.

import { createEffect, createMemo, on, onCleanup, onMount } from "solid-js"
import { createSurfaceLoop, type DitherSurface, type SurfaceLoopOptions } from "../../engine/surface-loop"

export { surfaceOf, type DitherSurface } from "../../engine/surface-loop"

export type DitherBackgroundOptions = Omit<SurfaceLoopOptions, "defer"> & {
  /** Reactive sources that force a full restart when they change. */
  restart: () => unknown
}

export function createDitherBackground(opts: DitherBackgroundOptions): DitherSurface {
  const loop = createSurfaceLoop(opts)
  // The loop hears of a pause only when the answer changes, not each time
  // something the answer reads does.
  const paused = createMemo(opts.paused)
  onMount(() => {
    loop.mount()
    createEffect(on(opts.restart, loop.start, { defer: true }))
    createEffect(on(paused, loop.pausedChanged, { defer: true }))
  })
  onCleanup(loop.dispose)
  return loop.surface
}
