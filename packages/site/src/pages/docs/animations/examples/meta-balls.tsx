import { DitherMetaBalls } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="h-64 w-full overflow-hidden rounded-lg border border-border/60">
      <DitherMetaBalls />
    </div>
  )
}

export const meta = defineExample({
  component: DitherMetaBalls,
  title: "Meta balls",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#5227FF", "#7CFF67", "#3DA5FF"] },
      count: { min: 1, max: 16, step: 1 },
      speed: { min: 0, max: 4, step: 0.1 },
      ballSize: { min: 0.3, max: 3, step: 0.1 },
      glow: { min: 0.2, max: 4, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.05 },
      mouseInteraction: {},
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
