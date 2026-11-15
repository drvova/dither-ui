import { DitherBadge } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherBadge>beta</DitherBadge>
}

export const meta = defineExample({
  component: DitherBadge,
  title: "Badge",
  studio: {
    group: "display",
    frame: { w: 160, h: 80 },
    controls: { color: {}, variant: { options: ["gradient", "solid", "dotted", "hatched"] } },
  },
})
