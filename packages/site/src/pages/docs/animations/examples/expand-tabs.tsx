import { createSignal } from "solid-js"
import { DitherExpandTabs } from "@dither-kit"

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
