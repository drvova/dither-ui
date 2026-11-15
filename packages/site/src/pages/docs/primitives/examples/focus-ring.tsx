import { DitherFocusRing } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="flex justify-center">
      <DitherFocusRing class="inline-flex gap-2 rounded-md p-1">
        <button class="rounded border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground" type="button">
          First
        </button>
        <button class="rounded border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground" type="button">
          Second
        </button>
      </DitherFocusRing>
    </div>
  )
}

export const meta = defineExample({
  component: DitherFocusRing,
  title: "Focus ring",
  studio: { group: "structure", frame: { w: 240, h: 90 }, controls: {}, slot: "Focus the control" },
})
