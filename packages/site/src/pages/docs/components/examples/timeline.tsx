import { DitherTimeline } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherTimeline
      items={[
        { title: "Deployed v0.3.0", time: "2h ago", color: "green", body: "Rolled out to production." },
        { title: "Merged #482", time: "Yesterday", color: "blue", body: "Seeded spinner form space." },
        { title: "Opened milestone", time: "Mon", color: "purple" },
      ]}
    />
  )
}

export const meta = defineExample({
  component: DitherTimeline,
  title: "Timeline",
  studio: {
    group: "display",
    frame: { w: 340, h: 250 },
    controls: { items: { kind: "list", demo: ["Created", "Reviewed", "Published"] }, dotSize: { min: 6, max: 24 } },
  },
})
