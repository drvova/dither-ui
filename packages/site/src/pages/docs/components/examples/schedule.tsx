import { DitherSchedule } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      <DitherSchedule
        events={[
          { start: 9, end: 10.5, label: "Standup", color: "blue" },
          { start: 11, end: 12.5, label: "Design review", color: "purple" },
          { start: 14, end: 16, label: "Focus block", color: "green" },
        ]}
        from={8}
        to={18}
        now={13.5}
      />
      {/* fractional hours: 13.5 is half past one */}
    </>
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
      now: { min: 0, max: 24, step: 0.5 },
    },
  },
})
