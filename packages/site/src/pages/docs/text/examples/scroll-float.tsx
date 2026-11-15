import { DitherScrollFloat } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherScrollFloat text="Floating up on scroll" />
}

export const meta = defineExample({
  component: DitherScrollFloat,
  title: "Scroll float",
  studio: {
    group: "display",
    frame: { w: 320, h: 100 },
    controls: { text: { demo: "Scroll float" }, amount: { min: 0, max: 3, step: 0.1 } },
  },
})
