import { DitherOrb } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative mx-auto aspect-square h-64 overflow-hidden rounded-md border border-border/60 bg-black">
      <DitherOrb />
    </div>
  )
}

export const meta = defineExample({
  component: DitherOrb,
  title: "Orb",
  studio: {
    group: "display",
    frame: { w: 260, h: 260 },
    controls: {
      colors: { demo: ["#5227FF", "#7CFF67", "#CFFFDF"] },
      size: { min: 0.1, max: 0.9, step: 0.05 },
      speed: { min: 0, max: 3, step: 0.1 },
      noiseAmount: { min: 0, max: 3, step: 0.1 },
      glow: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
