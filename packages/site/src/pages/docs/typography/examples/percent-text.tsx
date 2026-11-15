import { DitherPercentText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherPercentText value={0.42} />
}

export const meta = defineExample({
  component: DitherPercentText,
  title: "Percent",
  studio: {
    group: "display",
    frame: { w: 200, h: 80 },
    controls: { value: { min: 0, max: 1, step: 0.01 }, decimals: { min: 0, max: 3 }, locale: {} },
  },
  states: [{ locale: "de-DE" }],
})
