import { DitherPrismaticBurst } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherPrismaticBurst />
    </div>
  )
}

export const meta = defineExample({
  component: DitherPrismaticBurst,
  title: "Prismatic burst",
  studio: {
    group: "display",
    frame: { w: 260, h: 260 },
    controls: {
      rays: { min: 1, max: 30, step: 1 },
      speed: { min: 0, max: 3, step: 0.1 },
      spread: { min: 0.2, max: 6, step: 0.1 },
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
