import { DitherCircuit } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example(props: { density?: number; seed?: number }) {
  return (
    <div class="relative h-64 overflow-hidden rounded-md border border-border/60 bg-black">
      <DitherCircuit density={props.density ?? 0.6} seed={props.seed ?? 7} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherCircuit,
  title: "Circuit",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      ink: { kind: "text" },
      pulse: { kind: "text" },
      density: { min: 0, max: 1, step: 0.05 },
      speed: { min: 0, max: 60, step: 1 },
      pitch: { min: 2, max: 12, step: 1 },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      paused: {},
    },
  },
})
