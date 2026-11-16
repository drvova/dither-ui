import { createSignal } from "solid-js"
import { DitherSchedule } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  // fractional hours: 13.5 is half past one
  const [now, setNow] = createSignal(13.5)

  return (
    <div class="mx-auto max-w-md">
      <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
        now
        <input
          value={now()}
          onInput={(e) => setNow(e.currentTarget.valueAsNumber)}
          type="range"
          min="8"
          max="18"
          step="0.25"
          class="h-6 w-40 accent-[var(--accent)]"
        />
        <span class="tabular-nums">
          {Math.floor(now())}:{String(Math.round((now() % 1) * 60)).padStart(2, "0")}
        </span>
      </label>
      <DitherSchedule
        class="mt-3"
        events={[
          { start: 9, end: 10.5, label: "Standup", color: "blue" },
          { start: 11, end: 12.5, label: "Design review", color: "purple" },
          { start: 14, end: 16, label: "Focus block", color: "green" },
          { start: 16.5, end: 17.5, label: "Client call", color: "orange" },
        ]}
        from={8}
        to={18}
        now={now()}
      />
    </div>
  )
}

export const meta = defineExample({
  component: DitherSchedule,
  title: "Schedule",
  studio: {
    group: "display",
    frame: { w: 340, h: 280 },
    story: { slots: { kind: "list", demo: ["9|10.5|Standup", "11|12.5|Design review", "14|16|Focus block"] } },
    controls: {
      from: { min: 0, max: 23, step: 1 },
      to: { min: 1, max: 24, step: 1 },
      now: { demo: 13.5, min: 0, max: 24, step: 0.5 },
    },
  },
})
