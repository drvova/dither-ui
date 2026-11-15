import { DitherNoise } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherNoise class="h-64" />
}

export const meta = defineExample({
  component: DitherNoise,
  title: "Noise",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#3DA5FF", "#7CE0FF", "#FFFFFF"] },
      speed: { min: 0, max: 4, step: 0.1 },
      density: { min: 0, max: 1, step: 0.05 },
      opacity: { min: 0, max: 1, step: 0.05 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
