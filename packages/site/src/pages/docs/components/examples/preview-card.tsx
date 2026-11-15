import { DitherPreviewCard, DitherAvatar } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherPreviewCard
      trigger={
        <button type="button" class="underline decoration-border underline-offset-4">
          @ada
        </button>
      }
    >
      <div class="flex items-center gap-3">
        <DitherAvatar name="Ada Lovelace" size={40} />
        <div>
          <p class="text-[13px]">Ada Lovelace</p>
          <p class="text-[11px] text-muted-foreground">Wrote the first program.</p>
        </div>
      </div>
    </DitherPreviewCard>
  )
}

export const meta = defineExample({
  component: DitherPreviewCard,
  title: "Preview card",
  studio: {
    group: "overlays",
    frame: { w: 300, h: 180 },
    controls: { delay: { min: 0, max: 1000, demo: 0 } },
    slot: "Preview details",
  },
})
