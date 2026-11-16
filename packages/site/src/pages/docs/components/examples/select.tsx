import { createSignal } from "solid-js"
import { DitherSelect } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [chart, setChart] = createSignal("area")
  const CHARTS = [
    { value: "area", label: "Area" },
    { value: "line", label: "Line" },
    { value: "bar", label: "Bar" },
    { value: "pie", label: "Pie" },
    { value: "radar", label: "Radar" },
  ]

  return (
    <div class="mx-auto max-w-sm">
      <DitherSelect modelValue={chart()} onUpdateModelValue={setChart} options={CHARTS} placeholder="Chart type…" />
      <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">chart: "{chart()}"</p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherSelect,
  title: "Select",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 220 },
    model: { demo: "" },
    controls: {
      color: {},
      options: { kind: "list", demo: ["One", "Two", "Three"] },
      placeholder: { demo: "Select…" },
      invalid: {},
      disabled: {},
    },
    field: true,
  },
})
