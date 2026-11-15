import { createSignal } from "solid-js"
import { DitherField, DitherInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [handle, setHandle] = createSignal("")
  const [website, setWebsite] = createSignal("")

  return (
    <div class="mx-auto grid max-w-sm gap-5">
      <DitherField label="Handle" description="Lowercase, no spaces.">
        <DitherInput modelValue={handle()} onUpdateModelValue={setHandle} placeholder="ada" />
      </DitherField>
      <DitherField label="Website" error="That URL does not resolve.">
        <DitherInput modelValue={website()} onUpdateModelValue={setWebsite} placeholder="https://" />
      </DitherField>
    </div>
  )
}

export const meta = defineExample({
  component: DitherField,
  title: "Field",
  studio: {
    group: "structure",
    frame: { w: 300, h: 150 },
    controls: { label: { demo: "Email" }, description: { demo: "We will never share it." }, error: { demo: "" } },
  },
})
