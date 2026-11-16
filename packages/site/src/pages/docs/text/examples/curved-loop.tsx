import { DitherCurvedLoop } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherCurvedLoop text="DITHER UI · CANVAS + BAYER · " />
}

export const meta = defineExample({
  component: DitherCurvedLoop,
  title: "Curved loop",
  studio: {
    group: "display",
    frame: { w: 420, h: 120 },
    controls: { text: {}, speed: { min: 0, max: 300, step: 10 } },
  },
})
