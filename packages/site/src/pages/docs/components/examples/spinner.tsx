import { DitherSpinner } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherSpinner size={24} />
}

export const meta = defineExample({
  component: DitherSpinner,
  title: "Spinner",
  studio: { group: "display", frame: { w: 120, h: 90 }, controls: { color: {}, size: { min: 8, max: 96 } } },
})
