/** The band under the docs header where a section counts as in view: from
 * the 56px header band down to the viewport's middle. */
export const SPY_MARGIN = "-56px 0px -50% 0px"

/** The docs' scroll-spy: the topmost section in the band is the one in view.
 * An observer's callback carries only the entries that CHANGED, so the band
 * is kept across calls: a section already in it still counts when the next
 * one enters (reading the changed entries alone named the section below).
 * Between sections (an empty band) the last one stays. Returns the stop. */
export function spySections(sections: Element[], onActive: (id: string) => void): () => void {
  const band = new Set<Element>()
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) band.add(e.target)
        else band.delete(e.target)
      }
      let top: Element | null = null
      let best = Infinity
      for (const el of band) {
        const y = el.getBoundingClientRect().top
        if (y < best) {
          best = y
          top = el
        }
      }
      if (top) onActive(top.id)
    },
    { rootMargin: SPY_MARGIN },
  )
  for (const el of sections) observer.observe(el)
  return () => observer.disconnect()
}
