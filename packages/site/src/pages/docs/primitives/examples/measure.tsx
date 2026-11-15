import { createSignal } from "solid-js"
import { DitherMeasure } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [size, setSize] = createSignal({ width: 0, height: 0 })

  return (
    <DitherMeasure class="w-48 rounded-md bg-muted p-4 text-[12px]" onResize={setSize}>
      {size().width} by {size().height}
    </DitherMeasure>
  )
}

export const meta = defineExample({
  component: DitherMeasure,
  title: "Measure",
  studio: { group: "structure", frame: { w: 240, h: 100 }, controls: {}, slot: "Measured content" },
})
