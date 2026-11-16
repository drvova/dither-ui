import { DitherOrbitImages } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherOrbitImages items={["A", "B", "C", "D", "E"]} />
}

export const meta = defineExample({
  component: DitherOrbitImages,
  title: "Orbit images",
  studio: {
    group: "display",
    frame: { w: 220, h: 220 },
    controls: {
      items: {},
      radius: { min: 20, max: 200, step: 5 },
      duration: { min: 2, max: 60, step: 1 },
      size: { min: 80, max: 400, step: 10 },
    },
  },
})
