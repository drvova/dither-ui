import { DitherIconSet } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  // once, near the app root
  // then anywhere: one symbol, many uses
  return (
    <div class="grid justify-items-center gap-4">
      <div class="flex items-center gap-5 text-foreground/90">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <use href="#di-icon-Star" />
        </svg>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <use href="#di-icon-Heart" />
        </svg>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <use href="#di-icon-Bell" />
        </svg>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <use href="#di-icon-Bookmark" />
        </svg>
      </div>
      <span class="text-[11px] text-muted-foreground">four symbols, one sprite</span>
      <DitherIconSet />
    </div>
  )
}

export const meta = defineExample({
  component: DitherIconSet,
  title: "Icon set",
  studio: { group: "display", frame: { w: 200, h: 80 }, controls: {}, slot: "" },
})
