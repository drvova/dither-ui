import { createSignal } from "solid-js"
import { DitherIsland } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [expanded, setExpanded] = createSignal(false)

  return (
    <DitherIsland modelValue={expanded()} onUpdateModelValue={setExpanded} label="Deploy running" color="green" live>
      Build 214, lint ok, bundle 84kB, 3 of 5 steps done. {/* unfolds beneath the pill */}
    </DitherIsland>
  )
}

export const meta = defineExample({
  component: DitherIsland,
  title: "Island",
  studio: {
    group: "display",
    frame: { w: 280, h: 140 },
    controls: { label: {}, color: { demo: "blue" }, live: {} },
    slot: "Build 214: 3 of 5 steps done.",
  },
})
