import { DitherParticles } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherParticles />
    </div>
  )
}

export const meta = defineExample({
  component: DitherParticles,
  title: "Particles",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#3DA5FF", "#7CFF67", "#FFFFFF"] },
      count: { min: 4, max: 60, step: 1 },
      speed: { min: 0, max: 3, step: 0.1 },
      particleSize: { min: 0.1, max: 1, step: 0.05 },
      glow: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mouseInteraction: {},
      mouseStrength: { min: 0, max: 3, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
