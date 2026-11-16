import { DitherPixelTrail } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherPixelTrail class="grid h-40 w-full place-items-center rounded-lg border border-border/60 text-sm text-muted-foreground">
      Move your cursor here
    </DitherPixelTrail>
  )
}

export const meta = defineExample({
  component: DitherPixelTrail,
  title: "Pixel trail",
  studio: {
    group: "display",
    frame: { w: 240, h: 160 },
    controls: { color: { kind: "color", demo: "blue" }, gap: { min: 8, max: 80, step: 2 } },
  },
})
