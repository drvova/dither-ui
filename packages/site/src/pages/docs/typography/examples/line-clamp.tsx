import { DitherLineClamp } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherLineClamp>Body copy that stops after N lines with an ellipsis…</DitherLineClamp>
}

export const meta = defineExample({
  component: DitherLineClamp,
  title: "Line clamp",
  studio: {
    group: "display",
    frame: { w: 300, h: 120 },
    controls: {
      lines: { kind: "select", options: ["1", "2", "3", "4", "5", "6"], demo: "3" },
      as: { kind: "select", options: ["p", "span", "div"] },
    },
  },
})
