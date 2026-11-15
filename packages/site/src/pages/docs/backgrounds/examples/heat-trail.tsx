import { DitherHeatTrail } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherHeatTrail />
    </div>
  )
}

export const meta = defineExample({
  component: DitherHeatTrail,
  title: "Heat trail",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      cool: { min: 0.2, max: 6, step: 0.1 },
      size: { min: 0, max: 8, step: 1 },
      cell: { min: 2, max: 12, step: 1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      paused: {},
    },
  },
})
