import { getContext, setContext } from "svelte"
import type { Seed } from "../engine/palette"

/** Live series surface for markers — `seed`/`dimmed` are getters so `<Dot>` /
 * `<ActiveDot>` read the current selection state reactively. */
export type SeriesContextValue = {
  dataKey: string
  seed: Seed
  dimmed: boolean
}

const SeriesKey = Symbol("dither-series")

/** Published by a series part (`<Bar>`, `<Area>`, `<Line>`) for its markers. */
export function setSeries(ctx: SeriesContextValue): void {
  setContext(SeriesKey, ctx)
}

/** Boundary guard for series-scoped markers (`<Dot>`, `<ActiveDot>`). */
export function useSeries(part: string): SeriesContextValue {
  const ctx = getContext<SeriesContextValue>(SeriesKey) ?? null
  if (!ctx) {
    throw new Error(
      `<${part} /> must be rendered inside a series (e.g. <Area />).`
    )
  }
  return ctx
}
