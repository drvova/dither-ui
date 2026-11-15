import { createSignal } from "solid-js"
import { DitherIsland } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [open, setOpen] = createSignal(false)

  // unfolds beneath the pill
  return (
    <div class="grid min-h-28 place-items-center">
      <DitherIsland
        modelValue={open()}
        onUpdateModelValue={setOpen}
        label="Deploy running"
        color="green"
        live
        class="w-64"
      >
        Build 214, lint ok, bundle 84kB, 3 of 5 steps done.
      </DitherIsland>
    </div>
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
