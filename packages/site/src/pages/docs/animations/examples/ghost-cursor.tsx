import { DitherGhostCursor } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherGhostCursor
      color="#7CFF67"
      class="grid h-40 w-full place-items-center rounded-lg border text-sm text-muted-foreground"
    >
      Move your cursor here
    </DitherGhostCursor>
  )
}

export const meta = defineExample({
  component: DitherGhostCursor,
  title: "Ghost cursor",
  studio: {
    group: "display",
    frame: { w: 240, h: 160 },
    controls: {
      color: { kind: "color", demo: "blue" },
      count: { min: 4, max: 60, step: 1 },
      size: { min: 2, max: 40, step: 1 },
    },
  },
})
