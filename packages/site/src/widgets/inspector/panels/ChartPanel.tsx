// A chart frame's own rows: its type, style, animation, seed and margins.
import { createMemo, For, Show } from "solid-js"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import type { ChartModel } from "@/entities/chart"
import { replay, setSelectedType } from "@/entities/editor"
import { CHART_TYPES, EASING_NAMES, familyOf, STACKS } from "@/shared/config"
import { BezierEditor, BloomField, NumberField, Segmented, Toggle } from "@/shared/ui"
import { Range, REPLAY_KEY } from "../ui/fields"

const ROLL_KEY =
  "rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
const CLEAR_KEY =
  "rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
// Easing: three presets + "custom" which opens the bezier curve editor,
// seeded from the preset's equivalent curve so the switch is seamless.
const EASING_CHOICES = [...EASING_NAMES, "custom"] as const
const SEED_BEZIER: Record<string, [number, number, number, number]> = {
  linear: [0.25, 0.25, 0.75, 0.75],
  "ease-out": [0.33, 1, 0.68, 1],
  "ease-in-out": [0.65, 0, 0.35, 1],
}
const roll = () => Math.floor(Math.random() * 1_000_000)

export default function ChartPanel(props: { chart: ChartModel }) {
  const fam = createMemo(() => familyOf(props.chart.type))
  const lined = () => props.chart.type === "area" || props.chart.type === "line"
  // Seed controls — one integer derives texture, motion, geometry and glow; the
  // effect seed pins the generative live-edge motion independently.
  const rollSeed = () => (props.chart.seed = roll())
  const clearSeed = () => (props.chart.seed = undefined)
  const rollEffect = () => (props.chart.effect = roll())
  const clearEffect = () => (props.chart.effect = undefined)
  const easingChoice = createMemo<string>(() => {
    const e = props.chart.easing ?? "ease-in-out"
    return typeof e === "string" ? e : "custom"
  })
  const bezierPoints = createMemo<[number, number, number, number]>(() => {
    const e = props.chart.easing
    return typeof e === "object" && e ? [e[0], e[1], e[2], e[3]] : SEED_BEZIER["ease-in-out"]
  })
  function setEasingChoice(v: string | number) {
    if (v === "custom") {
      const seed = SEED_BEZIER[easingChoice()] ?? SEED_BEZIER["ease-in-out"]
      props.chart.easing = [seed[0], seed[1], seed[2], seed[3]]
    } else {
      props.chart.easing = v as (typeof EASING_NAMES)[number]
    }
  }
  return (
    <>
      <section>
        <p class="mb-2 micro text-muted-foreground">Type</p>
        <div class="flex flex-wrap gap-0.5 rounded-md border border-border bg-background/60 p-0.5">
          <For each={CHART_TYPES}>
            {(t) => (
              <button
                type="button"
                class={cn(
                  "min-h-6 rounded-[5px] px-2.5 text-xs capitalize leading-none transition-colors",
                  props.chart.type === t ? "ring-on" : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={props.chart.type === t}
                onClick={() => setSelectedType(t)}
              >
                {t}
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="flex flex-col gap-3">
        <p class="micro text-muted-foreground">Style</p>
        <BloomField
          modelValue={props.chart.bloom}
          onUpdateModelValue={(v) => (props.chart.bloom = v as ChartModel["bloom"])}
        />
        <Show when={fam() === "cartesian"}>
          <Segmented
            modelValue={props.chart.stackType}
            options={STACKS}
            label="stack"
            onUpdateModelValue={(v) => (props.chart.stackType = v)}
          />
        </Show>
        <Show when={props.chart.type === "pie"}>
          <Range
            label="radius"
            name="pie-radius"
            min={0}
            max={0.85}
            step={0.05}
            value={props.chart.innerRadius}
            set={(v) => (props.chart.innerRadius = v)}
          >
            {props.chart.innerRadius.toFixed(2)}
          </Range>
        </Show>
        <Range
          label="pixel"
          name="cell"
          min={1}
          max={6}
          step={1}
          value={props.chart.cell}
          set={(v) => (props.chart.cell = v)}
        >
          {props.chart.cell}px
        </Range>
        <Show when={props.chart.type === "bar"}>
          <Range
            label="bar gap"
            name="bar-gap"
            min={0}
            max={0.7}
            step={0.02}
            value={props.chart.barGap}
            set={(v) => (props.chart.barGap = v)}
          >
            {props.chart.barGap.toFixed(2)}
          </Range>
          <Range
            label="edge"
            name="bar-edge"
            min={0}
            max={1}
            step={0.02}
            value={props.chart.barEdge}
            set={(v) => (props.chart.barEdge = v)}
          >
            {props.chart.barEdge.toFixed(2)}
          </Range>
        </Show>
        <Show when={props.chart.type === "line"}>
          <Range
            label="glow"
            name="glow-size"
            min={0.05}
            max={0.4}
            step={0.01}
            value={props.chart.glowSize}
            set={(v) => (props.chart.glowSize = v)}
          >
            {props.chart.glowSize.toFixed(2)}
          </Range>
        </Show>
        <Show when={props.chart.type === "pie"}>
          <Range
            label="pop"
            name="pie-pop"
            min={0}
            max={20}
            step={1}
            value={props.chart.popOut}
            set={(v) => (props.chart.popOut = v)}
          >
            {props.chart.popOut}px
          </Range>
          <Range
            label="rim"
            name="pie-rim"
            min={0}
            max={5}
            step={0.2}
            value={props.chart.rimWidth}
            set={(v) => (props.chart.rimWidth = v)}
          >
            {props.chart.rimWidth.toFixed(1)}
          </Range>
        </Show>
        <Show when={props.chart.type === "radar"}>
          <Range
            label="falloff"
            name="radar-falloff"
            min={0.1}
            max={1}
            step={0.05}
            value={props.chart.falloff}
            set={(v) => (props.chart.falloff = v)}
          >
            {props.chart.falloff.toFixed(2)}
          </Range>
          <NumberField
            modelValue={props.chart.radarRings}
            label="rings"
            min={1}
            max={10}
            onUpdateModelValue={(v) => (props.chart.radarRings = v)}
          />
        </Show>
        <Show when={props.chart.type === "pie"}>
          <Range
            label="start"
            name="pie-start"
            min={0}
            max={359}
            step={1}
            value={props.chart.startAngle}
            set={(v) => (props.chart.startAngle = v)}
          >
            {props.chart.startAngle}°
          </Range>
        </Show>
        <Range
          label="dim"
          name="dim-opacity"
          min={0}
          max={1}
          step={0.05}
          value={props.chart.dimOpacity}
          set={(v) => (props.chart.dimOpacity = v)}
        >
          {props.chart.dimOpacity.toFixed(2)}
        </Range>
        <Show when={props.chart.hoverLift}>
          <Range
            label="hover"
            name="hover-strength"
            min={0}
            max={2}
            step={0.1}
            value={props.chart.hoverStrength}
            set={(v) => (props.chart.hoverStrength = v)}
          >
            {props.chart.hoverStrength.toFixed(1)}×
          </Range>
        </Show>
        <div class="flex gap-4">
          <Show when={fam() === "cartesian"}>
            <Toggle
              modelValue={props.chart.interactive}
              label="interactive"
              onUpdateModelValue={(v) => (props.chart.interactive = v)}
            />
            <Toggle
              modelValue={props.chart.crosshair}
              label="crosshair"
              onUpdateModelValue={(v) => (props.chart.crosshair = v)}
            />
          </Show>
        </div>
      </section>

      <section class="flex flex-col gap-3">
        <p class="micro text-muted-foreground">Animation</p>
        {/* A field with a unit takes a row: a pair's half is too narrow for "4000 ms". */}
        <NumberField
          modelValue={props.chart.animationDuration}
          label="time"
          unit="ms"
          min={0}
          max={4000}
          step={50}
          onUpdateModelValue={(v) => (props.chart.animationDuration = v)}
        />
        <NumberField
          modelValue={props.chart.animationDelay}
          label="delay"
          unit="ms"
          min={0}
          max={4000}
          step={50}
          onUpdateModelValue={(v) => (props.chart.animationDelay = v)}
        />
        <Segmented
          modelValue={easingChoice()}
          options={EASING_CHOICES}
          label="easing"
          onUpdateModelValue={setEasingChoice}
        />
        <Show when={easingChoice() === "custom"}>
          <BezierEditor
            modelValue={bezierPoints()}
            onUpdateModelValue={(v) => (props.chart.easing = [v[0], v[1], v[2], v[3]])}
          />
        </Show>
        <Show when={props.chart.type === "bar"}>
          <Range
            label="stagger"
            name="bar-stagger"
            min={0}
            max={0.9}
            step={0.05}
            value={props.chart.stagger}
            set={(v) => (props.chart.stagger = v)}
          >
            {props.chart.stagger.toFixed(2)}
          </Range>
        </Show>
        <div class="flex flex-wrap gap-x-4 gap-y-2 pt-0.5">
          <Toggle
            modelValue={props.chart.animate}
            label="animate"
            onUpdateModelValue={(v) => (props.chart.animate = v)}
          />
          <Toggle
            modelValue={props.chart.hoverLift}
            label="hover lift"
            onUpdateModelValue={(v) => (props.chart.hoverLift = v)}
          />
          <Show when={lined()}>
            <Toggle
              modelValue={props.chart.sparkles}
              label="sparkles"
              onUpdateModelValue={(v) => (props.chart.sparkles = v)}
            />
          </Show>
        </div>
        <Show when={lined() && props.chart.sparkles}>
          <Range
            label="stars"
            name="sparkle-density"
            min={0.2}
            max={3}
            step={0.1}
            value={props.chart.sparkleDensity}
            set={(v) => (props.chart.sparkleDensity = v)}
          >
            {props.chart.sparkleDensity.toFixed(1)}×
          </Range>
          <Range
            label="wink"
            name="sparkle-speed"
            min={0.2}
            max={3}
            step={0.1}
            value={props.chart.sparkleSpeed}
            set={(v) => (props.chart.sparkleSpeed = v)}
          >
            {props.chart.sparkleSpeed.toFixed(1)}×
          </Range>
        </Show>
        <div class="flex flex-wrap gap-x-4 gap-y-2">
          <button type="button" class={REPLAY_KEY} onClick={() => replay()}>
            <svg viewBox="0 0 24 24" class="size-3" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            Replay
          </button>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <p class="micro text-muted-foreground">Seed</p>
        <p class="text-[10px] leading-relaxed text-muted-foreground">
          One integer derives texture, motion, geometry and glow. Explicit controls above always win.
        </p>
        <div class="flex items-center gap-2">
          <span class="prop-name text-[11px] text-muted-foreground">master</span>
          <button type="button" class={ROLL_KEY} onClick={rollSeed}>
            Roll
          </button>
          <span class="flex-1 truncate text-[11px] tabular-nums text-foreground">{props.chart.seed ?? "off"}</span>
          <Show when={props.chart.seed !== undefined}>
            <button type="button" class={CLEAR_KEY} onClick={clearSeed}>
              clear
            </button>
          </Show>
        </div>
        <Show when={lined()}>
          <div class="flex items-center gap-2">
            <span class="prop-name text-[11px] text-muted-foreground">motion</span>
            <button type="button" class={ROLL_KEY} onClick={rollEffect}>
              Roll
            </button>
            <span class="flex-1 truncate text-[11px] tabular-nums text-foreground">{props.chart.effect ?? "seed"}</span>
            <Show when={props.chart.effect !== undefined}>
              <button type="button" class={CLEAR_KEY} onClick={clearEffect}>
                clear
              </button>
            </Show>
          </div>
        </Show>
      </section>

      <Show when={fam() === "cartesian"}>
        <section>
          <p class="mb-2 micro text-muted-foreground">Margins</p>
          <div class="prop-pairs">
            <NumberField
              modelValue={props.chart.margins.top}
              label="top"
              min={0}
              onUpdateModelValue={(v) => (props.chart.margins.top = v)}
            />
            <NumberField
              modelValue={props.chart.margins.right}
              label="right"
              min={0}
              onUpdateModelValue={(v) => (props.chart.margins.right = v)}
            />
            <NumberField
              modelValue={props.chart.margins.bottom}
              label="bottom"
              min={0}
              onUpdateModelValue={(v) => (props.chart.margins.bottom = v)}
            />
            <NumberField
              modelValue={props.chart.margins.left}
              label="left"
              min={0}
              onUpdateModelValue={(v) => (props.chart.margins.left = v)}
            />
          </div>
        </section>
      </Show>
    </>
  )
}
