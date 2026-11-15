import { DitherCircularText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherCircularText text="DITHER · UI · TOOLKIT · " />
}

export const meta = defineExample({
  component: DitherCircularText,
  title: "Circular text",
  studio: {
    group: "display",
    frame: { w: 190, h: 190 },
    controls: { text: {}, duration: { min: 2, max: 60, step: 1 }, size: { min: 80, max: 400, step: 10 } },
  },
})
