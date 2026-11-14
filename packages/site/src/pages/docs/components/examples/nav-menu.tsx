import { createSignal } from "solid-js"
import { DitherNavMenu } from "@dither-kit"

export default function Example() {
  const [active, setActive] = createSignal("Overview")
  const items = [{ label: "Overview" }, { label: "Components" }, { label: "Pricing" }, { label: "Docs" }]

  return (
    <>
      <DitherNavMenu modelValue={active()} onUpdateModelValue={setActive} items={items} color="blue" />
      <p class="mt-4 text-[12px] text-muted-foreground">Viewing: {active()}</p>
    </>
  )
}
