import { DitherCountUp } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  // counts up when scrolled into view
  return (
    <div class="flex min-h-24 items-center justify-center gap-8 text-4xl tracking-tight tabular-nums">
      <DitherCountUp to={1984} />
      <DitherCountUp to={99.9} decimals={1} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherCountUp,
  title: "Count up",
  studio: {
    group: "display",
    frame: { w: 220, h: 100 },
    controls: {
      to: { min: 0, max: 1000000, step: 1 },
      from: { min: 0, max: 1000000, step: 1 },
      duration: { min: 100, max: 5000, step: 100 },
      decimals: { min: 0, max: 4, step: 1 },
    },
  },
})
