// senses: the organism's nervous and endocrine system. Vanilla — no
// framework imports — one singleton the page's canvas creatures subscribe
// to instead of each growing its own eyes.
//
// Nervous: ONE pointer, scroll, visibility and reduced-motion sensorium,
// and ONE heartbeat rAF that ticks every subscribed organism. Organisms
// never register listeners of their own; they read `senses` on each tick.
//
// Endocrine: slow global scalars every organism may read —
//   arousal  0–1  rises with pointer speed, decays with a ~4s half-life;
//                 organisms run their clocks at `tempo` = 1 + 0.6·arousal.
//   drowsy   0–1  after 45s without input it ramps over 30s; organisms
//                 thin and slow; any input wakes it to 0.
//   daylight 0–1  local hour as a cosine (0 at midnight, 1 at noon).
//
// Metabolism: a governor samples how long the heartbeat's ticks took
// (an EMA of frame work) and steps `quality` down 1 → 0.75 → 0.5 when
// frames run over budget, back up slowly when there is headroom.
// Organisms translate quality into frame rate, cell size and detail.

export type Organism = { tick(dt: number, tempo: number): void }

export type Hormones = { arousal: number; drowsy: number; daylight: number }

export const IDLE_AFTER = 45_000
export const DROWSY_RAMP = 30_000

/** Local-hour daylight: 0 at midnight, 1 at noon, smooth in between. */
export function daylight(hour: number): number {
  return 0.5 - 0.5 * Math.cos(((hour % 24) / 24) * Math.PI * 2)
}

/** Advance the hormones by `dt` ms given the pointer distance moved since
 * the last step and the time since the last input. Pure. */
export function stepHormones(h: Hormones, dt: number, moved: number, idleMs: number): Hormones {
  const arousal = Math.min(1, h.arousal * Math.exp(-dt / 4000) + moved * 0.004)
  const drowsy = idleMs > IDLE_AFTER ? Math.min(1, (idleMs - IDLE_AFTER) / DROWSY_RAMP) : 0
  return { arousal, drowsy, daylight: h.daylight }
}

export const QUALITY_TIERS = [1, 0.75, 0.5] as const

/** The metabolic governor. Feed it each frame's work (ms); it answers with
 * the quality tier. Steps down after `downAfter` consecutive frames whose
 * EMA runs over `over` ms, up after `upAfter` frames under `under` ms. */
export function createGovernor(opts: { over?: number; under?: number; downAfter?: number; upAfter?: number } = {}) {
  const over = opts.over ?? 9
  const under = opts.under ?? 3
  const downAfter = opts.downAfter ?? 30
  const upAfter = opts.upAfter ?? 300
  let tier = 0
  let ema = 0
  let hot = 0
  let cool = 0
  return {
    sample(cost: number): number {
      ema += (cost - ema) * 0.05
      if (ema > over) {
        hot++
        cool = 0
        if (hot >= downAfter && tier < QUALITY_TIERS.length - 1) {
          tier++
          hot = 0
          ema = under // start the next tier with a clean slate
        }
      } else if (ema < under) {
        cool++
        hot = 0
        if (cool >= upAfter && tier > 0) {
          tier--
          cool = 0
        }
      } else {
        hot = 0
        cool = 0
      }
      return QUALITY_TIERS[tier]
    },
    get quality() {
      return QUALITY_TIERS[tier]
    },
    get ema() {
      return ema
    },
  }
}

export type Senses = {
  readonly pointer: { x: number; y: number; inside: boolean }
  readonly scrollY: number
  readonly hidden: boolean
  readonly reduced: boolean
  readonly quality: number
  readonly hormones: Hormones
  /** Subscribe an organism to the heartbeat; returns unsubscribe. */
  subscribe(o: Organism): () => void
  destroy(): void
}

export function createSenses(): Senses {
  const pointer = { x: -1e4, y: -1e4, inside: false }
  const hormones: Hormones = { arousal: 0, drowsy: 0, daylight: daylight(new Date().getHours() + new Date().getMinutes() / 60) }
  const governor = createGovernor()
  const organisms = new Set<Organism>()
  const mq = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null
  let reduced = mq?.matches ?? false
  let hidden = typeof document !== "undefined" && document.hidden
  let scrollY = typeof window !== "undefined" ? window.scrollY : 0
  let quality = 1
  let raf = 0
  let last = 0
  let moved = 0
  let lastInput = typeof performance !== "undefined" ? performance.now() : 0

  const wake = () => {
    lastInput = performance.now()
    if (hormones.drowsy > 0) hormones.drowsy = 0
  }
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return
    if (pointer.inside) moved += Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y)
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.inside = true
    wake()
  }
  const onLeave = () => {
    pointer.inside = false
  }
  const onScroll = () => {
    scrollY = window.scrollY
    wake()
  }
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
    for (const o of organisms) o.tick(0, 1)
  }

  function beat(now: number) {
    raf = 0
    if (hidden || reduced || organisms.size === 0) return
    if (!last) last = now
    const dt = Math.min(now - last, 250) // clamp tab-switch jumps
    last = now
    Object.assign(hormones, stepHormones(hormones, dt, moved, now - lastInput))
    moved = 0
    const tempo = 1 + hormones.arousal * 0.6
    const start = performance.now()
    for (const o of organisms) o.tick(dt, tempo)
    quality = governor.sample(performance.now() - start)
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

  if (typeof window !== "undefined") {
    window.addEventListener("pointermove", onMove, { passive: true })
    document.addEventListener("pointerleave", onLeave, { passive: true })
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("keydown", wake, { passive: true })
    window.addEventListener("touchstart", wake, { passive: true })
    document.addEventListener("visibilitychange", onVisibility)
    mq?.addEventListener("change", onMotion)
  }

  return {
    pointer,
    get scrollY() {
      return scrollY
    },
    get hidden() {
      return hidden
    },
    get reduced() {
      return reduced
    },
    get quality() {
      return quality
    },
    hormones,
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
      if (typeof window === "undefined") return
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("keydown", wake)
      window.removeEventListener("touchstart", wake)
      document.removeEventListener("visibilitychange", onVisibility)
      mq?.removeEventListener("change", onMotion)
    },
  }
}

let shared: Senses | null = null

/** The page's one sensorium, created on first use. */
export function senses(): Senses {
  if (!shared) shared = createSenses()
  return shared
}
