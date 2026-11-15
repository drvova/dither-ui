import { DitherBlobCursor } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherBlobCursor class="grid h-40 w-full place-items-center rounded-lg border border-border/60 text-sm text-muted-foreground">
      Move your cursor here
    </DitherBlobCursor>
  )
}

export const meta = defineExample({
  component: DitherBlobCursor,
  title: "Blob cursor",
  studio: {
    group: "display",
    frame: { w: 240, h: 160 },
    controls: {
      color: { kind: "color", demo: "blue" },
      size: { min: 8, max: 160, step: 4 },
      lag: { min: 0.02, max: 1, step: 0.02 },
    },
  },
})
