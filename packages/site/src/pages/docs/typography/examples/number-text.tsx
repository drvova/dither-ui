import { DitherNumberText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherNumberText value={1234567.5} decimals={2} />
}

export const meta = defineExample({
  component: DitherNumberText,
  title: "Number",
  studio: {
    group: "display",
    frame: { w: 240, h: 80 },
    controls: { value: {}, decimals: { min: 0, max: 4 }, locale: {}, grouping: {} },
  },
  states: [{ locale: "de-DE" }],
})
