// The bento's rail under 1024px (the user's call): one card a flick, and a
// row of dots under it that says which card stands at the rail's start and
// takes the reader to any other. Framework-free: which card a scroll
// position stands on, from the cards' starts along the rail.

/** The index of the card whose start is nearest `scrollLeft`; at the
 * rail's end (`atEnd`), the last card, which may never reach the start. */
export function railIndex(scrollLeft: number, starts: readonly number[], atEnd = false): number {
  if (!starts.length) return 0
  if (atEnd) return starts.length - 1
  let best = 0
  for (let i = 1; i < starts.length; i++)
    if (Math.abs(starts[i] - scrollLeft) < Math.abs(starts[best] - scrollLeft)) best = i
  return best
}

/** Each card's start along `rail`, where a scroll that stands on it sits. */
export function railStarts(rail: HTMLElement): number[] {
  const cards = [...rail.children] as HTMLElement[]
  const first = cards[0]?.offsetLeft ?? 0
  return cards.map((c) => c.offsetLeft - first)
}
