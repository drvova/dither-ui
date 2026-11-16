import { createSignal } from "solid-js"
import { DitherCheckboxGroup } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [parts, setParts] = createSignal(["grid", "axes"])
  const PARTS = [
    { value: "grid", label: "Grid" },
    { value: "axes", label: "Axes" },
    { value: "legend", label: "Legend" },
    { value: "tooltip", label: "Tooltip" },
  ]

  return (
    <div class="mx-auto max-w-sm">
      <DitherCheckboxGroup modelValue={parts()} onUpdateModelValue={setParts} options={PARTS} label="Chart parts" />
      <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">parts: [{parts().join(", ")}]</p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherCheckboxGroup,
  title: "Checkbox group",
  studio: {
    group: "inputs",
    frame: { w: 260, h: 170 },
    controls: { color: {}, label: { demo: "Choose any" }, options: { kind: "list", demo: ["One", "Two", "Three"] } },
    model: { demo: ["one"] },
  },
})
