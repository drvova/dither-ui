import { DitherSpacer } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="flex items-center justify-center rounded-md border border-border/60 p-4">
      <span class="text-[12px] text-foreground/90">Left</span>
      <DitherSpacer axis="x" size="lg" />
      <span class="text-[12px] text-foreground/90">Right</span>
      <DitherSpacer axis="x" size="xs" />
      <span class="text-[12px] text-muted-foreground">tight</span>
    </div>
  )
}

export const meta = defineExample({
  component: DitherSpacer,
  title: "Spacer",
  studio: { group: "structure", frame: { w: 200, h: 80 }, controls: { axis: { demo: "y" }, size: { demo: "md" } } },
})
