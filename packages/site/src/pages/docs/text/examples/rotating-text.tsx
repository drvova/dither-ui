import { DitherRotatingText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <p>
      Built for <DitherRotatingText texts={["Solid", "canvas", "the studio"]} />
    </p>
  )
}

export const meta = defineExample({
  component: DitherRotatingText,
  title: "Rotating text",
  studio: {
    group: "display",
    frame: { w: 320, h: 100 },
    controls: { texts: { demo: ["Solid", "canvas", "dither"] }, interval: { min: 400, max: 6000, step: 100 } },
  },
})
