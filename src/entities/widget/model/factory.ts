import type { AvatarModel, ButtonModel, GradientModel, WidgetKind, WidgetModel } from "./types"

export function createWidget(kind: WidgetKind): WidgetModel {
  switch (kind) {
    case "avatar":
      return {
        kind: "avatar",
        name: "Ada Lovelace",
        autoColor: true,
        color: "#358ff3",
        mirror: "auto",
        grid: 8,
        cellPx: 4,
        density: 0,
        offTier: 0.35,
        bloom: "off",
        animate: true,
        animationDuration: 600,
      } satisfies AvatarModel
    case "button":
      return {
        kind: "button",
        label: "Click me",
        color: "blue",
        variant: "gradient",
        cell: 2,
        bloom: "off",
      } satisfies ButtonModel
    case "gradient":
      return {
        kind: "gradient",
        from: "blue",
        twoTone: false,
        to: "pink",
        direction: "up",
        cell: 3,
        opacity: 1,
        bloom: "off",
      } satisfies GradientModel
  }
}
