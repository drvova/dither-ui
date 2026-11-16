import { DitherLabel } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="grid w-full max-w-xs gap-1.5 text-left">
      <DitherLabel required>Email</DitherLabel>
      <div class="rounded-md border border-border/60 bg-card/60 px-3 py-1.5 text-[12px] text-muted-foreground">
        you@example.com
      </div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherLabel,
  title: "Label",
  studio: { group: "inputs", frame: { w: 200, h: 80 }, controls: { required: { demo: false } } },
})
