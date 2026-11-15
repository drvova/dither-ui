import { createSignal } from "solid-js"
import { DitherAccordion } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [faq, setFaq] = createSignal<string | string[]>("what")
  const items = [
    { value: "what", title: "What is dithering?" },
    { value: "why", title: "Why canvas?" },
    { value: "copy", title: "Can I copy the kit out?" },
  ]

  return (
    <div class="mx-auto max-w-sm">
      <DitherAccordion
        modelValue={faq()}
        onUpdateModelValue={setFaq}
        items={items}
        type="single"
        color="blue"
        slots={{
          what: (
            <>
              Ordered dithering trades smooth gradients for a fixed threshold matrix: the same Bayer 4x4 behind every
              fill in this kit.
            </>
          ),
          why: <>One engine paints every fill, so components stay coherent.</>,
          copy: <>Yes, the kit folder has zero app imports; copy it and alias it.</>,
        }}
      />
    </div>
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
