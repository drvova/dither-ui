import { DitherLineClamp } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="mx-auto w-full max-w-sm">
      <DitherLineClamp class="text-[13px] leading-relaxed text-muted-foreground" lines={2}>
        The kit is a folder, not a package: copy it, alias it, and every component keeps the same seed contract all the
        way down to the Bayer matrix that thresholds the fill. This sentence exists only to overflow the two-line clamp
        so the ellipsis earns its place in the demo.
      </DitherLineClamp>
    </div>
  )
}

export const meta = defineExample({
  component: DitherLineClamp,
  title: "Line clamp",
  studio: {
    group: "display",
    frame: { w: 300, h: 120 },
    slot: "Body copy that stops after N lines with an ellipsis…",
    controls: {
      lines: { kind: "select", options: ["1", "2", "3", "4", "5", "6"], demo: "3" },
      as: { kind: "select", options: ["p", "span", "div"] },
    },
  },
})
