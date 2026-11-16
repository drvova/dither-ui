import { createSignal } from "solid-js"
import { DitherTagInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [tags, setTags] = createSignal(["solid", "dither"])

  return <DitherTagInput modelValue={tags()} onUpdateModelValue={setTags} max={8} placeholder="Add tag…" />
}

export const meta = defineExample({
  component: DitherTagInput,
  title: "Tag input",
  studio: {
    group: "inputs",
    frame: { w: 320, h: 100 },
    controls: { placeholder: {}, max: { min: 1, max: 20 }, disabled: {} },
  },
})
