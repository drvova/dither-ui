import { createSignal } from "solid-js"
import { DitherMultiSelect } from "@dither-kit"

export default function Example() {
  const ALL_TAGS = ["solid", "dither", "canvas", "tokens", "ssr"]
  const [tags, setTags] = createSignal(["solid", "dither"])

  return <DitherMultiSelect value={tags()} onUpdateModelValue={(next) => setTags(next)} options={ALL_TAGS} />
}
