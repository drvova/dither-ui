import { createSignal } from "solid-js"
import { DitherSlider } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [level, setLevel] = createSignal(40)
  const [range, setRange] = createSignal<[number, number]>([25, 75])
  const [quality, setQuality] = createSignal(60)

  return (
    <div class="mx-auto grid max-w-sm gap-7">
      <div class="flex items-center gap-4">
        <DitherSlider
          modelValue={level()}
          onUpdateModelValue={(v) => setLevel(v as number)}
          label="Level"
          min={0}
          max={100}
          step={1}
          color="blue"
        />
        <span class="w-8 text-right text-[13px] tabular-nums">{level()}</span>
      </div>
      {/* two thumbs: a tuple model makes it a range */}
      <div class="grid gap-2">
        <div class="flex items-baseline justify-between text-[11px] text-muted-foreground">
          <span>Price range</span>
          <span class="tabular-nums">
            {range()[0]} – {range()[1]}
          </span>
        </div>
        <DitherSlider
          modelValue={range()}
          onUpdateModelValue={(v) => setRange(v as [number, number])}
          label="Price"
          color="green"
          showValue
        />
      </div>
      <div class="grid gap-2">
        <div class="flex items-baseline justify-between text-[11px] text-muted-foreground">
          <span>Quality (step 10, ticks)</span>
          <span class="tabular-nums">{quality()}</span>
        </div>
        <DitherSlider
          modelValue={quality()}
          onUpdateModelValue={(v) => setQuality(v as number)}
          label="Quality"
          step={10}
          ticks
          showValue
          color="purple"
        />
      </div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherSlider,
  title: "Slider",
  studio: {
    group: "inputs",
    frame: { w: 280, h: 90 },
    controls: { color: {}, min: {}, max: {}, step: { min: 0.1, step: 0.1 }, disabled: {} },
  },
})
