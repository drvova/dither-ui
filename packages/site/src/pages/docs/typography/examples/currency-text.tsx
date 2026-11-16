import { DitherCurrencyText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="grid justify-center gap-1 text-[13px]">
      <DitherCurrencyText value={1299.5} />
      <DitherCurrencyText class="text-muted-foreground" value={1299.5} currency="EUR" locale="de-DE" />
      <DitherCurrencyText class="text-muted-foreground" value={49} currency="JPY" decimals={0} />
    </div>
  )
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
