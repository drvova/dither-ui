import { createSignal } from "solid-js"
import { DitherInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [name, setName] = createSignal("")
  const [email, setEmail] = createSignal("not-an-email")

  return (
    <div class="mx-auto grid max-w-md gap-3 sm:grid-cols-2">
      <DitherInput modelValue={name()} onUpdateModelValue={setName} placeholder="Ada Byte" />
      <DitherInput
        modelValue={email()}
        onUpdateModelValue={setEmail}
        type="email"
        invalid
        placeholder="you@dither-ui.com"
      />
    </div>
  )
}

export const meta = defineExample({
  component: DitherInput,
  title: "Input",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 90 },
    controls: { placeholder: {}, invalid: {}, disabled: {} },
    field: true,
  },
})
