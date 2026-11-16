import { createSignal } from "solid-js"
import { DitherExpandTabs } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [tab, setTab] = createSignal("home")

  // only the active tab unfolds its label
  return (
    <DitherExpandTabs
      modelValue={tab()}
      onUpdateModelValue={setTab}
      tabs={[
        { value: "home", label: "Home" },
        { value: "library", label: "Library", color: "purple" },
        { value: "alerts", label: "Alerts", color: "red" },
      ]}
    />
  )
}

export const meta = defineExample({
  component: DitherExpandTabs,
  title: "Expand tabs",
  studio: {
    group: "display",
    frame: { w: 320, h: 90 },
    controls: { tabs: { kind: "list", demo: ["Home", "Library", "Alerts"] }, color: {} },
  },
})
