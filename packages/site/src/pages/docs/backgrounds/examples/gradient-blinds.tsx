import { DitherGradientBlinds } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherGradientBlinds colors={["#5227FF", "#FF3D2E", "#FFD23D"]} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherGradientBlinds,
  title: "Gradient blinds",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: {},
      count: { min: 1, max: 40, step: 1 },
      angle: { min: 0, max: 3.14, step: 0.05 },
      speed: { min: 0, max: 3, step: 0.1 },
      gap: { min: 0, max: 0.8, step: 0.05 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
