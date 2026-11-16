import { DitherEllipsisTooltip } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="mx-auto w-56">
      <DitherEllipsisTooltip class="text-[12px] text-muted-foreground">
        Full sentence that only shows a tooltip when it actually clips in this narrow box.
      </DitherEllipsisTooltip>
    </div>
  )
}

export const meta = defineExample({
  component: DitherEllipsisTooltip,
  title: "Ellipsis tooltip",
  studio: {
    group: "overlays",
    frame: { w: 260, h: 90 },
    slot: "Text that only tooltips while clipped",
    controls: { enabled: {}, as: { kind: "select", options: ["span", "div"] } },
  },
})
