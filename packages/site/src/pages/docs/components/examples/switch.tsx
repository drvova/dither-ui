import { createSignal } from "solid-js"
import { DitherSwitch } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [bloom, setBloom] = createSignal(true)

  return (
    <label class="flex items-center justify-between gap-4">
      <span class="text-[13px]">Bloom on hover</span>
      <DitherSwitch modelValue={bloom()} onUpdateModelValue={setBloom} label="Bloom on hover" color="blue" />
    </label>
  )
}

export const meta = defineExample({
  component: DitherSwitch,
  title: "Switch",
  studio: {
    group: "inputs",
    frame: { w: 160, h: 80 },
    controls: { color: {}, label: { demo: "Notifications" }, disabled: {} },
  },
})
