import { DitherKbdCombo } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      <DitherKbdCombo keys={["⌘", "K"]} />
      <DitherKbdCombo keys={["Ctrl", "Shift", "P"]} separator="›" />
    </>
  )
}

export const meta = defineExample({
  component: DitherKbdCombo,
  title: "Kbd combo",
  studio: { group: "display", frame: { w: 220, h: 80 }, controls: { keys: {}, separator: {} }, slot: "" },
})
