import { createSignal } from "solid-js"
import { DitherCurrencyInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [amount, setAmount] = createSignal("1234567.5")

  return <DitherCurrencyInput modelValue={amount()} onUpdateModelValue={setAmount} prefix="$" />
}

export const meta = defineExample({
  component: DitherCurrencyInput,
  title: "Currency input",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 90 },
    controls: { prefix: {}, locale: {}, placeholder: {}, invalid: { demo: false }, disabled: { demo: false } },
    field: true,
  },
  states: [{ prefix: "€", locale: "de-DE" }],
})
