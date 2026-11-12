// Solid's binding of a series' surface for its markers
// (`engine/series-context.ts` holds the type).

import { createContext, useContext } from "solid-js"
import type { SeriesContextValue } from "../../engine/series-context"

export type { SeriesContextValue } from "../../engine/series-context"

/** Live series surface for markers: `seed`/`dimmed` are getters so `<Dot>` /
 * `<ActiveDot>` read the current selection state reactively. */
export const SeriesContext = createContext<SeriesContextValue>()

/** Boundary guard for series-scoped markers (`<Dot>`, `<ActiveDot>`). */
export function useSeries(part: string): SeriesContextValue {
  const ctx = useContext(SeriesContext)
  if (!ctx) {
    throw new Error(`<${part} /> must be rendered inside a series (e.g. <Area />).`)
  }
  return ctx
}
