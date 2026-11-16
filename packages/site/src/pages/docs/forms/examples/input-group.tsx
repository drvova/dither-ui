import { createSignal } from "solid-js"
import { DitherInputGroup, DitherInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [host, setHost] = createSignal("dither-ui.com")

  return (
    <DitherInputGroup prefix="https://" suffix="/docs">
      <DitherInput
        modelValue={host()}
        onUpdateModelValue={setHost}
        aria-label="Site address"
        class="min-h-8 border-0 bg-transparent px-0 py-1 shadow-none hover:border-0 focus-visible:ring-0"
      />
    </DitherInputGroup>
  )
}

export const meta = defineExample({
  component: DitherInputGroup,
  title: "Input group",
  studio: { group: "inputs", frame: { w: 320, h: 90 }, controls: {}, slot: "value" },
})
