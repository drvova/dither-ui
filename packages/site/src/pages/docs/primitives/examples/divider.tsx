import { DitherDivider, DitherText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  // vertical: stretches inside a flex row
  return (
    <div class="mx-auto w-full max-w-sm">
      <DitherText class="text-center" size="sm" tone="muted">
        Charts render on canvas.
      </DitherText>
      <DitherDivider class="my-4" />
      <DitherText class="text-center" size="sm" tone="muted">
        Fills threshold the same Bayer matrix.
      </DitherText>
      <div class="mt-6 flex h-10 items-center justify-center gap-4">
        <span class="text-[12px] text-foreground/90">Left</span>
        <DitherDivider orientation="vertical" />
        <span class="text-[12px] text-foreground/90">Right</span>
      </div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherDivider,
  title: "Divider",
  studio: { group: "structure", frame: { w: 240, h: 80 }, controls: { orientation: {} } },
})
