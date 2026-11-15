import { DitherGlareHover } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherGlareHover>
      <div class="grid h-28 w-52 place-items-center rounded-lg border border-border/60 bg-card text-sm text-muted-foreground">
        Hover me
      </div>
    </DitherGlareHover>
  )
}

export const meta = defineExample({
  component: DitherGlareHover,
  title: "Glare hover",
  studio: { group: "display", frame: { w: 240, h: 140 }, controls: {}, slot: "Hover for a glare sweep" },
})
