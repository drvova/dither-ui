import { DitherSoftAurora } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherSoftAurora colors={["#5227FF", "#7CFF67", "#A8FFB6"]} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherSoftAurora,
  title: "Soft aurora",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: {},
      bands: { min: 1, max: 6, step: 1 },
      amplitude: { min: 0, max: 3, step: 0.1 },
      blend: { min: 0, max: 1, step: 0.05 },
      speed: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
