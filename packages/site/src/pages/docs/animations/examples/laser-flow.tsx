import { DitherLaserFlow } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="h-64 w-full overflow-hidden rounded-lg border border-border/60">
      <DitherLaserFlow />
    </div>
  )
}

export const meta = defineExample({
  component: DitherLaserFlow,
  title: "Laser flow",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#FF3D2E", "#FFD23D", "#FFFFFF"] },
      count: { min: 1, max: 12, step: 1 },
      speed: { min: 0, max: 3, step: 0.1 },
      beamWidth: { min: 0.005, max: 0.1, step: 0.005 },
      glow: { min: 0.2, max: 4, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.05 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
