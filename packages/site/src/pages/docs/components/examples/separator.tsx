import { DitherSeparator } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="mx-auto max-w-sm">
      <p class="text-[12px] text-muted-foreground">Charts render on canvas.</p>
      <DitherSeparator class="my-4" />
      <p class="text-[12px] text-muted-foreground">Fills threshold the same Bayer matrix.</p>
      <div class="mt-6 flex h-5 items-center justify-center gap-4">
        <span class="text-[11px]">docs</span>
        <DitherSeparator orientation="vertical" />
        <span class="text-[11px]">studio</span>
      </div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherSeparator,
  title: "Separator",
  studio: { group: "display", frame: { w: 260, h: 60 }, controls: { orientation: {} } },
})
