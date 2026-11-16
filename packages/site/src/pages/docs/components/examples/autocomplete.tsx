import { createSignal } from "solid-js"
import { DitherAutocomplete } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [term, setTerm] = createSignal("")
  const TERMS = [
    "dither",
    "dithering",
    "dither kit",
    "bayer",
    "bayer 4x4",
    "bayer matrix",
    "pixel",
    "pixel art",
    "pixelated",
  ]

  return (
    <div class="mx-auto max-w-sm">
      <DitherAutocomplete
        modelValue={term()}
        onUpdateModelValue={setTerm}
        suggestions={TERMS}
        placeholder="Search the docs…"
      />
      <p class="mt-4 text-center font-mono text-[11px] text-muted-foreground">term: "{term()}"</p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherAutocomplete,
  title: "Autocomplete",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 220 },
    controls: {
      suggestions: { demo: ["Area chart", "Avatar", "Button"] },
      placeholder: { demo: "Search…" },
      disabled: {},
    },
  },
})
