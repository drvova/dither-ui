import { DitherFlowField } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherFlowField />
    </div>
  )
}

export const meta = defineExample({
  component: DitherFlowField,
  title: "Flow field",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#f4f8ff", "#c9dbff", "#7ba3ee"] },
      count: { min: 200, max: 8000, step: 100 },
      speed: { min: 0.05, max: 2, step: 0.05 },
      scale: { min: 0.3, max: 6, step: 0.1 },
      fade: { min: 0.5, max: 0.99, step: 0.01 },
      glow: { min: 0.2, max: 4, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.05 },
      mask: {},
      frameRate: { min: 0, max: 60, step: 1 },
      paused: {},
    },
  },
})
