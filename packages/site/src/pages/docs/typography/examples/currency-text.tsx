import { DitherCurrencyText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherCurrencyText value={1299.5} />
}

export const meta = defineExample({
  component: DitherCurrencyText,
  title: "Currency",
  studio: {
    group: "display",
    frame: { w: 240, h: 80 },
    controls: { value: {}, currency: {}, locale: {}, decimals: { min: 0, max: 4 } },
  },
  states: [{ currency: "EUR", locale: "de-DE" }],
})
