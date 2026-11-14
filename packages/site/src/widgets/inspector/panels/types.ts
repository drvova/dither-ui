import type { Component } from "solid-js"
import type { Artboard } from "@/entities/artboard"
import type { ChartModel, Layer, LayerKind } from "@/entities/chart"
import type { WidgetKind, WidgetModel } from "@/entities/widget"

/** What a layer's panel edits: the selected frame, its chart and the layer
 * picked in it (none for the frame itself). */
export type LayerPanelProps = { artboard: Artboard; chart: ChartModel; layer?: Layer }

/** What a widget frame's panel edits: the frame and its widget of that kind. */
export type WidgetPanelProps<K extends WidgetKind = WidgetKind> = {
  artboard: Artboard
  widget: Extract<WidgetModel, { kind: K }>
}

/** A panel for every layer kind: a kind without one is a type error. */
export type LayerPanels = Record<LayerKind, Component<LayerPanelProps>>
/** A panel for every widget kind, each typed to its own widget. */
export type WidgetPanels = { [K in WidgetKind]: Component<WidgetPanelProps<K>> }
