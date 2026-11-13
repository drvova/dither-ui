// Solid's binding of the chart family's shared surface (`engine/chart-types.ts`
// holds the types): the context `<Legend>` and `<Tooltip>` read, whichever
// root they sit in. The fields are live getters over the root's signals, so
// reading them in JSX or a memo tracks.

import { createContext, useContext } from "solid-js"
import type { CommonChart } from "../../engine/chart-types"

export type { CommonChart, TooltipItem } from "../../engine/chart-types"

export const CommonChartContext = createContext<CommonChart>()

export function useCommonChart(): CommonChart {
  const ctx = useContext(CommonChartContext)
  if (!ctx) {
    throw new Error("<Legend /> / <Tooltip /> must be used within a chart root.")
  }
  return ctx
}
