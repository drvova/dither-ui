import { DitherDateTimeText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="grid justify-center gap-1 text-[13px]">
      <DitherDateTimeText date="2026-10-07T15:04:00Z" options={{ timeZone: "UTC" }} />
      <DitherDateTimeText
        class="text-muted-foreground"
        date="2026-10-07T15:04:00Z"
        options={{ timeZone: "UTC", dateStyle: "full" }}
      />
      <DitherDateTimeText class="text-muted-foreground" date="not a date" />
    </div>
  )
}

export const meta = defineExample({
  component: DitherDateTimeText,
  title: "Date time",
  studio: { group: "display", frame: { w: 260, h: 80 }, controls: { date: { kind: "text" }, locale: {} }, slot: "" },
  states: [{ date: "2024-02-29T08:30:00Z", locale: "de-DE" }],
})
