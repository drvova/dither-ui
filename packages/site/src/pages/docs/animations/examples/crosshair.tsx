import { DitherCrosshair } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherCrosshair class="grid h-40 w-full place-items-center rounded-lg border border-border/60 text-sm text-muted-foreground">
      Move your cursor here
    </DitherCrosshair>
  )
}

export const meta = defineExample({
  component: DitherCrosshair,
  title: "Crosshair",
  studio: {
    group: "display",
    frame: { w: 240, h: 160 },
    controls: { color: { kind: "color", demo: "blue" }, thickness: { min: 1, max: 6, step: 1 } },
  },
})
