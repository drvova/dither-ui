import { DitherTimeline } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="mx-auto max-w-sm">
      <DitherTimeline
        items={[
          { title: "Deployed v0.3.0", time: "2h ago", color: "green", body: "Rolled out to production behind a flag." },
          { title: "Merged #482", time: "Yesterday", color: "blue", body: "Seeded the spinner form space." },
          { title: "Opened milestone", time: "Mon", color: "purple", body: "Navigation & data components." },
          { title: "Kicked off", time: "Last week", color: "orange" },
        ]}
      />
    </div>
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
