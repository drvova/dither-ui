import { createSignal } from "solid-js"
import { DitherAccordion } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

const ITEMS = [
  { value: "what", title: "What is dithering?" },
  { value: "why", title: "Why canvas?" },
  { value: "copy", title: "Can I copy the kit out?" },
]

export default function Example() {
  const [faq, setFaq] = createSignal<string | string[]>("what")

  return (
    <DitherAccordion
      modelValue={faq()}
      onUpdateModelValue={setFaq}
      items={ITEMS}
      slots={{
        what: "Ordered dithering trades smooth gradients for a fixed threshold matrix.",
        why: "One engine paints every fill, so components stay coherent.",
        copy: "Yes: the kit is plain source you paste into your app.",
      }}
    />
  )
}

export const meta = defineExample({
  component: DitherAccordion,
  title: "Accordion",
  studio: {
    group: "inputs",
    frame: { w: 340, h: 240 },
    controls: { color: {}, items: { kind: "list", demo: ["First", "Second", "Third"] }, type: {} },
    model: { demo: "first" },
  },
})
