import { createSignal } from "solid-js"
import { DitherCalendar } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [day, setDay] = createSignal("2026-10-07")

  return <DitherCalendar modelValue={day()} onUpdateModelValue={setDay} max="2026-12-31" />
}

export const meta = defineExample({
  component: DitherCalendar,
  title: "Calendar",
  studio: {
    group: "inputs",
    frame: { w: 260, h: 280 },
    controls: { min: { demo: "" }, max: { demo: "" }, disabled: {} },
  },
  states: [{ min: "2026-10-01", max: "2026-10-31" }],
})
