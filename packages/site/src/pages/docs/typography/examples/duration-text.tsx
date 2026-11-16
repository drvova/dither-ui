import { DitherDurationText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="grid justify-center gap-1 text-[13px]">
      <span>
        <DitherDurationText ms={500} /> (build sub-second)
      </span>
      <span>
        <DitherDurationText ms={125000} /> (a queue wait)
      </span>
      <span class="text-muted-foreground">
        <DitherDurationText ms={80400000} /> (a download)
      </span>
    </div>
  )
}

export const meta = defineExample({
  component: DitherDurationText,
  title: "Duration",
  studio: { group: "display", frame: { w: 240, h: 80 }, controls: { ms: { demo: 80400000, min: 0, max: 172800000 } } },
})
