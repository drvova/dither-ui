import { DitherProgress } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const rendered = 40

  return (
    <div class="mx-auto grid max-w-sm gap-6">
      <div class="grid gap-2">
        <div class="flex items-baseline justify-between text-[11px] text-muted-foreground">
          <span>Rendering</span>
          <span class="tabular-nums">{rendered}%</span>
        </div>
        <DitherProgress value={rendered} color="blue" />
      </div>
      <div class="grid gap-2">
        <span class="text-[11px] text-muted-foreground">Indexing</span>
        <DitherProgress indeterminate color="purple" />
      </div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherProgress,
  title: "Progress",
  studio: {
    group: "display",
    frame: { w: 300, h: 80 },
    controls: { color: {}, value: { min: 0, max: 100 }, indeterminate: {} },
  },
})
