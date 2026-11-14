// Every layer kind's panel: a kind without one is a type error.
import FramePanel from "./FramePanel"
import GridPanel from "./GridPanel"
import LegendPanel from "./LegendPanel"
import PiePanel from "./PiePanel"
import SeriesPanel from "./SeriesPanel"
import TooltipPanel from "./TooltipPanel"
import type { LayerPanels } from "./types"
import XAxisPanel from "./XAxisPanel"
import YAxisPanel from "./YAxisPanel"

export const LAYER_PANELS: LayerPanels = {
  root: FramePanel,
  series: SeriesPanel,
  pie: PiePanel,
  grid: GridPanel,
  xAxis: XAxisPanel,
  yAxis: YAxisPanel,
  legend: LegendPanel,
  tooltip: TooltipPanel,
}
export { WIDGET_PANELS } from "./WidgetPanel"
