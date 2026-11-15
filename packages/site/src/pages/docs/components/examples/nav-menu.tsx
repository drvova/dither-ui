import { createSignal } from "solid-js"
import { DitherNavMenu } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

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

export const meta = defineExample({
  component: DitherNavMenu,
  title: "Navigation menu",
  studio: {
    group: "navigation",
    frame: { w: 360, h: 90 },
    controls: { color: {}, items: { kind: "list", demo: ["Overview", "Components", "Examples"] } },
  },
})
