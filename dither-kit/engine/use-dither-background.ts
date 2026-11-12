// Vue's binding of the surface loop (`surface-loop.ts`, where the behaviour
// lives): a component hands it refs and getters into its props, and the loop
// follows the component's lifecycle.

import { nextTick, onBeforeUnmount, onMounted, watch, type Ref } from "vue"
import { createSurfaceLoop, type DitherSurface, type SurfaceLoopOptions } from "./surface-loop"

export { surfaceOf, type DitherSurface } from "./surface-loop"

export type DitherBackgroundOptions = Omit<SurfaceLoopOptions, "wrap" | "canvas" | "defer"> & {
  wrapRef: Ref<HTMLElement | null>
  canvasRef: Ref<HTMLCanvasElement | null>
  /** Reactive sources that force a full restart when they change. */
  restart: () => unknown
}

export function useDitherBackground(opts: DitherBackgroundOptions): DitherSurface {
  const loop = createSurfaceLoop({
    ...opts,
    wrap: () => opts.wrapRef.value,
    canvas: () => opts.canvasRef.value,
    defer: (fn) => void nextTick(fn),
  })
  onMounted(loop.mount)
  watch(opts.restart, loop.start, { flush: "post" })
  watch(opts.paused, loop.pausedChanged)
  onBeforeUnmount(loop.dispose)
  return loop.surface
}
