import { DitherStarBorder } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherStarBorder color="#7CFF67">Star border</DitherStarBorder>
}

export const meta = defineExample({
  component: DitherStarBorder,
  title: "Star border",
  studio: {
    group: "display",
    frame: { w: 220, h: 90 },
    controls: {
      color: { kind: "color", demo: "green" },
      speed: { min: 1, max: 20, step: 0.5 },
      thickness: { min: 1, max: 6, step: 1 },
    },
  },
})
