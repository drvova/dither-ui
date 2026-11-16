import { DitherScrollReveal } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherScrollReveal text="These words reveal as you scroll them into view" />
}

export const meta = defineExample({
  component: DitherScrollReveal,
  title: "Scroll reveal",
  studio: {
    group: "display",
    frame: { w: 360, h: 120 },
    controls: { text: { demo: "Words reveal as you scroll into view" } },
  },
})
