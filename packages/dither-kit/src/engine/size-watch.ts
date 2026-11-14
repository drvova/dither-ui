// An element's size as a ResizeObserver reports it, applied on the next
// frame, never inside the observer's delivery: what a report changes (a
// canvas's backing size, a bucket that lays children out again) can resize
// the box being observed, a resize the observer cannot deliver in the same
// pass, which the browser reports on the window ("ResizeObserver loop
// completed with undelivered notifications"; WebKit's iPhone-width Studio
// notice, through its poster's surface loop). Several reports before the
// frame: the latest wins. Framework-free.

export type SizeWatch = {
  /** Whether the observer has reported, applied or not yet. */
  reported: () => boolean
  /** Stop watching: the observer and any frame still due. */
  stop: () => void
}

/** Watch `el`'s size: `apply` gets the latest report on the frame after it
 * came. Without a ResizeObserver it watches nothing and `apply` never runs. */
export function watchSize(el: Element, apply: (entry: ResizeObserverEntry | undefined) => void): SizeWatch {
  if (typeof ResizeObserver === "undefined") return { reported: () => false, stop: () => {} }
  let frame = 0
  let latest: ResizeObserverEntry | undefined
  let reported = false
  const ro = new ResizeObserver((entries) => {
    reported = true
    latest = entries[entries.length - 1] ?? latest
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      apply(latest)
    })
  })
  ro.observe(el)
  return {
    reported: () => reported,
    stop() {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      ro.disconnect()
    },
  }
}
