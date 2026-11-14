// The kit clock's moment for a component that changes on a cadence (a word
// every interval, a letter every few ms, a drift, a rise): one signal of ms
// it derives what it shows from. Free-running it is the component's own run
// from its mount, advanced by animation frames while its host is in view
// (`createInviewLoop`): a frame steps at most `MAX_STEP`, so a wake after a
// hidden tab moves on instead of jumping, and under reduced motion (unless
// the caller runs through it) it stands at 0. Directed (`engine/clock.ts`)
// it is the directed moment, and no frame is asked; released, the run goes
// on from where it stood.

import { type Accessor, createSignal, onCleanup, onMount } from "solid-js"
import { directedTime, isDirected, onSeek } from "../../engine/clock"
import { pixelPrefersReducedMotion } from "../../engine/pixel"
import { createInviewLoop } from "./in-view"

/** The longest step one frame takes, ms. */
const MAX_STEP = 100

export type KitTime = {
  /** The moment, ms: the run's own, or the directed one. */
  time: Accessor<number>
  /** True while frames advance the run (in view, free-running). */
  running: Accessor<boolean>
}

/** `hold`: the run stands at 0 under reduced motion; `run`: the caller's
 * motion stays calm by itself (a crossfade), so the run goes on. */
export type ReducedMotion = "hold" | "run"

export function createKitTime(
  host: () => HTMLElement | SVGElement | null | undefined,
  reduced: ReducedMotion = "hold",
): KitTime {
  const [time, setTime] = createSignal(directedTime() ?? 0)
  const [running, setRunning] = createSignal(false)
  let own = 0
  let last = 0
  let raf = 0
  let inView = false

  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    if (last) own += Math.min(MAX_STEP, Math.max(0, now - last))
    last = now
    setTime(own)
  }
  function start() {
    if (raf || !inView || isDirected() || (reduced === "hold" && pixelPrefersReducedMotion())) return
    last = 0
    raf = requestAnimationFrame(frame)
    setRunning(true)
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    setRunning(false)
  }

  onMount(() => {
    onCleanup(
      onSeek((ms) => {
        if (ms === null) {
          setTime(own)
          start()
        } else {
          stop()
          setTime(ms)
        }
      }),
    )
  })
  createInviewLoop(
    host,
    () => {
      inView = true
      start()
    },
    () => {
      inView = false
      stop()
    },
  )
  return { time, running }
}
