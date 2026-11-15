import { DitherElectricBorder } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherElectricBorder color="#5227FF">Electric border</DitherElectricBorder>
}

export const meta = defineExample({
  component: DitherElectricBorder,
  title: "Electric border",
  studio: {
    group: "display",
    frame: { w: 220, h: 90 },
    controls: {
      color: { kind: "color", demo: "blue" },
      speed: { min: 0.2, max: 4, step: 0.1 },
      thickness: { min: 1, max: 6, step: 1 },
    },
  },
})
