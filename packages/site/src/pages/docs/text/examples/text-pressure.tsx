import { DitherTextPressure } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherTextPressure text="Pressure" />
}

export const meta = defineExample({
  component: DitherTextPressure,
  title: "Text pressure",
  studio: {
    group: "display",
    frame: { w: 300, h: 100 },
    controls: { text: {}, radius: { min: 20, max: 400, step: 10 }, strength: { min: 0, max: 3, step: 0.1 } },
  },
})
