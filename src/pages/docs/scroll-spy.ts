/** The band under the docs header where a section counts as in view: from
 * the 56px header band down to the viewport's middle, in px. A percentage
 * would not do: the spec resolves rootMargin percentages against the root's
 * WIDTH, so on a wide screen "-50%" puts the band's foot above its top. */
export const spyMargin = (viewportHeight: number) => `-56px 0px -${Math.round(viewportHeight / 2)}px 0px`

/** Where a reader is reading: a section whose top has crossed this line,
 * 40% down the viewport, is the one they are in. */
export const READING_LINE = 0.4

/** The docs' scroll-spy: of the sections in the band, the last whose top has
 * crossed the reading line is the one in view (a long section's tail above
 * it never outranks the heading the reader has reached); none crossed, the
 * topmost.
 * An observer's callback carries only the entries that CHANGED, so the band
 * is kept across calls: a section already in it still counts when the next
 * one enters (reading the changed entries alone named the section below).
 * Between sections (an empty band) the last one stays. Returns the stop. */
export function spySections(sections: Element[], onActive: (id: string) => void): () => void {
  const band = new Set<Element>()
  const report = (entries: IntersectionObserverEntry[]) => {
    for (const e of entries) {
      if (e.isIntersecting) band.add(e.target)
      else band.delete(e.target)
    }
    const line = window.innerHeight * READING_LINE
    let crossed: Element | null = null
    let crossedY = -Infinity
    let top: Element | null = null
    let topY = Infinity
    for (const el of band) {
      const y = el.getBoundingClientRect().top
      if (y <= line && y > crossedY) {
        crossedY = y
        crossed = el
      }
      if (y < topY) {
        topY = y
        top = el
      }
    }
    const active = crossed ?? top
    if (active) onActive(active.id)
  }
  // The band follows the viewport's height: a resize rebuilds the observer
  // (which reports every section afresh, so the band starts over).
  let observer: IntersectionObserver
  const observe = () => {
    band.clear()
    observer = new IntersectionObserver(report, { rootMargin: spyMargin(window.innerHeight) })
    for (const el of sections) observer.observe(el)
  }
  observe()
  let height = window.innerHeight
  const resized = () => {
    if (window.innerHeight === height) return
    height = window.innerHeight
    observer.disconnect()
    observe()
  }
  window.addEventListener("resize", resized)
  return () => {
    window.removeEventListener("resize", resized)
    observer.disconnect()
  }
}
