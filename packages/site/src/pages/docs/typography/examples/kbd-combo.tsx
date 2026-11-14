import { DitherKbdCombo } from "@dither-kit"

export default function Example() {
  return (
    <>
      <DitherKbdCombo keys={["⌘", "K"]} />
      <DitherKbdCombo keys={["Ctrl", "Shift", "P"]} separator="›" />
    </>
  )
}
