import { DitherStickerPeel } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherStickerPeel>
      <div class="grid h-24 w-40 place-items-center rounded-lg border bg-card text-sm text-muted-foreground">
        Peel me
      </div>
    </DitherStickerPeel>
  )
}

export const meta = defineExample({
  component: DitherStickerPeel,
  title: "Sticker peel",
  studio: { group: "display", frame: { w: 200, h: 120 }, controls: {}, slot: "Peel me" },
})
