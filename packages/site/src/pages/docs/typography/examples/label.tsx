import { DitherLabel } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherLabel>Email</DitherLabel>
}

export const meta = defineExample({
  component: DitherLabel,
  title: "Label",
  studio: { group: "inputs", frame: { w: 200, h: 80 }, controls: { required: {} } },
})
