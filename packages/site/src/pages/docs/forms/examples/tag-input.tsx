import { createSignal } from "solid-js"
import { DitherTagInput } from "@dither-kit"

export default function Example() {
  const [tags, setTags] = createSignal(["solid", "dither"])

  return <DitherTagInput modelValue={tags()} onUpdateModelValue={setTags} max={8} placeholder="Add tag…" />
}
