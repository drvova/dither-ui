import { createSignal } from "solid-js"
import { DitherMeasure } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [measured, setMeasured] = createSignal("not measured yet")
  const onMeasure = (size: { width: number; height: number }) => setMeasured(size.width + " × " + size.height)

  return (
    <div class="grid justify-items-center gap-3">
      <DitherMeasure class="w-48" onResize={onMeasure}>
        <div class="h-20 w-full rounded-md border border-border/60 bg-card/40" />
      </DitherMeasure>
      <span class="text-[11px] tabular-nums text-muted-foreground">{measured()}</span>
    </div>
  )
}

export const meta = defineExample({
  component: DitherMeasure,
  title: "Measure",
  studio: { group: "structure", frame: { w: 240, h: 100 }, controls: {}, slot: "Measured content" },
})
