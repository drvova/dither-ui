// Art that moves only on cue (no perpetual loops), the Vue landing's
// `drive.ts` in Svelte. `createDrive` is the timer: `run(ms)` keeps the art
// moving at least that much longer, and `onChange` hears it start and
// settle. The `drive` action attaches one to a card: a dance as the card
// comes into view, then a moment after each scroll while it stays in view.
export function createDrive(onChange: (moving: boolean) => void) {
  let until = 0
  let settle = 0
  return {
    run(ms = 240) {
      until = Math.max(until, performance.now() + ms)
      onChange(true)
      clearTimeout(settle)
      settle = window.setTimeout(() => onChange(false), until - performance.now())
    },
    dispose() {
      clearTimeout(settle)
    },
  }
}

export function drive(node: HTMLElement, params: { dance: number; onChange: (moving: boolean) => void }) {
  let p = params
  const timer = createDrive((m) => p.onChange(m))
  let inView = false
  const scrolled = () => inView && timer.run()
  addEventListener("scroll", scrolled, { passive: true })
  const io =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          ([entry]) => {
            const was = inView
            inView = !!entry?.isIntersecting
            if (inView && !was) timer.run(p.dance)
          },
          { threshold: 0.5 },
        )
  io?.observe(node)
  return {
    update(next: typeof params) {
      p = next
    },
    destroy() {
      io?.disconnect()
      removeEventListener("scroll", scrolled)
      timer.dispose()
    },
  }
}
