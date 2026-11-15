import { DitherKbd } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherKbd>⌘K</DitherKbd>
}

export const meta = defineExample({
  component: DitherKbd,
  title: "Kbd",
  studio: { group: "display", frame: { w: 140, h: 80 }, controls: {} },
})
