import { createSignal } from "solid-js"
import { DitherNumberField } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [qty, setQty] = createSignal(3)

  return (
    <div class="mx-auto flex max-w-sm items-center justify-center gap-4">
      <DitherNumberField modelValue={qty()} onUpdateModelValue={setQty} min={0} max={10} label="Quantity" />
      <span class="text-[13px] tabular-nums">{qty()} / 10</span>
    </div>
  )
}

export const meta = defineExample({
  component: DitherNumberField,
  title: "Number field",
  studio: {
    group: "inputs",
    frame: { w: 220, h: 90 },
    controls: { min: {}, max: {}, step: { min: 0.1, step: 0.1 }, disabled: {} },
  },
})
