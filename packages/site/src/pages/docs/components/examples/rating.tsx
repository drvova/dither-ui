import { createSignal } from "solid-js"
import { DitherRating } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [rating, setRating] = createSignal(3)

  return <DitherRating modelValue={rating()} onUpdateModelValue={setRating} />
}

export const meta = defineExample({
  component: DitherRating,
  title: "Rating",
  studio: {
    group: "inputs",
    frame: { w: 240, h: 90 },
    controls: { color: {}, max: { min: 1, max: 10 }, size: { min: 12, max: 48 }, readonly: {}, label: {} },
  },
})
