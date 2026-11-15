import { DitherPoster } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherPoster inks={["blue", "orange", "grey"]} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherPoster,
  title: "Poster",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      inks: { kind: "list" },
      screen: { demo: "bayer" },
      seed: { min: 0, max: 99999, step: 1 },
      speed: { min: 0, max: 12, step: 0.5 },
      cell: { min: 1, max: 10, step: 1 },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
