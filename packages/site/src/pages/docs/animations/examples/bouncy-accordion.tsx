import { createSignal } from "solid-js"
import { DitherBouncyAccordion } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [panel, setPanel] = createSignal("overview")

  // single-open: a spring overshoot on open, a brisk close
  return (
    <DitherBouncyAccordion
      modelValue={panel()}
      onUpdateModelValue={setPanel}
      class="mx-auto max-w-sm"
      items={[
        {
          value: "overview",
          label: "Overview",
          hint: "What shipped this week",
          icon: "▤",
          content: "Charts, buttons and backgrounds now share one Bayer engine.",
        },
        {
          value: "activity",
          label: "Activity",
          hint: "3 deploys, 1 rollback",
          icon: "◷",
          color: "green",
          content: "Build 214 settled after a weighted spring: 8% overshoot, then calm.",
        },
        {
          value: "alerts",
          label: "Alerts",
          hint: "One flapping check",
          icon: "◈",
          color: "orange",
          content: "p95 latency wobbled at 04:00 and snapped back on its own.",
        },
      ]}
    />
  )
}

export const meta = defineExample({
  component: DitherBouncyAccordion,
  title: "Bouncy accordion",
  studio: {
    group: "display",
    frame: { w: 340, h: 260 },
    controls: { color: {}, items: { kind: "list", demo: ["Overview", "Activity", "Alerts"] } },
  },
})
