import { DitherStepper } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherStepper
      current={1}
      steps={[{ label: "Cart" }, { label: "Shipping" }, { label: "Payment" }, { label: "Done" }]}
    />
  )
}

export const meta = defineExample({
  component: DitherStepper,
  title: "Stepper",
  studio: {
    group: "navigation",
    frame: { w: 480, h: 130 },
    controls: { steps: { kind: "list", demo: ["Account", "Profile", "Done"] }, current: { min: 0, max: 8 } },
  },
})
