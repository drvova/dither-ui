import { createSignal, For } from "solid-js"
import { DitherGrid } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [min, setMin] = createSignal(140)

  return (
    <div class="mx-auto max-w-lg">
      <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
        min card width
        <input
          value={min()}
          onInput={(e) => setMin(e.currentTarget.valueAsNumber)}
          type="range"
          min="100"
          max="240"
          step="10"
          class="h-6 w-40 accent-[var(--accent)]"
        />
        <span class="tabular-nums">{min()}px</span>
      </label>
      {/* as many columns as fit at min px each */}
      <DitherGrid min={min()} class="mt-3">
        <For each={[1, 2, 3, 4, 5, 6]}>
          {(i) => (
            <div class="rounded-md border border-border/60 bg-background/60 p-3">
              <div class="text-[10px] text-muted-foreground">Card {i}</div>
              <div class="mt-1 h-2 w-2/3 rounded-sm bg-border/50" aria-hidden="true" />
            </div>
          )}
        </For>
      </DitherGrid>
    </div>
  )
}

export const meta = defineExample({
  component: DitherGrid,
  title: "Grid",
  studio: {
    group: "structure",
    frame: { w: 340, h: 220 },
    controls: { min: { min: 80, max: 400, demo: 120 }, gap: {} },
    slot: "Card",
  },
  states: [{ gap: "1.5rem" }],
})
