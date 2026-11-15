import { DitherScrollVelocity } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherScrollVelocity text="DITHER · UI · TOOLKIT · " />
}

export const meta = defineExample({
  component: DitherScrollVelocity,
  title: "Scroll velocity",
  studio: {
    group: "display",
    frame: { w: 380, h: 80 },
    controls: { text: {}, baseSpeed: { min: 0, max: 400, step: 10 } },
  },
})
