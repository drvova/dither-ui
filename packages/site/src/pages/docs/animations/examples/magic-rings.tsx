import { DitherMagicRings } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherMagicRings class="h-52 w-full">
      <span class="grid h-12 w-12 place-items-center rounded-full border border-border/60 bg-card text-xs text-muted-foreground">
        core
      </span>
    </DitherMagicRings>
  )
}

export const meta = defineExample({
  component: DitherMagicRings,
  title: "Magic rings",
  studio: {
    group: "display",
    frame: { w: 240, h: 200 },
    controls: {
      color: { kind: "color", demo: "green" },
      count: { min: 1, max: 10, step: 1 },
      duration: { min: 0.5, max: 10, step: 0.5 },
    },
    slot: "Magic",
  },
})
