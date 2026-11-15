import { DitherTooltip, DitherBadge } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherTooltip text="Deploys are frozen until Monday">
      <DitherBadge color="orange">frozen</DitherBadge>
    </DitherTooltip>
  )
}

export const meta = defineExample({
  component: DitherTooltip,
  title: "Tooltip",
  studio: {
    group: "overlays",
    frame: { w: 220, h: 100 },
    controls: { text: { demo: "Helpful detail" }, delay: { min: 0, max: 1000, demo: 0 } },
    slot: "Hover or focus",
  },
})
