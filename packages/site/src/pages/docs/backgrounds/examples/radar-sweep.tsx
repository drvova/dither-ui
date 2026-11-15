import { DitherRadar } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherRadar />
    </div>
  )
}

export const meta = defineExample({
  component: DitherRadar,
  title: "Radar",
  studio: {
    group: "display",
    frame: { w: 260, h: 260 },
    controls: {
      colors: { demo: ["#27FF64", "#7CFF67"] },
      rings: { min: 1, max: 12, step: 1 },
      speed: { min: 0, max: 4, step: 0.1 },
      sweepWidth: { min: 0.1, max: 3, step: 0.1 },
      glow: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
