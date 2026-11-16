import { DitherFuzzyText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherFuzzyText text="FUZZY" />
}

export const meta = defineExample({
  component: DitherFuzzyText,
  title: "Fuzzy text",
  studio: {
    group: "display",
    frame: { w: 240, h: 100 },
    controls: { text: {}, intensity: { min: 0, max: 20, step: 0.5 } },
  },
})
