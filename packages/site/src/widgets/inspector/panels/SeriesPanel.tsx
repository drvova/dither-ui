// A series layer (a pie's slice): its label, colour, texture and markers.
import { createMemo, Show } from "solid-js"
import { familyOf } from "@/shared/config"
import { ColorField, NumberField, Segmented, TextureField, Toggle } from "@/shared/ui"
import { layerSeries } from "../model/series"
import { Range, Text } from "../ui/fields"
import type { LayerPanelProps } from "./types"

const DOT_VARIANTS = ["border", "colored-border", "filled"] as const

export default function SeriesPanel(props: LayerPanelProps) {
  const fam = createMemo(() => familyOf(props.chart.type))
  const series = createMemo(() => layerSeries(props.chart, props.layer))
  return (
    <Show when={series()}>
      {(s) => (
        <>
          <Text label="label" name="series-label" value={s().label} set={(v) => (s().label = v)} />
          <div class="text-[11px] text-muted-foreground">
            <span class="mb-1 block">color</span>
            <ColorField modelValue={s().color} onUpdateModelValue={(v) => (s().color = v)} />
          </div>
          <Show when={props.chart.type !== "line"}>
            <TextureField modelValue={s().variant} onUpdateModelValue={(v) => (s().variant = v)} />
          </Show>
          <Show when={fam() === "cartesian"}>
            <Range
              label="opacity"
              name="series-opacity"
              min={0}
              max={1}
              step={0.05}
              value={s().opacity}
              set={(v) => (s().opacity = v)}
            >
              {s().opacity.toFixed(2)}
            </Range>
          </Show>
          <div class="flex gap-4 pt-0.5">
            <Toggle modelValue={s().on} label="visible" onUpdateModelValue={(v) => (s().on = v)} />
            <Toggle modelValue={s().isClickable} label="clickable" onUpdateModelValue={(v) => (s().isClickable = v)} />
          </div>

          <Show when={fam() === "cartesian"}>
            <section class="flex flex-col gap-2.5 border-t border-border/60 pt-3">
              <p class="micro text-muted-foreground">Markers</p>
              <Toggle
                modelValue={s().dots.on}
                label="dots at every point"
                onUpdateModelValue={(v) => (s().dots.on = v)}
              />
              <Show when={s().dots.on}>
                <Segmented
                  modelValue={s().dots.variant}
                  options={DOT_VARIANTS}
                  label="style"
                  onUpdateModelValue={(v) => (s().dots.variant = v)}
                />
                <NumberField
                  modelValue={s().dots.r}
                  label="radius"
                  min={1}
                  max={8}
                  step={0.5}
                  onUpdateModelValue={(v) => (s().dots.r = v)}
                />
              </Show>
              <Toggle
                modelValue={s().activeDot.on}
                label="active dot on hover"
                onUpdateModelValue={(v) => (s().activeDot.on = v)}
              />
              <Show when={s().activeDot.on}>
                <Segmented
                  modelValue={s().activeDot.variant}
                  options={DOT_VARIANTS}
                  label="style"
                  onUpdateModelValue={(v) => (s().activeDot.variant = v)}
                />
                <NumberField
                  modelValue={s().activeDot.r}
                  label="radius"
                  min={1}
                  max={10}
                  step={0.5}
                  onUpdateModelValue={(v) => (s().activeDot.r = v)}
                />
              </Show>
            </section>
          </Show>
        </>
      )}
    </Show>
  )
}
