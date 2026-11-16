import { DitherMagnet } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherMagnet strength={0.4}>
      <button type="button" class="rounded-md border border-border/60 bg-card px-4 py-2 text-sm">
        Magnet
      </button>
    </DitherMagnet>
  )
}

export const meta = defineExample({
  component: DitherMagnet,
  title: "Magnet",
  studio: {
    group: "display",
    frame: { w: 220, h: 120 },
    controls: { strength: { min: 0, max: 1, step: 0.05 }, radius: { min: 40, max: 500, step: 10 } },
    slot: "Magnet",
  },
})
