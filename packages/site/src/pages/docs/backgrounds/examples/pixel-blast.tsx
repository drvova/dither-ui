import { DitherPixelBlast } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherPixelBlast />
    </div>
  )
}

export const meta = defineExample({
  component: DitherPixelBlast,
  title: "Pixel blast",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#5227FF", "#FF3D2E", "#FFD23D"] },
      waves: { min: 1, max: 8, step: 1 },
      speed: { min: 0, max: 3, step: 0.1 },
      pixels: { min: 8, max: 120, step: 1 },
      glow: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
