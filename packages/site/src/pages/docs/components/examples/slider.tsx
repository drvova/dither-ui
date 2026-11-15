import { createSignal } from "solid-js"
import { DitherSlider } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [level, setLevel] = createSignal(40)

  return <DitherSlider modelValue={level()} onUpdateModelValue={setLevel} />
}

export const meta = defineExample({
  component: DitherSlider,
  title: "Slider",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 90 },
    controls: { color: {}, min: {}, max: {}, step: { min: 0.1, step: 0.1 }, disabled: {} },
  },
})
