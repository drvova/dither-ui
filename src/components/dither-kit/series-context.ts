import { inject, type InjectionKey } from "vue"
import type { Seed } from "./palette"

/** Live series surface for markers — `seed`/`dimmed` are getters so `<Dot>` /
 * `<ActiveDot>` read the current selection state reactively. */
export type SeriesContextValue = {
  dataKey: string
  seed: Seed
  dimmed: boolean
}

export const SeriesKey: InjectionKey<SeriesContextValue> = Symbol("dither-series")

/** Boundary guard for series-scoped markers (`<Dot>`, `<ActiveDot>`). */
export function useSeries(part: string): SeriesContextValue {
  const ctx = inject(SeriesKey, null)
  if (!ctx) {
    throw new Error(
      `<${part} /> must be rendered inside a series (e.g. <Area />).`
    )
  }
  return ctx
}
