import { createSignal } from "solid-js"
import { DitherTabs } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [tab, setTab] = createSignal("Overview")

  return <DitherTabs modelValue={tab()} onUpdateModelValue={setTab} tabs={["Overview", "Usage", "Settings"]} />
}

export const meta = defineExample({
  component: DitherTabs,
  title: "Tabs",
  studio: {
    group: "inputs",
    frame: { w: 340, h: 110 },
    controls: { color: {}, tabs: { kind: "list", demo: ["One", "Two", "Three"] }, variant: {}, orientation: {} },
    model: { demo: "One" },
  },
})
