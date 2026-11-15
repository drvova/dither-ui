import { DitherVisuallyHidden } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherVisuallyHidden>Visible to screen readers only</DitherVisuallyHidden>
}

export const meta = defineExample({
  component: DitherVisuallyHidden,
  title: "Visually hidden",
  studio: { group: "display", frame: { w: 280, h: 80 }, controls: { focusable: {} } },
})
