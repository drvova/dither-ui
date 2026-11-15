import { DitherRelativeTime } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="grid justify-center gap-1 text-[13px]">
      <DitherRelativeTime date={Date.now() - 90_000} />
      <DitherRelativeTime class="text-muted-foreground" date={Date.now() + 86_400_000 * 2} />
      <DitherRelativeTime class="text-muted-foreground" date={new Date("2026-01-05")} auto={false} />
    </div>
  )
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
