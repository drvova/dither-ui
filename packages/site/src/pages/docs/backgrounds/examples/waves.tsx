import { DitherWaves } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example(props: { colors?: string[] }) {
  return (
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
      <DitherWaves colors={props.colors ?? ["#5227FF", "#7CFF67"]} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherWaves,
  title: "Waves",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#5227FF", "#7CFF67"] },
      count: { min: 2, max: 40, step: 1 },
      amplitude: { min: 0, max: 1.5, step: 0.05 },
      frequency: { min: 0.5, max: 6, step: 0.1 },
      speed: { min: 0, max: 3, step: 0.1 },
      lineWidth: { min: 0.02, max: 0.5, step: 0.02 },
      glow: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      mouseInteraction: {},
      mouseStrength: { min: 0, max: 2, step: 0.1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
