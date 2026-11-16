import { DitherPixelTransition } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherPixelTransition class="grid h-32 w-56 place-items-center rounded-lg border border-border/60" color="#181b22">
      <span class="text-lg tracking-tight">Revealed</span>
    </DitherPixelTransition>
  )
}

export const meta = defineExample({
  component: DitherPixelTransition,
  title: "Pixel transition",
  studio: {
    group: "display",
    frame: { w: 260, h: 160 },
    controls: {
      rows: { min: 2, max: 20, step: 1 },
      cols: { min: 2, max: 30, step: 1 },
      color: { kind: "color", demo: "blue" },
    },
    slot: "Hover to reveal",
  },
})
