import { For } from "solid-js"
import { createStore } from "solid-js/store"
import { DitherSlider } from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import switchProps from "virtual:dither-props/DitherSwitch"
import checkboxProps from "virtual:dither-props/DitherCheckbox"
import sliderProps from "virtual:dither-props/DitherSlider"
import progressProps from "virtual:dither-props/DitherProgress"
import DocSection from "../DocSection"
import SwitchExample from "./examples/switch"
import switchCode from "./examples/switch.tsx?raw"
import CheckboxExample from "./examples/checkbox"
import checkboxCode from "./examples/checkbox.tsx?raw"
import SliderExample from "./examples/slider"
import sliderCode from "./examples/slider.tsx?raw"
import ProgressExample from "./examples/progress"
import progressCode from "./examples/progress.tsx?raw"

const SLIDER_VARIANTS = ["gradient", "dotted", "hatched", "solid"] as const

export const API: Record<string, PropRow[]> = {
  switch: kitTable(switchProps),
  checkbox: kitTable(checkboxProps),
  slider: kitTable(sliderProps, { join: [["min", "max", "step"]] }),
  progress: kitTable(progressProps),
}

export default function FormDocs() {
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
        <DemoCard code={checkboxCode}>
          <CheckboxExample />
        </DemoCard>
        <PropsTable rows={API.checkbox} />
      </DocSection>

      <DocSection id="slider">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Drag or arrow-key the square thumb. The filled side of the track dithers denser toward the value, and the rest
          stays a muted rail.
        </p>
        <DemoCard code={sliderCode}>
          <SliderExample />
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
        <DemoCard code={progressCode}>
          <ProgressExample />
        </DemoCard>
        <PropsTable rows={API.progress} />
      </DocSection>
    </>
  )
}
