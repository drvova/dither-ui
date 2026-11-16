import { DitherTargetCursor } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherTargetCursor class="grid h-40 w-full place-items-center rounded-lg border border-border/60 text-sm text-muted-foreground">
      Move your cursor here
    </DitherTargetCursor>
  )
}

export const meta = defineExample({
  component: DitherTargetCursor,
  title: "Target cursor",
  studio: {
    group: "display",
    frame: { w: 240, h: 160 },
    controls: { color: { kind: "color", demo: "blue" }, size: { min: 12, max: 120, step: 4 } },
  },
})
