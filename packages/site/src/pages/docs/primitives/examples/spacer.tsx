import { DitherSpacer } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherSpacer />
}

export const meta = defineExample({
  component: DitherSpacer,
  title: "Spacer",
  studio: { group: "structure", frame: { w: 200, h: 80 }, controls: { axis: {}, size: {} } },
})
