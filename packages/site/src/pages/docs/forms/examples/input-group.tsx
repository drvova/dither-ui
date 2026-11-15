import { createSignal } from "solid-js"
import { DitherInput, DitherInputGroup } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [host, setHost] = createSignal("dither-ui.com")

  return (
    <DitherInputGroup prefix="https://" suffix="/docs">
      <DitherInput
        modelValue={host()}
        onUpdateModelValue={setHost}
        aria-label="Site address"
        class="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
      />
    </DitherInputGroup>
  )
}

export const meta = defineExample({
  component: DitherInputGroup,
  title: "Input group",
  studio: { group: "inputs", frame: { w: 320, h: 90 }, controls: {}, slot: "value" },
})
