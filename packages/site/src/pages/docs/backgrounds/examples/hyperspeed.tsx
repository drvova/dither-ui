import { DitherHyperspeed } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherHyperspeed />
    </div>
  )
}

export const meta = defineExample({
  component: DitherHyperspeed,
  title: "Hyperspeed",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#3DA5FF", "#7CE0FF", "#FFFFFF"] },
      count: { min: 4, max: 80, step: 1 },
      speed: { min: 0, max: 3, step: 0.1 },
      streakLength: { min: 0.05, max: 1.2, step: 0.05 },
      glow: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
