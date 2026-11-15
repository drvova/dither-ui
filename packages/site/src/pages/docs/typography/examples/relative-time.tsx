import { DitherRelativeTime } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherRelativeTime date={Date.now() - 90_000} />
}

export const meta = defineExample({
  component: DitherRelativeTime,
  title: "Relative time",
  studio: {
    group: "display",
    frame: { w: 240, h: 80 },
    controls: { auto: {}, updateInterval: { min: 1000, max: 300000 } },
    slot: "",
  },
})
