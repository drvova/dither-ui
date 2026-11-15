import { DitherFloatingLines } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherFloatingLines colors={["#3DA5FF", "#7CE0FF"]} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherFloatingLines,
  title: "Floating lines",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: {},
      count: { min: 1, max: 40, step: 1 },
      amplitude: { min: 0, max: 3, step: 0.1 },
      speed: { min: 0, max: 3, step: 0.1 },
      lineWidth: { min: 0.004, max: 0.1, step: 0.002 },
      glow: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
