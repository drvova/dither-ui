import { createSignal, For } from "solid-js"
import { createStore } from "solid-js/store"
import { DitherCheckbox, DitherProgress, DitherSlider } from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import switchProps from "virtual:dither-props/DitherSwitch"
import checkboxProps from "virtual:dither-props/DitherCheckbox"
import sliderProps from "virtual:dither-props/DitherSlider"
import progressProps from "virtual:dither-props/DitherProgress"
import DocSection from "../DocSection"
import SwitchExample from "./examples/switch"
import switchCode from "./examples/switch.tsx?raw"

const SLIDER_VARIANTS = ["gradient", "dotted", "hatched", "solid"] as const

const SNIPPET_CHECKBOX = `import { createStore } from "solid-js/store"
import { DitherCheckbox } from "@dither-kit"

export default function Example() {
  const [opts, setOpts] = createStore({ grid: true, snap: false, rulers: true })

  return (
    <div class="grid gap-3">
      <DitherCheckbox modelValue={opts.grid} onUpdateModelValue={(v) => setOpts("grid", v)}>Show grid</DitherCheckbox>
      <DitherCheckbox modelValue={opts.snap} onUpdateModelValue={(v) => setOpts("snap", v)}>Snap to pixels</DitherCheckbox>
      <DitherCheckbox modelValue={opts.rulers} onUpdateModelValue={(v) => setOpts("rulers", v)}>Show rulers</DitherCheckbox>
    </div>
  )
}`

const SNIPPET_SLIDER = `const [level, setLevel] = createSignal(40)
const [range, setRange] = createSignal<[number, number]>([25, 75])
const [quality, setQuality] = createSignal(60)

{/* single */}
<DitherSlider modelValue={level()} onUpdateModelValue={setLevel} label="Level" />

{/* range: an array modelValue grows a second thumb */}
<DitherSlider modelValue={range()} onUpdateModelValue={setRange} label="Price" showValue />

{/* ticks mark the steps; variant picks the fill texture */}
<DitherSlider modelValue={quality()} onUpdateModelValue={setQuality} label="Quality" step={10} ticks
  variant="dotted" showValue />`

const SNIPPET_PROGRESS = `import { createSignal } from "solid-js"
import { DitherProgress } from "@dither-kit"

export default function Example() {
  const [level, setLevel] = createSignal(40)

  return (
    <div class="grid gap-6">
      <DitherProgress value={level()} color="blue" />
      <DitherProgress indeterminate color="purple" />
    </div>
  )
}`

export const API: Record<string, PropRow[]> = {
  switch: kitTable(switchProps),
  checkbox: kitTable(checkboxProps),
  slider: kitTable(sliderProps, { join: [["min", "max", "step"]] }),
  progress: kitTable(progressProps),
}

export default function FormDocs() {
  const [opts, setOpts] = createStore({ grid: true, snap: false, rulers: true })

  const [level, setLevel] = createSignal(40)
  const [priceRange, setPriceRange] = createSignal<[number, number]>([25, 75])
  const [quality, setQuality] = createSignal(60)
  const [variantLevels, setVariantLevels] = createStore<Record<string, number>>({
    gradient: 65,
    dotted: 65,
    hatched: 65,
    solid: 65,
  })

  return (
    <>
      <DocSection id="switch">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A toggle whose track is a dithered canvas: the accent gradient fills in when on, fades to a muted wash when
          off.
        </p>
        <DemoCard code={switchCode}>
          <div class="mx-auto max-w-sm">
            <SwitchExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.switch} />
      </DocSection>

      <DocSection id="checkbox">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A pixel-border box that fills with the Bayer texture and draws a chunky near-white checkmark when checked.
          Label goes in as children.
        </p>
        <DemoCard code={SNIPPET_CHECKBOX}>
          <div class="mx-auto grid max-w-sm gap-3">
            <DitherCheckbox modelValue={opts.grid} onUpdateModelValue={(v) => setOpts("grid", v)}>
              Show grid
            </DitherCheckbox>
            <DitherCheckbox modelValue={opts.snap} onUpdateModelValue={(v) => setOpts("snap", v)}>
              Snap to pixels
            </DitherCheckbox>
            <DitherCheckbox modelValue={opts.rulers} onUpdateModelValue={(v) => setOpts("rulers", v)}>
              Show rulers
            </DitherCheckbox>
          </div>
        </DemoCard>
        <PropsTable rows={API.checkbox} />
      </DocSection>

      <DocSection id="slider">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Drag or arrow-key the square thumb. The filled side of the track dithers denser toward the value, and the rest
          stays a muted rail.
        </p>
        <DemoCard code={SNIPPET_SLIDER}>
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
            <div class="grid gap-2">
              <div class="flex items-baseline justify-between text-[11px] text-muted-foreground">
                <span>Price range</span>
                <span class="tabular-nums">
                  {priceRange()[0]} – {priceRange()[1]}
                </span>
              </div>
              <DitherSlider
                modelValue={priceRange()}
                onUpdateModelValue={(v) => setPriceRange(v as [number, number])}
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
        </DemoCard>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Variants</h3>
        <div class="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <For each={SLIDER_VARIANTS}>
            {(v) => (
              <div>
                <DitherSlider
                  modelValue={variantLevels[v]}
                  onUpdateModelValue={(next) => setVariantLevels(v, next as number)}
                  label={`${v} slider`}
                  variant={v}
                />
                <div class="mt-2 text-center text-[10px] text-muted-foreground">{v}</div>
              </div>
            )}
          </For>
        </div>
        <PropsTable rows={API.slider} />
      </DocSection>

      <DocSection id="progress">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A dithered fill that grows with <code class="text-foreground/80">value</code>; set{" "}
          <code class="text-foreground/80">indeterminate</code> to scroll a texture band instead (static under reduced
          motion). The bar below is bound to the slider above.
        </p>
        <DemoCard code={SNIPPET_PROGRESS}>
          <div class="mx-auto grid max-w-sm gap-6">
            <div class="grid gap-2">
              <div class="flex items-baseline justify-between text-[11px] text-muted-foreground">
                <span>Rendering</span>
                <span class="tabular-nums">{level()}%</span>
              </div>
              <DitherProgress value={level()} color="blue" />
            </div>
            <div class="grid gap-2">
              <span class="text-[11px] text-muted-foreground">Indexing</span>
              <DitherProgress indeterminate color="purple" />
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.progress} />
      </DocSection>
    </>
  )
}
