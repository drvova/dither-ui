import { DitherCountUp } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      <DitherCountUp to={1984} /> renders {/* counts up when scrolled into view */}
    </>
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
