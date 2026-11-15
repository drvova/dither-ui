import { createSignal, Index } from "solid-js"
import { DitherRating } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [rating, setRating] = createSignal(3)
  const colors = ["orange", "pink", "purple", "green"] as const
  const [seeds, setSeeds] = createSignal([0, 12, 88, 404])
  const reroll = () => setSeeds(seeds().map(() => Math.floor(Math.random() * 100000)))

  return (
    <div class="grid gap-6">
      <div class="flex flex-col items-center gap-2">
        <DitherRating modelValue={rating()} onUpdateModelValue={setRating} size={28} />
        <p class="text-[12px] tabular-nums text-muted-foreground">{rating()} / 5 (click or arrow-key)</p>
      </div>
      {/* readonly: fractions render, max sets the count */}
      <div class="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        <DitherRating modelValue={4.5} readonly />
        <DitherRating modelValue={3} readonly color="green" />
        <DitherRating modelValue={5} readonly color="pink" max={5} />
        <DitherRating modelValue={7} readonly color="blue" max={10} size={16} />
      </div>
      {/* a seed draws a star of its own */}
      <div class="flex flex-col items-center gap-3">
        <div class="flex flex-wrap items-center justify-center gap-6">
          <Index each={seeds()}>
            {(sd, i) => <DitherRating modelValue={4} readonly seed={sd()} color={colors[i]} size={24} />}
          </Index>
        </div>
        <button
          type="button"
          class="rounded-md border border-border px-3 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          onClick={reroll}
        >
          Reroll star seeds
        </button>
      </div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherRating,
  title: "Rating",
  studio: {
    group: "inputs",
    frame: { w: 240, h: 90 },
    controls: { color: {}, max: { min: 1, max: 10 }, size: { min: 12, max: 48 }, readonly: {}, label: {} },
  },
})
