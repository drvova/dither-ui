import { DitherShapeBlur } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherShapeBlur class="h-64" />
}

export const meta = defineExample({
  component: DitherShapeBlur,
  title: "Shape blur",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#5227FF", "#7CFF67"] },
      size: { min: 0.1, max: 1, step: 0.05 },
      speed: { min: 0, max: 3, step: 0.1 },
      softness: { min: 0.05, max: 1, step: 0.05 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.05, demo: 0.6 },
      mouseInteraction: {},
      mouseStrength: { min: 0, max: 1, step: 0.05 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
