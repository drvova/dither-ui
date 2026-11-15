import { DitherDarkVeil } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="relative h-64 overflow-hidden rounded-md">
      <DitherDarkVeil />
    </div>
  )
}

export const meta = defineExample({
  component: DitherDarkVeil,
  title: "Dark veil",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#0A0A12", "#3A2A6A", "#5227FF"] },
      scale: { min: 0.4, max: 8, step: 0.1 },
      speed: { min: 0, max: 3, step: 0.1 },
      intensity: { min: 0, max: 5, step: 0.1 },
      vignette: { min: 0, max: 1, step: 0.05 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
