import { DitherDateTimeText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherDateTimeText date="2026-10-07T15:04:00Z" />
}

export const meta = defineExample({
  component: DitherDateTimeText,
  title: "Date time",
  studio: { group: "display", frame: { w: 260, h: 80 }, controls: { date: { kind: "text" }, locale: {} }, slot: "" },
  states: [{ date: "2024-02-29T08:30:00Z", locale: "de-DE" }],
})
