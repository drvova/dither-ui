import { createSignal } from "solid-js"
import { DitherMultiSelect } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const ALL_TAGS = ["solid", "dither", "canvas", "tokens", "ssr"]
  const [tags, setTags] = createSignal(["solid", "dither"])

  return <DitherMultiSelect value={tags()} onUpdateModelValue={(next) => setTags(next)} options={ALL_TAGS} />
}

export const meta = defineExample({
  component: DitherMultiSelect,
  title: "Multi select",
  studio: {
    group: "inputs",
    frame: { w: 300, h: 220 },
    controls: { options: { demo: ["solid", "dither", "canvas", "tokens"] }, placeholder: {}, disabled: {} },
    model: { demo: ["solid"], prop: "value" },
  },
})
