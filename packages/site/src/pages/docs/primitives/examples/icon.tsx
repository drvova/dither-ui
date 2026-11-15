import { For } from "solid-js"
import { DitherIcon, ICON_NAMES } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  // labeled: promoted to role=img with a name
  // currentColor inherits; weight rides on stroke-width
  return (
    <div class="grid grid-cols-4 gap-2 sm:grid-cols-6">
      <For each={ICON_NAMES}>
        {(n) => (
          <div class="grid justify-items-center gap-1.5 rounded-md border border-border/60 bg-card/30 px-1 py-3">
            <DitherIcon class="text-foreground/90" name={n} size={20} />
            <span class="w-full truncate text-center text-[9px] text-muted-foreground">{n}</span>
          </div>
        )}
      </For>
    </div>
  )
}

export const meta = defineExample({
  component: DitherIcon,
  title: "Icon",
  studio: {
    group: "display",
    frame: { w: 160, h: 80 },
    controls: { name: {}, size: { min: 8, max: 48 }, strokeWidth: { min: 1, max: 3 } },
  },
})
