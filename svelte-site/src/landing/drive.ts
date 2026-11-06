// Art that moves only on cue (no perpetual loops), the Vue landing's
// `drive.ts` as a Svelte action: attached to the art's card, it reports
// `true` for `dance` ms as the card comes into view, then for a moment
// after each scroll while it stays in view, and `false` as the cues stop.
export function drive(node: HTMLElement, params: { dance: number; onChange: (moving: boolean) => void }) {
  let p = params
  let until = 0
  let settle = 0
  let inView = false
  const run = (ms: number) => {
    until = Math.max(until, performance.now() + ms)
    p.onChange(true)
    clearTimeout(settle)
    settle = window.setTimeout(() => p.onChange(false), until - performance.now())
  }
  const scrolled = () => inView && run(240)
  addEventListener("scroll", scrolled, { passive: true })
  const io =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          ([entry]) => {
            const was = inView
            inView = !!entry?.isIntersecting
            if (inView && !was) run(p.dance)
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
      clearTimeout(settle)
    },
  }
}
