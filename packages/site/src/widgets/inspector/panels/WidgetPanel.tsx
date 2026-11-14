// A widget frame's panel, picked by its widget's kind.
import type { Component } from "solid-js"
import { Dynamic } from "solid-js/web"
import type { Artboard } from "@/entities/artboard"
import type { WidgetModel } from "@/entities/widget"
import AvatarPanel from "./AvatarPanel"
import ButtonPanel from "./ButtonPanel"
import ComponentPanel from "./ComponentPanel"
import GradientPanel from "./GradientPanel"
import ImagePanel from "./ImagePanel"
import ReelPanel from "./ReelPanel"
import ScreenPanel from "./ScreenPanel"
import type { WidgetPanelProps, WidgetPanels } from "./types"

export const WIDGET_PANELS: WidgetPanels = {
  avatar: AvatarPanel,
  button: ButtonPanel,
  component: ComponentPanel,
  screen: ScreenPanel,
  image: ImagePanel,
  gradient: GradientPanel,
  reel: ReelPanel,
}

export default function WidgetPanel(props: { artboard: Artboard; widget: WidgetModel }) {
  // The table pairs each kind with its own panel; the widget is of that kind.
  return (
    <Dynamic
      component={WIDGET_PANELS[props.widget.kind] as Component<WidgetPanelProps>}
      artboard={props.artboard}
      widget={props.widget}
    />
  )
}
