import { DitherAurora } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example(props: { colors?: string[] }) {
  return (
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
      <DitherAurora colors={props.colors ?? ["#5227FF", "#7CFF67", "#5227FF"]} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherAurora,
  title: "Aurora",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      colors: { demo: ["#5227FF", "#7CFF67", "#5227FF"] },
      amplitude: { min: 0, max: 3, step: 0.1 },
      blend: { min: 0, max: 1, step: 0.05 },
      speed: { min: 0, max: 3, step: 0.1 },
      opacity: { min: 0, max: 1, step: 0.05 },
      dither: { kind: "number", min: 0, max: 1, step: 0.1 },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      paused: {},
    },
  },
})
