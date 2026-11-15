import { DitherFerrofluid } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherFerrofluid colors={["#27FF64", "#7CFF67", "#A8FFB6"]} flowDirection="down" />
    </div>
  )
}

export const meta = defineExample({
  component: DitherFerrofluid,
  title: "Ferrofluid",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: {},
      speed: { min: 0, max: 3, step: 0.1 },
      scale: { min: 0.4, max: 4, step: 0.1 },
      turbulence: { min: 0, max: 3, step: 0.1 },
      fluidity: { min: 0, max: 1, step: 0.05 },
      rimWidth: { min: 0.02, max: 0.6, step: 0.02 },
      sharpness: { min: 0.5, max: 6, step: 0.1 },
      shimmer: { min: 0, max: 3, step: 0.1 },
      glow: { min: 0, max: 4, step: 0.1 },
      flowDirection: { options: ["up", "down", "left", "right"] },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mouseInteraction: {},
      mouseStrength: { min: 0, max: 3, step: 0.1 },
      mouseRadius: { min: 0.05, max: 1, step: 0.05 },
      mouseDampening: { min: 0, max: 1, step: 0.05 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
