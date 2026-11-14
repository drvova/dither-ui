import { createSignal } from "solid-js"
import { DitherCalendar } from "@dither-kit"

export default function Example() {
  const [day, setDay] = createSignal("2026-10-07")

  return <DitherCalendar modelValue={day()} onUpdateModelValue={setDay} max="2026-12-31" />
}
