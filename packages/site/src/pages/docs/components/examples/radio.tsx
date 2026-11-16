import { createSignal } from "solid-js"
import { DitherRadioGroup } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [bloomLevel, setBloomLevel] = createSignal("low")
  const BLOOMS = [
    { value: "off", label: "Off" },
    { value: "low", label: "Low" },
    { value: "high", label: "High" },
    { value: "aura", label: "Aura" },
  ]

  return (
    <div class="mx-auto max-w-sm">
      <DitherRadioGroup
        modelValue={bloomLevel()}
        onUpdateModelValue={setBloomLevel}
        options={BLOOMS}
        label="Bloom level"
      />
      <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">bloom: "{bloomLevel()}"</p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherRadioGroup,
  title: "Radio group",
  studio: {
    group: "inputs",
    frame: { w: 260, h: 160 },
    controls: { color: {}, label: { demo: "Choose one" }, options: { kind: "list", demo: ["One", "Two", "Three"] } },
    model: { demo: "one" },
  },
})
