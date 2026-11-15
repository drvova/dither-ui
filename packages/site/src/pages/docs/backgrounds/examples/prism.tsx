import { DitherPrism } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
      <DitherPrism />
    </div>
  )
}

export const meta = defineExample({
  component: DitherPrism,
  title: "Prism",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      spread: { min: 0.1, max: 1.5, step: 0.05 },
      speed: { min: 0, max: 3, step: 0.1 },
      saturation: { min: 0, max: 1, step: 0.05 },
      brightness: { min: 0, max: 1, step: 0.05 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
