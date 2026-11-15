import { DitherMeter } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherMeter value={65} />
}

export const meta = defineExample({
  component: DitherMeter,
  title: "Meter",
  studio: { group: "display", frame: { w: 300, h: 80 }, controls: { value: { min: 0, max: 100 }, min: {}, max: {} } },
})
