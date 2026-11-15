import { DitherEllipsisTooltip } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherEllipsisTooltip>Text that only tooltips while clipped</DitherEllipsisTooltip>
}

export const meta = defineExample({
  component: DitherEllipsisTooltip,
  title: "Ellipsis tooltip",
  studio: {
    group: "overlays",
    frame: { w: 260, h: 90 },
    controls: { enabled: {}, as: { kind: "select", options: ["span", "div"] } },
  },
})
