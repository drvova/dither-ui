import { createSignal, For } from "solid-js"
import { DitherGrid } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [min, setMin] = createSignal(140)

  return (
    <>
      <label class="flex items-center gap-2 text-[11px]">
        min card width
        <input
          value={min()}
          onInput={(e) => setMin(Number(e.currentTarget.value))}
          type="range"
          min="100"
          max="240"
          step="10"
        />
        {min()}px
      </label>

      {/* auto-fit by min card width */}
      <DitherGrid min={min()} class="mt-3">
        <For each={Array.from({ length: 6 }, (_, k) => k + 1)}>
          {(i) => <div class="rounded-md border p-3 text-[10px]">Card {i}</div>}
        </For>
      </DitherGrid>

      {/* or a deliberate fixed count */}
      <DitherGrid cols={3} gap="1rem" class="mt-3">
        <div class="col-span-2 rounded-md border p-3">wide</div>
        <div class="rounded-md border p-3">narrow</div>
      </DitherGrid>
    </>
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
