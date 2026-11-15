import { DitherBlockquote } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherBlockquote class="mx-auto max-w-md">
      Dithering trades smooth gradients for a fixed threshold, and the threshold is the style.{" "}
      <span class="mt-2 block text-[11px] text-muted-foreground">From palette.ts</span>
    </DitherBlockquote>
  )
}

export const meta = defineExample({
  component: DitherBlockquote,
  title: "Blockquote",
  studio: { group: "display", frame: { w: 320, h: 120 }, controls: {} },
})
