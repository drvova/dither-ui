import { DitherEvilEye } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherEvilEye />
    </div>
  )
}

export const meta = defineExample({
  component: DitherEvilEye,
  title: "Evil eye",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#0A0A0A", "#FF3D2E", "#FFD23D"] },
      size: { min: 0.2, max: 1, step: 0.05 },
      speed: { min: 0, max: 3, step: 0.1 },
      pupilSize: { min: 0.1, max: 0.9, step: 0.05 },
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
