import { type ComponentEntry, defaultComponentProps } from "./registry"
import type { AvatarModel, ButtonModel, ComponentModel, GradientModel, ImageModel, WidgetKind, WidgetModel } from "./types"

/** The fixed widget kinds with bespoke builders — registry components are
 * created from their ComponentEntry instead. */
export type SimpleWidgetKind = Exclude<WidgetKind, "component" | "screen">

/** A component widget seeded from its registry entry. */
export function createComponent(entry: ComponentEntry): ComponentModel {
  return {
    kind: "component",
    is: entry.is,
    props: defaultComponentProps(entry),
    slotText: entry.slotText ?? null,
    model: entry.vmodel ? entry.vmodel.def : undefined,
  }
}

export function createWidget(kind: SimpleWidgetKind): WidgetModel {
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
    case "image":
      return {
        kind: "image",
        // Inline SVG placeholder so a fresh frame renders offline; paste any URL.
        src:
          "data:image/svg+xml," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#358ff3"/><stop offset="1" stop-color="#f05abe"/></linearGradient></defs><rect width="320" height="240" fill="url(#g)"/></svg>'
          ),
        alt: "",
        cell: 3,
        focusY: 0.5,
        fade: 0,
      } satisfies ImageModel
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
