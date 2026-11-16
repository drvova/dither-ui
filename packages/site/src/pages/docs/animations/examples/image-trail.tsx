import { DitherImageTrail } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherImageTrail class="grid h-44 w-full place-items-center rounded-lg border border-border/60 text-sm text-muted-foreground">
      Move your cursor here
    </DitherImageTrail>
  )
}

export const meta = defineExample({
  component: DitherImageTrail,
  title: "Image trail",
  studio: {
    group: "display",
    frame: { w: 260, h: 180 },
    controls: {
      colors: { demo: ["#5227FF", "#7CFF67", "#3DA5FF", "#FF3D2E", "#FFD23D"] },
      size: { min: 8, max: 120, step: 4 },
      duration: { min: 100, max: 2000, step: 50 },
    },
  },
})
