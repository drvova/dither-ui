import { DitherGalaxy } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherGalaxy />
    </div>
  )
}

export const meta = defineExample({
  component: DitherGalaxy,
  title: "Galaxy",
  studio: {
    group: "display",
    frame: { w: 260, h: 260 },
    controls: {
      colors: { demo: ["#3DA5FF", "#A8FFB6", "#FFFFFF"] },
      arms: { min: 1, max: 8, step: 1 },
      twist: { min: 0, max: 30, step: 0.5 },
      speed: { min: 0, max: 3, step: 0.1 },
      density: { min: 0, max: 1, step: 0.05 },
      glow: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
