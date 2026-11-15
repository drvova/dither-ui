import { DitherMagnetLines } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherMagnetLines class="grid h-40 w-full place-items-center rounded-lg border border-border/60 text-sm text-muted-foreground" />
  )
}

export const meta = defineExample({
  component: DitherMagnetLines,
  title: "Magnet lines",
  studio: {
    group: "display",
    frame: { w: 280, h: 200 },
    controls: {
      color: { kind: "color", demo: "green" },
      gap: { min: 12, max: 80, step: 2 },
      lineLength: { min: 4, max: 40, step: 2 },
    },
    slot: "",
  },
})
