import { DitherHighlight } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <p class="text-[13px] leading-relaxed text-muted-foreground">
      Matches are <DitherHighlight>highlighted inline</DitherHighlight> without breaking the reading flow.
    </p>
  )
}

export const meta = defineExample({
  component: DitherHighlight,
  title: "Highlight",
  studio: { group: "display", frame: { w: 260, h: 80 }, controls: {} },
})
