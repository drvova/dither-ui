import { createSignal } from "solid-js"
import { DitherCurrencyInput } from "@dither-kit"

export default function Example() {
  const [amount, setAmount] = createSignal("1234567.5")

  return <DitherCurrencyInput modelValue={amount()} onUpdateModelValue={setAmount} prefix="$" />
}
