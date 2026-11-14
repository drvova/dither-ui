import { DitherStepper } from "@dither-kit"

export default function Example() {
  return (
    <DitherStepper
      current={1}
      steps={[{ label: "Cart" }, { label: "Shipping" }, { label: "Payment" }, { label: "Done" }]}
    />
  )
}
