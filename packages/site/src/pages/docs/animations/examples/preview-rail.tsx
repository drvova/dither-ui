import { createSignal } from "solid-js"
import { DitherPreviewRail } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [dest, setDest] = createSignal("inbox")

  return (
    <>
      {/* ticks pyramid around the pointer, the preview floats beside the rail */}
      <DitherPreviewRail
        modelValue={dest()}
        onUpdateModelValue={setDest}
        items={[
          { value: "inbox", label: "Inbox", hint: "12 unread threads", color: "blue" },
          { value: "drafts", label: "Drafts", hint: "2 in progress", color: "purple" },
          { value: "planner", label: "Planner", hint: "Sprint 14, day 3", color: "green" },
          { value: "metrics", label: "Metrics", hint: "p95 latency 42ms", color: "orange" },
          { value: "settings", label: "Settings", hint: "Workspace + theme" },
        ]}
      />
    </>
  )
}

export const meta = defineExample({
  component: DitherPreviewRail,
  title: "Preview rail",
  studio: {
    group: "display",
    frame: { w: 240, h: 200 },
    controls: {
      items: { kind: "list", demo: ["Home", "Studio", "Docs", "Alerts"] },
      range: { min: 24, max: 160, step: 4 },
      side: {},
    },
    model: { demo: "home" },
  },
})
