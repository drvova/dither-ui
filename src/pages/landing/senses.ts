// senses: the landing's one heartbeat. Vanilla, no framework imports. ONE
// rAF ticks every subscribed organism (the portraits' shake), paused while
// the tab is hidden or the reader asks for reduced motion, and stopped when
// nobody is subscribed. Organisms never run a rAF of their own.

export type Organism = { tick(dt: number): void }

export type Senses = {
  readonly hidden: boolean
  readonly reduced: boolean
  /** Subscribe an organism to the heartbeat; returns unsubscribe. */
  subscribe(o: Organism): () => void
  destroy(): void
}

export function createSenses(): Senses {
  const organisms = new Set<Organism>()
  const mq = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null
  let reduced = mq?.matches ?? false
  let hidden = typeof document !== "undefined" && document.hidden
  let raf = 0
  let last = 0

  const onVisibility = () => {
    hidden = document.hidden
    if (hidden) stop()
    else start()
  }
  const onMotion = (e: MediaQueryListEvent) => {
    reduced = e.matches
    if (reduced) stop()
    else start()
    // Reduced motion flips are rare; organisms learn it on their next tick
    // (they receive one tick so they can paint their static frame).
    for (const o of organisms) o.tick(0)
  }

  function beat(now: number) {
    raf = 0
    if (hidden || reduced || organisms.size === 0) return
    if (!last) last = now
    const dt = Math.min(now - last, 250) // clamp tab-switch jumps
    last = now
    for (const o of organisms) o.tick(dt)
    raf = requestAnimationFrame(beat)
  }
  function start() {
    // No heartbeat without a frame clock (tests, prerender): organisms still
    // paint their static frame on mount.
    if (raf || hidden || reduced || organisms.size === 0 || typeof requestAnimationFrame === "undefined") return
    last = 0
    raf = requestAnimationFrame(beat)
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility)
  mq?.addEventListener("change", onMotion)

  return {
    get hidden() {
      return hidden
    },
    get reduced() {
      return reduced
    },
    subscribe(o) {
      organisms.add(o)
      start()
      return () => {
        organisms.delete(o)
        if (organisms.size === 0) stop()
      }
    },
    destroy() {
      stop()
      organisms.clear()
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility)
      mq?.removeEventListener("change", onMotion)
    },
  }
}

let shared: Senses | null = null

/** The page's one heartbeat, created on first use. */
export function senses(): Senses {
  if (!shared) shared = createSenses()
  return shared
}
