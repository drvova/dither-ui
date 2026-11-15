import { DitherExpandingArrow } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      {/* a dotted trail unrolls on hover or focus */}
      <DitherExpandingArrow color="blue">Explore the kit</DitherExpandingArrow>
    </>
  )
}

export const meta = defineExample({
  component: DitherExpandingArrow,
  title: "Expanding arrow",
  studio: { group: "display", frame: { w: 260, h: 100 }, controls: { color: {}, disabled: {} } },
})
