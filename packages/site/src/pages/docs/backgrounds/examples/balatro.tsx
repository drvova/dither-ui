import { DitherBalatro } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60">
      <DitherBalatro />
    </div>
  )
}

export const meta = defineExample({
  component: DitherBalatro,
  title: "Balatro",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#5227FF", "#FF3D2E", "#FFD23D", "#27FF64"] },
      scale: { min: 0.4, max: 6, step: 0.1 },
      speed: { min: 0, max: 3, step: 0.1 },
      spin: { min: 0, max: 10, step: 0.1 },
      contrast: { min: 0.2, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
