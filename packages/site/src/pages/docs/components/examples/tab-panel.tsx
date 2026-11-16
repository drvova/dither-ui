import { createSignal } from "solid-js"
import { DitherTabPanel, DitherTabs } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [tab, setTab] = createSignal("One")

  return (
    <DitherTabs modelValue={tab()} onUpdateModelValue={setTab} tabs={["One", "Two"]}>
      <DitherTabPanel value="One">Panel content</DitherTabPanel>
      <DitherTabPanel value="Two">The second panel</DitherTabPanel>
    </DitherTabs>
  )
}

export const meta = defineExample({
  component: DitherTabPanel,
  title: "Tab panel",
  studio: { group: "structure", frame: { w: 340, h: 160 }, controls: { value: {} } },
})
