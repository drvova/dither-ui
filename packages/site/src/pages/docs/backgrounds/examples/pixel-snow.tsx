import { DitherPixelSnow } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
      <DitherPixelSnow />
    </div>
  )
}

export const meta = defineExample({
  component: DitherPixelSnow,
  title: "Pixel snow",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#CFF6FF", "#7CE0FF"] },
      density: { min: 6, max: 100, step: 1 },
      speed: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
