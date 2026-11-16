import { DitherSilk } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
      <DitherSilk />
    </div>
  )
}

export const meta = defineExample({
  component: DitherSilk,
  title: "Silk",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#5227FF", "#7CFF67", "#5227FF"] },
      scale: { min: 0.4, max: 6, step: 0.1 },
      speed: { min: 0, max: 3, step: 0.1 },
      noiseIntensity: { min: 0, max: 3, step: 0.1 },
      rotation: { min: 0, max: 3.14, step: 0.05 },
      sharpness: { min: 0.5, max: 4, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
