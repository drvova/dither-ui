import { DitherRibbons } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="h-64 w-full overflow-hidden rounded-lg border border-border/60">
      <DitherRibbons />
    </div>
  )
}

export const meta = defineExample({
  component: DitherRibbons,
  title: "Ribbons",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#5227FF", "#7CFF67", "#3DA5FF"] },
      count: { min: 1, max: 16, step: 1 },
      speed: { min: 0, max: 3, step: 0.1 },
      thickness: { min: 0.02, max: 0.4, step: 0.01 },
      amplitude: { min: 0, max: 3, step: 0.1 },
      glow: { min: 0.2, max: 4, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.05 },
      mouseInteraction: {},
      mouseStrength: { min: 0, max: 3, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
