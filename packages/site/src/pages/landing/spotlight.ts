// One moving layer at a time: of the bento's cards whose surfaces move by
// themselves, one plays and the rest hold a still frame. It is the card the
// pointer or focus is on; else the card the reader last chose, while any of
// it is on screen; else the first card, in page order, crossing the middle
// of the viewport; else the last one that played.
export type Spot<T> = {
  pointed: T | null
  chosen: T | null
  visible: ReadonlySet<T>
  centred: ReadonlySet<T>
  last: T | null
}

export function spotlight<T>(order: readonly T[], spot: Spot<T>): T | null {
  if (spot.pointed !== null) return spot.pointed
  if (spot.chosen !== null && spot.visible.has(spot.chosen)) return spot.chosen
  return order.find((id) => spot.centred.has(id)) ?? spot.last
}
