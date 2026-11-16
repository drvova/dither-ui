import { DitherLightRays } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
      <DitherLightRays />
    </div>
  )
}

export const meta = defineExample({
  component: DitherLightRays,
  title: "Light rays",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#FFD23D", "#FF8A3D"] },
      rayCount: { min: 2, max: 60, step: 1 },
      speed: { min: 0, max: 3, step: 0.1 },
      spread: { min: 0, max: 4, step: 0.1 },
      falloff: { min: 0, max: 2, step: 0.05 },
      glow: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
