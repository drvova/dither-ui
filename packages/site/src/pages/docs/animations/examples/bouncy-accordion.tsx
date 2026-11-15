import { createSignal } from "solid-js"
import { DitherBouncyAccordion } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

const PANELS = [
  {
    value: "overview",
    label: "Overview",
    hint: "What shipped this week",
    content: "Charts, buttons and backgrounds now share one Bayer engine.",
  },
  {
    value: "activity",
    label: "Activity",
    hint: "3 deploys, 1 rollback",
    color: "green" as const,
    content: "Build 214 settled after a weighted spring: 8% overshoot, then calm.",
  },
  {
    value: "alerts",
    label: "Alerts",
    hint: "One flapping check",
    color: "orange" as const,
    content: "p95 latency wobbled at 04:00 and snapped back on its own.",
  },
]

export default function Example() {
  const [panel, setPanel] = createSignal("overview")

  return <DitherBouncyAccordion modelValue={panel()} onUpdateModelValue={setPanel} items={PANELS} />
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
