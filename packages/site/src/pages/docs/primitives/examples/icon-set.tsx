import { DitherIconSet } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherIconSet />
}

export const meta = defineExample({
  component: DitherIconSet,
  title: "Icon set",
  studio: { group: "display", frame: { w: 200, h: 80 }, controls: {}, slot: "" },
})
