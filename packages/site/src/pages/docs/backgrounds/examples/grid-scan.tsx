import { DitherGridScan } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
      <DitherGridScan />
    </div>
  )
}

export const meta = defineExample({
  component: DitherGridScan,
  title: "Grid scan",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#27FF64", "#7CFF67"] },
      count: { min: 2, max: 60, step: 1 },
      speed: { min: 0, max: 3, step: 0.1 },
      lineWidth: { min: 0.01, max: 0.4, step: 0.01 },
      scanWidth: { min: 0.02, max: 0.5, step: 0.02 },
      glow: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
