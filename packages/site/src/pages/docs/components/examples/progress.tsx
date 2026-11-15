import { DitherProgress } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherProgress value={60} />
}

export const meta = defineExample({
  component: DitherProgress,
  title: "Progress",
  studio: {
    group: "display",
    frame: { w: 300, h: 80 },
    controls: { color: {}, value: { min: 0, max: 100 }, indeterminate: {} },
  },
})
