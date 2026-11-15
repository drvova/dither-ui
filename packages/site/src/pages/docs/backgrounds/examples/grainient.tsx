import { DitherGrainient } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherGrainient colors={["#5227FF", "#7CFF67"]} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherGrainient,
  title: "Grainient",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: {},
      angle: { min: 0, max: 6.28, step: 0.05 },
      grain: { min: 0, max: 1, step: 0.05 },
      speed: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
