import { DitherStrands } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherStrands class="h-64" />
}

export const meta = defineExample({
  component: DitherStrands,
  title: "Strands",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#5227FF", "#7CE0FF"] },
      count: { min: 4, max: 120, step: 2 },
      speed: { min: 0, max: 3, step: 0.1 },
      sway: { min: 0, max: 0.5, step: 0.01 },
      lineWidth: { min: 0.002, max: 0.05, step: 0.002 },
      glow: { min: 0.2, max: 4, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.05 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
