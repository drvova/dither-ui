import { DitherDurationText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherDurationText ms={80400000} />
}

export const meta = defineExample({
  component: DitherDurationText,
  title: "Duration",
  studio: { group: "display", frame: { w: 240, h: 80 }, controls: { ms: { min: 0, max: 172800000 } } },
})
