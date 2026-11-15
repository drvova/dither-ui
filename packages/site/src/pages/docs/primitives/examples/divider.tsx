import { DitherDivider } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherDivider />
}

export const meta = defineExample({
  component: DitherDivider,
  title: "Divider",
  studio: { group: "structure", frame: { w: 240, h: 80 }, controls: { orientation: {} } },
})
