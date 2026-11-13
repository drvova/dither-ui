import { createMemo, createSignal, For, type JSX, Match, Show, Switch } from "solid-js"
import { colorToHex, DitherIcon, patternFromImage, type VariantInput } from "@dither-ui/kit"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import type { ChartModel } from "@/entities/chart"
import {
  addCell,
  addScreenRow,
  COMPONENT_REGISTRY,
  componentEntry,
  findCell,
  findRow,
  moveCell,
  moveScreenRow,
  removeCell,
  removeScreenRow,
  type ScreenRow,
} from "@/entities/widget"
import { CHART_TYPES, EASING_NAMES, familyOf, STACKS } from "@/shared/config"
import {
  editor,
  replay,
  selectedArtboard,
  selectedChart,
  selectedLayers,
  selectLayer,
  setSelectedType,
} from "@/entities/editor"
import { BezierEditor, BloomField, ColorField, NumberField, Segmented, TextureField, Toggle } from "@/shared/ui"
import AvatarDrawGrid from "./AvatarDrawGrid"
import ComponentPropsPanel from "./ComponentPropsPanel"
import ReelPanel from "./ReelPanel"

const ROW = "flex items-center gap-2 text-[11px] text-muted-foreground"
const FIELD =
  "w-full rounded-md border border-edge bg-background/60 px-2 py-1 text-xs text-foreground outline-none focus:border-ring"
const KEY =
  "rounded border border-border min-h-6 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
const DELETE_KEY =
  "ml-auto rounded border border-border min-h-6 px-2 py-0.5 text-[11px] text-destructive transition-colors hover:bg-red-500/10"
const MOVE_KEY =
  "flex min-h-6 items-center gap-1.5 rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
const REPLAY_KEY =
  "flex items-center gap-1 rounded border border-border min-h-6 px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
const ROLL_KEY =
  "rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
const CLEAR_KEY =
  "rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"

/** A named text field of the panel: the name in the column, the model
 * written as it is typed. */
function Text(props: {
  label: string
  name: string
  value: string
  set: (value: string) => void
  placeholder?: string
  onChange?: () => void
}) {
  return (
    <label class={ROW}>
      <span class="prop-name">{props.label}</span>
      <input
        value={props.value}
        type="text"
        name={props.name}
        autocomplete="off"
        placeholder={props.placeholder}
        class={FIELD}
        onInput={(e) => props.set(e.currentTarget.value)}
        onChange={() => props.onChange?.()}
      />
    </label>
  )
}

/** A named slider of the panel: the name in the column, the model written
 * as a number as it moves, its reading (the children) beside it. */
function Range(props: {
  label: string
  name: string
  min: number
  max: number
  step: number
  value: number
  set: (value: number) => void
  onInput?: () => void
  children: JSX.Element
}) {
  return (
    <label class={ROW}>
      <span class="prop-name">{props.label}</span>
      <input
        type="range"
        name={props.name}
        min={props.min}
        max={props.max}
        step={props.step}
        // after its range: a value set first is held to the default 0..100 by 1
        value={props.value}
        class="h-6 flex-1 accent-foreground"
        onInput={(e) => {
          const n = parseFloat(e.currentTarget.value)
          if (!Number.isNaN(n)) props.set(n)
          props.onInput?.()
        }}
      />
      <span class="w-8 tabular-nums text-foreground">{props.children}</span>
    </label>
  )
}

// Easing: three presets + "custom" which opens the bezier curve editor,
// seeded from the preset's equivalent curve so the switch is seamless.
const EASING_CHOICES = [...EASING_NAMES, "custom"] as const
const DOT_VARIANTS = ["border", "colored-border", "filled"] as const
const SEED_BEZIER: Record<string, [number, number, number, number]> = {
  linear: [0.25, 0.25, 0.75, 0.75],
  "ease-out": [0.33, 1, 0.68, 1],
  "ease-in-out": [0.65, 0, 0.35, 1],
}
const ROW_ALIGNS = ["start", "center", "end", "stretch"] as const
const ROW_JUSTIFY = ["start", "center", "end", "between"] as const
const MIRRORS = ["auto", "horizontal", "vertical"] as const
const AVATAR_SOURCES = ["seed", "draw", "image"] as const
const BUTTON_VARIANTS = ["gradient", "dotted", "hatched", "solid"] as const
const GRAD_DIRS = ["up", "down", "left", "right"] as const
const LEGEND_ALIGNS = ["left", "center", "right"] as const
const TOOLTIP_VARIANTS = ["default", "frosted-glass"] as const
/** PixelColor may be a legacy hue number — coerce for the ColorField. */
const asFieldColor = (c: unknown) =>
  (typeof c === "number" ? colorToHex(c) : c) as Parameters<typeof colorToHex>[0] & string

export default function Inspector() {
  const ab = () => selectedArtboard.value
  const chart = () => selectedChart.value
  const layer = createMemo(() => selectedLayers.value.find((l) => l.id === editor.selectedLayerId))
  const kind = createMemo(() => layer()?.kind ?? "root")
  const fam = createMemo(() => {
    const c = chart()
    return c ? familyOf(c.type) : "cartesian"
  })
  const series = createMemo(() => {
    const key = layer()?.seriesKey
    return key ? chart()?.series.find((s) => s.key === key) : undefined
  })

  const locked = createMemo(() => {
    const c = chart()
    const a = ab()
    if (!c || !a) return false
    switch (kind()) {
      case "root":
        return a.locked
      case "series":
        return series()?.locked ?? false
      case "grid":
        return c.grid.locked
      case "xAxis":
        return c.xAxis.locked
      case "yAxis":
        return c.yAxis.locked
      case "legend":
        return c.legend.locked
      case "tooltip":
        return c.tooltip.locked
      default:
        return false
    }
  })
  function unlock() {
    const c = chart()
    const a = ab()
    if (!c || !a) return
    switch (kind()) {
      case "root":
        a.locked = false
        break
      case "series": {
        const s = series()
        if (s) s.locked = false
        break
      }
      case "grid":
        c.grid.locked = false
        break
      case "xAxis":
        c.xAxis.locked = false
        break
      case "yAxis":
        c.yAxis.locked = false
        break
      case "legend":
        c.legend.locked = false
        break
      case "tooltip":
        c.tooltip.locked = false
        break
    }
  }

  // Seed controls — one integer derives texture, motion, geometry and glow; the
  // effect seed pins the generative live-edge motion independently.
  const rollSeed = () => {
    const c = chart()
    if (c) c.seed = Math.floor(Math.random() * 1_000_000)
  }
  const clearSeed = () => {
    const c = chart()
    if (c) c.seed = undefined
  }
  const rollEffect = () => {
    const c = chart()
    if (c) c.effect = Math.floor(Math.random() * 1_000_000)
  }
  const clearEffect = () => {
    const c = chart()
    if (c) c.effect = undefined
  }
  const easingChoice = createMemo<string>(() => {
    const e = chart()?.easing ?? "ease-in-out"
    return typeof e === "string" ? e : "custom"
  })
  const bezierPoints = createMemo<[number, number, number, number]>(() => {
    const e = chart()?.easing
    return typeof e === "object" && e ? [e[0], e[1], e[2], e[3]] : SEED_BEZIER["ease-in-out"]
  })
  function setEasingChoice(v: string | number) {
    const c = chart()
    if (!c) return
    if (v === "custom") {
      const seed = SEED_BEZIER[easingChoice()] ?? SEED_BEZIER["ease-in-out"]
      c.easing = [seed[0], seed[1], seed[2], seed[3]]
    } else {
      c.easing = v as (typeof EASING_NAMES)[number]
    }
  }

  // Widget frames (avatar / button / gradient) — typed accessors per kind.
  const widget = () => ab()?.widget
  const avatar = createMemo(() => {
    const w = widget()
    return w?.kind === "avatar" ? w : null
  })
  const button = createMemo(() => {
    const w = widget()
    return w?.kind === "button" ? w : null
  })
  const gradient = createMemo(() => {
    const w = widget()
    return w?.kind === "gradient" ? w : null
  })
  const image = createMemo(() => {
    const w = widget()
    return w?.kind === "image" ? w : null
  })
  const component = createMemo(() => {
    const w = widget()
    return w?.kind === "component" ? w : null
  })
  const reel = createMemo(() => {
    const w = widget()
    return w?.kind === "reel" ? w : null
  })
  const componentSpec = createMemo(() => {
    const c = component()
    return c ? componentEntry(c.is) : undefined
  })

  // Screen frames: nested row/cell selection parsed from the layer id.
  const screen = createMemo(() => {
    const w = widget()
    return w?.kind === "screen" ? w : null
  })
  const screenSel = createMemo(() => {
    const s = screen()
    if (!s) return null
    const id = editor.selectedLayerId
    const rowMatch = id.match(/:row:(.+)$/)
    if (rowMatch) return { kind: "row" as const, row: findRow(s, rowMatch[1]) }
    const cellMatch = id.match(/:cell:(.+)$/)
    if (cellMatch) {
      const hit = findCell(s, cellMatch[1])
      return hit ? { kind: "cell" as const, ...hit } : null
    }
    return null
  })
  const cellSel = createMemo(() => {
    const sel = screenSel()
    return sel?.kind === "cell" ? sel : null
  })
  const rowSel = createMemo(() => {
    const sel = screenSel()
    return sel?.kind === "row" ? (sel.row ?? null) : null
  })
  function addCellFromPicker(row: ScreenRow, e: Event) {
    const is = (e.target as HTMLSelectElement).value
    const entry = componentEntry(is)
    if (entry) {
      const cell = addCell(row, entry)
      selectLayer(`${editor.selectedArtboardId}:cell:${cell.id}`)
    }
    ;(e.target as HTMLSelectElement).value = ""
  }
  let avatarFileInput: HTMLInputElement | undefined
  const [avatarImageError, setAvatarImageError] = createSignal(false)

  function setAvatarSource(v: string | number) {
    const a = avatar()
    if (!a) return
    a.source = v as (typeof AVATAR_SOURCES)[number]
    if (v === "seed") a.pattern = null
    if (v === "image" && a.imageSrc) deriveAvatarImage()
  }

  /** Dither the image into the grid; keeps the previous pattern on failure. */
  async function deriveAvatarImage() {
    const a = avatar()
    if (!a || a.source !== "image" || !a.imageSrc) return
    const result = await patternFromImage(a.imageSrc, a.grid, a.imageThreshold, a.imageInvert)
    setAvatarImageError(!result)
    if (result) {
      a.pattern = {
        on: result.on.map((b) => (b ? 1 : 0)),
        density: result.density.map((d) => Math.round(d * 100) / 100),
      }
    }
  }
  function setAvatarInvert(invert: boolean) {
    const a = avatar()
    if (!a) return
    a.imageInvert = invert
    deriveAvatarImage()
  }
  async function onAvatarFile(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file && avatar()) {
      // Data URI (not object URL) so the image survives save/reload/export.
      const reader = new FileReader()
      reader.onload = () => {
        const a = avatar()
        if (a && typeof reader.result === "string") {
          a.imageSrc = reader.result
          deriveAvatarImage()
        }
      }
      reader.readAsDataURL(file)
    }
    input.value = ""
  }

  const pieVariant = createMemo<VariantInput>(() => chart()?.series[0]?.variant ?? "gradient")
  function setPieVariant(v: VariantInput) {
    chart()?.series.forEach((s) => (s.variant = v))
  }

  // Inside the panel a frame is selected: these read it as there.
  const A = () => ab()!
  const C = () => chart()!
  const S = () => series()!
  const av = () => avatar()!
  const btn = () => button()!
  const grad = () => gradient()!
  const img = () => image()!
  const scr = () => screen()!
  const cell = () => cellSel()!
  const row = () => rowSel()!
  const lined = () => C().type === "area" || C().type === "line"

  return (
    <Show
      when={chart() && ab()}
      fallback={
        <div class="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
          Select an artboard to edit its properties.
        </div>
      }
    >
      <div class="flex h-full flex-col">
        <div class="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border/60 px-3">
          <span class="truncate text-[13px] font-medium text-foreground">
            {A().widget ? A().name : (layer()?.label ?? "Inspector")}
          </span>
          <span class="shrink-0 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
            {A().widget?.kind ?? kind()}
          </span>
        </div>
        <Show when={locked()}>
          <div class="mx-4 mt-3 flex items-center justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground">
            <span class="flex items-center gap-1.5">
              <svg
                viewBox="0 0 24 24"
                class="size-3.5 text-foreground"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Locked
            </span>
            <button
              type="button"
              class="rounded border border-border px-1.5 py-0.5 text-foreground transition-colors hover:bg-background"
              onClick={unlock}
            >
              Unlock
            </button>
          </div>
        </Show>
        <div
          class={cn(
            "flex flex-col gap-5 overflow-y-auto p-4",
            locked() ? "pointer-events-none select-none opacity-50" : "",
          )}
        >
          <Switch>
            {/* ROOT / FRAME */}
            <Match when={kind() === "root"}>
              <Text label="name" name="artboard-name" value={A().name} set={(v) => (A().name = v)} />
              <div class="prop-pairs">
                <NumberField modelValue={A().x} label="X" onUpdateModelValue={(v) => (A().x = v)} />
                <NumberField modelValue={A().y} label="Y" onUpdateModelValue={(v) => (A().y = v)} />
                <NumberField modelValue={A().w} label="W" min={260} onUpdateModelValue={(v) => (A().w = v)} />
                <NumberField modelValue={A().h} label="H" min={200} onUpdateModelValue={(v) => (A().h = v)} />
              </div>

              <Show when={!A().widget}>
                <section>
                  <p class="mb-2 micro text-muted-foreground">Type</p>
                  <div class="flex flex-wrap gap-0.5 rounded-md border border-border bg-background/60 p-0.5">
                    <For each={CHART_TYPES}>
                      {(t) => (
                        <button
                          type="button"
                          class={cn(
                            "min-h-6 rounded-[5px] px-2.5 text-xs capitalize leading-none transition-colors",
                            C().type === t ? "ring-on" : "text-muted-foreground hover:text-foreground",
                          )}
                          aria-pressed={C().type === t}
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
                    modelValue={C().bloom}
                    onUpdateModelValue={(v) => (C().bloom = v as ChartModel["bloom"])}
                  />
                  <Show when={fam() === "cartesian"}>
                    <Segmented
                      modelValue={C().stackType}
                      options={STACKS}
                      label="stack"
                      onUpdateModelValue={(v) => (C().stackType = v)}
                    />
                  </Show>
                  <Show when={C().type === "pie"}>
                    <Range
                      label="radius"
                      name="pie-radius"
                      min={0}
                      max={0.85}
                      step={0.05}
                      value={C().innerRadius}
                      set={(v) => (C().innerRadius = v)}
                    >
                      {C().innerRadius.toFixed(2)}
                    </Range>
                  </Show>
                  <Range
                    label="pixel"
                    name="cell"
                    min={1}
                    max={6}
                    step={1}
                    value={C().cell}
                    set={(v) => (C().cell = v)}
                  >
                    {C().cell}px
                  </Range>
                  <Show when={C().type === "bar"}>
                    <Range
                      label="bar gap"
                      name="bar-gap"
                      min={0}
                      max={0.7}
                      step={0.02}
                      value={C().barGap}
                      set={(v) => (C().barGap = v)}
                    >
                      {C().barGap.toFixed(2)}
                    </Range>
                    <Range
                      label="edge"
                      name="bar-edge"
                      min={0}
                      max={1}
                      step={0.02}
                      value={C().barEdge}
                      set={(v) => (C().barEdge = v)}
                    >
                      {C().barEdge.toFixed(2)}
                    </Range>
                  </Show>
                  <Show when={C().type === "line"}>
                    <Range
                      label="glow"
                      name="glow-size"
                      min={0.05}
                      max={0.4}
                      step={0.01}
                      value={C().glowSize}
                      set={(v) => (C().glowSize = v)}
                    >
                      {C().glowSize.toFixed(2)}
                    </Range>
                  </Show>
                  <Show when={C().type === "pie"}>
                    <Range
                      label="pop"
                      name="pie-pop"
                      min={0}
                      max={20}
                      step={1}
                      value={C().popOut}
                      set={(v) => (C().popOut = v)}
                    >
                      {C().popOut}px
                    </Range>
                    <Range
                      label="rim"
                      name="pie-rim"
                      min={0}
                      max={5}
                      step={0.2}
                      value={C().rimWidth}
                      set={(v) => (C().rimWidth = v)}
                    >
                      {C().rimWidth.toFixed(1)}
                    </Range>
                  </Show>
                  <Show when={C().type === "radar"}>
                    <Range
                      label="falloff"
                      name="radar-falloff"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={C().falloff}
                      set={(v) => (C().falloff = v)}
                    >
                      {C().falloff.toFixed(2)}
                    </Range>
                    <NumberField
                      modelValue={C().radarRings}
                      label="rings"
                      min={1}
                      max={10}
                      onUpdateModelValue={(v) => (C().radarRings = v)}
                    />
                  </Show>
                  <Show when={C().type === "pie"}>
                    <Range
                      label="start"
                      name="pie-start"
                      min={0}
                      max={359}
                      step={1}
                      value={C().startAngle}
                      set={(v) => (C().startAngle = v)}
                    >
                      {C().startAngle}°
                    </Range>
                  </Show>
                  <Range
                    label="dim"
                    name="dim-opacity"
                    min={0}
                    max={1}
                    step={0.05}
                    value={C().dimOpacity}
                    set={(v) => (C().dimOpacity = v)}
                  >
                    {C().dimOpacity.toFixed(2)}
                  </Range>
                  <Show when={C().hoverLift}>
                    <Range
                      label="hover"
                      name="hover-strength"
                      min={0}
                      max={2}
                      step={0.1}
                      value={C().hoverStrength}
                      set={(v) => (C().hoverStrength = v)}
                    >
                      {C().hoverStrength.toFixed(1)}×
                    </Range>
                  </Show>
                  <div class="flex gap-4">
                    <Show when={fam() === "cartesian"}>
                      <Toggle
                        modelValue={C().interactive}
                        label="interactive"
                        onUpdateModelValue={(v) => (C().interactive = v)}
                      />
                      <Toggle
                        modelValue={C().crosshair}
                        label="crosshair"
                        onUpdateModelValue={(v) => (C().crosshair = v)}
                      />
                    </Show>
                  </div>
                </section>

                <section class="flex flex-col gap-3">
                  <p class="micro text-muted-foreground">Animation</p>
                  {/* A field with a unit takes a row: a pair's half is too narrow for "4000 ms". */}
                  <NumberField
                    modelValue={C().animationDuration}
                    label="time"
                    unit="ms"
                    min={0}
                    max={4000}
                    step={50}
                    onUpdateModelValue={(v) => (C().animationDuration = v)}
                  />
                  <NumberField
                    modelValue={C().animationDelay}
                    label="delay"
                    unit="ms"
                    min={0}
                    max={4000}
                    step={50}
                    onUpdateModelValue={(v) => (C().animationDelay = v)}
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
                      onUpdateModelValue={(v) => (C().easing = [v[0], v[1], v[2], v[3]])}
                    />
                  </Show>
                  <Show when={C().type === "bar"}>
                    <Range
                      label="stagger"
                      name="bar-stagger"
                      min={0}
                      max={0.9}
                      step={0.05}
                      value={C().stagger}
                      set={(v) => (C().stagger = v)}
                    >
                      {C().stagger.toFixed(2)}
                    </Range>
                  </Show>
                  <div class="flex flex-wrap gap-x-4 gap-y-2 pt-0.5">
                    <Toggle modelValue={C().animate} label="animate" onUpdateModelValue={(v) => (C().animate = v)} />
                    <Toggle
                      modelValue={C().hoverLift}
                      label="hover lift"
                      onUpdateModelValue={(v) => (C().hoverLift = v)}
                    />
                    <Show when={lined()}>
                      <Toggle
                        modelValue={C().sparkles}
                        label="sparkles"
                        onUpdateModelValue={(v) => (C().sparkles = v)}
                      />
                    </Show>
                  </div>
                  <Show when={lined() && C().sparkles}>
                    <Range
                      label="stars"
                      name="sparkle-density"
                      min={0.2}
                      max={3}
                      step={0.1}
                      value={C().sparkleDensity}
                      set={(v) => (C().sparkleDensity = v)}
                    >
                      {C().sparkleDensity.toFixed(1)}×
                    </Range>
                    <Range
                      label="wink"
                      name="sparkle-speed"
                      min={0.2}
                      max={3}
                      step={0.1}
                      value={C().sparkleSpeed}
                      set={(v) => (C().sparkleSpeed = v)}
                    >
                      {C().sparkleSpeed.toFixed(1)}×
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
                    <span class="flex-1 truncate text-[11px] tabular-nums text-foreground">{C().seed ?? "off"}</span>
                    <Show when={C().seed !== undefined}>
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
                      <span class="flex-1 truncate text-[11px] tabular-nums text-foreground">
                        {C().effect ?? "seed"}
                      </span>
                      <Show when={C().effect !== undefined}>
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
                        modelValue={C().margins.top}
                        label="top"
                        min={0}
                        onUpdateModelValue={(v) => (C().margins.top = v)}
                      />
                      <NumberField
                        modelValue={C().margins.right}
                        label="right"
                        min={0}
                        onUpdateModelValue={(v) => (C().margins.right = v)}
                      />
                      <NumberField
                        modelValue={C().margins.bottom}
                        label="bottom"
                        min={0}
                        onUpdateModelValue={(v) => (C().margins.bottom = v)}
                      />
                      <NumberField
                        modelValue={C().margins.left}
                        label="left"
                        min={0}
                        onUpdateModelValue={(v) => (C().margins.left = v)}
                      />
                    </div>
                  </section>
                </Show>
              </Show>

              <Switch>
                {/* AVATAR builder */}
                <Match when={avatar()}>
                  <section class="flex flex-col gap-3">
                    <p class="micro text-muted-foreground">Avatar</p>
                    <Segmented
                      modelValue={av().source ?? "seed"}
                      options={AVATAR_SOURCES}
                      label="source"
                      onUpdateModelValue={setAvatarSource}
                    />
                    <Show when={(av().source ?? "seed") === "seed"}>
                      <Text label="seed" name="avatar-seed" value={av().name} set={(v) => (av().name = v)} />
                    </Show>
                    <Show when={av().source === "draw"}>
                      <AvatarDrawGrid avatar={av()} />
                    </Show>
                    <Show when={av().source === "image"}>
                      <Text
                        label="src"
                        name="avatar-image-src"
                        value={av().imageSrc ?? ""}
                        set={(v) => (av().imageSrc = v)}
                        placeholder="https://…"
                        onChange={deriveAvatarImage}
                      />
                      <div class="flex items-center gap-2">
                        <button type="button" class={KEY} onClick={() => avatarFileInput?.click()}>
                          upload…
                        </button>
                        <input
                          ref={(el) => (avatarFileInput = el)}
                          type="file"
                          accept="image/*"
                          name="avatar-image-file"
                          class="hidden"
                          onChange={onAvatarFile}
                        />
                        <Show when={avatarImageError()}>
                          <span class="text-[10px] text-destructive">couldn't read that image</span>
                        </Show>
                      </div>
                      <Range
                        label="cutoff"
                        name="avatar-threshold"
                        min={0.1}
                        max={0.9}
                        step={0.05}
                        value={av().imageThreshold}
                        set={(v) => (av().imageThreshold = v)}
                        onInput={deriveAvatarImage}
                      >
                        {av().imageThreshold.toFixed(2)}
                      </Range>
                      <Toggle
                        modelValue={av().imageInvert}
                        label="invert (dark images)"
                        onUpdateModelValue={setAvatarInvert}
                      />
                    </Show>
                    <Segmented
                      modelValue={av().mirror}
                      options={MIRRORS}
                      label="mirror"
                      onUpdateModelValue={(v) => (av().mirror = v)}
                    />
                    <Range
                      label="grid"
                      name="avatar-grid"
                      min={4}
                      max={16}
                      step={2}
                      value={av().grid}
                      set={(v) => (av().grid = v)}
                    >
                      {av().grid}×{av().grid}
                    </Range>
                    <Range
                      label="cell res"
                      name="avatar-cellpx"
                      min={1}
                      max={8}
                      step={1}
                      value={av().cellPx}
                      set={(v) => (av().cellPx = v)}
                    >
                      {av().cellPx}px
                    </Range>
                    <Range
                      label="density"
                      name="avatar-density"
                      min={-0.5}
                      max={0.5}
                      step={0.05}
                      value={av().density}
                      set={(v) => (av().density = v)}
                    >
                      {av().density.toFixed(2)}
                    </Range>
                    <Range
                      label="off tier"
                      name="avatar-offtier"
                      min={0}
                      max={1}
                      step={0.05}
                      value={av().offTier}
                      set={(v) => (av().offTier = v)}
                    >
                      {av().offTier.toFixed(2)}
                    </Range>
                  </section>
                  <section class="flex flex-col gap-3">
                    <p class="micro text-muted-foreground">Colour</p>
                    <Toggle
                      modelValue={av().autoColor}
                      label="derive from seed"
                      onUpdateModelValue={(v) => (av().autoColor = v)}
                    />
                    <Show when={!av().autoColor}>
                      <ColorField modelValue={asFieldColor(av().color)} onUpdateModelValue={(v) => (av().color = v)} />
                    </Show>
                    <BloomField modelValue={av().bloom} onUpdateModelValue={(v) => (av().bloom = v)} />
                  </section>
                  <section class="flex flex-col gap-3">
                    <p class="micro text-muted-foreground">Animation</p>
                    <NumberField
                      modelValue={av().animationDuration}
                      label="time"
                      unit="ms"
                      min={0}
                      max={4000}
                      step={50}
                      onUpdateModelValue={(v) => (av().animationDuration = v)}
                    />
                    <div class="flex gap-4">
                      <Toggle
                        modelValue={av().animate}
                        label="animate"
                        onUpdateModelValue={(v) => (av().animate = v)}
                      />
                      <button type="button" class={REPLAY_KEY} onClick={() => replay()}>
                        Replay
                      </button>
                    </div>
                  </section>
                </Match>

                {/* BUTTON builder */}
                <Match when={button()}>
                  <section class="flex flex-col gap-3">
                    <p class="micro text-muted-foreground">Button</p>
                    <Text label="label" name="button-label" value={btn().label} set={(v) => (btn().label = v)} />
                    <Segmented
                      modelValue={btn().variant}
                      options={BUTTON_VARIANTS}
                      label="variant"
                      onUpdateModelValue={(v) => (btn().variant = v)}
                    />
                    <Range
                      label="pixel"
                      name="button-cell"
                      min={1}
                      max={6}
                      step={1}
                      value={btn().cell}
                      set={(v) => (btn().cell = v)}
                    >
                      {btn().cell}px
                    </Range>
                    <div class="text-[11px] text-muted-foreground">
                      <span class="mb-1 block">colour</span>
                      <ColorField
                        modelValue={asFieldColor(btn().color)}
                        onUpdateModelValue={(v) => (btn().color = v)}
                      />
                    </div>
                    <BloomField modelValue={btn().bloom} onUpdateModelValue={(v) => (btn().bloom = v)} />
                  </section>
                </Match>

                {/* REGISTRY COMPONENT — generic panel rendered from the spec */}
                <Match when={component() && componentSpec()}>
                  <section class="flex flex-col gap-3">
                    <p class="micro text-muted-foreground">{componentSpec()!.label}</p>
                    <ComponentPropsPanel entry={componentSpec()!} target={component()!} />
                  </section>
                </Match>

                {/* SCREEN: cell selected */}
                <Match when={screen() && cellSel()}>
                  <section class="flex flex-col gap-3">
                    <p class="micro text-muted-foreground">{componentEntry(cell().cell.is)?.label ?? cell().cell.is}</p>
                    <Show when={componentEntry(cell().cell.is)}>
                      <ComponentPropsPanel entry={componentEntry(cell().cell.is)!} target={cell().cell} />
                    </Show>
                    <Toggle
                      modelValue={cell().cell.grow}
                      label="grow (fill row)"
                      onUpdateModelValue={(v) => (cell().cell.grow = v)}
                    />
                    <div class="flex gap-1.5 pt-1">
                      <button type="button" class={MOVE_KEY} onClick={() => moveCell(cell().row, cell().cell.id, -1)}>
                        <DitherIcon name="ArrowLeft" size={12} strokeWidth={1.5} />
                        Move left
                      </button>
                      <button type="button" class={MOVE_KEY} onClick={() => moveCell(cell().row, cell().cell.id, 1)}>
                        <DitherIcon name="ArrowRight" size={12} strokeWidth={1.5} />
                        Move right
                      </button>
                      <button type="button" class={DELETE_KEY} onClick={() => removeCell(scr(), cell().cell.id)}>
                        delete
                      </button>
                    </div>
                  </section>
                </Match>

                {/* SCREEN: row selected */}
                <Match when={screen() && rowSel()}>
                  <section class="flex flex-col gap-3">
                    <p class="micro text-muted-foreground">Row</p>
                    <Segmented
                      modelValue={row().align}
                      options={ROW_ALIGNS}
                      label="align"
                      onUpdateModelValue={(v) => (row().align = v)}
                    />
                    <Segmented
                      modelValue={row().justify}
                      options={ROW_JUSTIFY}
                      label="justify"
                      onUpdateModelValue={(v) => (row().justify = v)}
                    />
                    <NumberField
                      modelValue={row().gap}
                      label="gap"
                      min={0}
                      max={64}
                      onUpdateModelValue={(v) => (row().gap = v)}
                    />
                    <label class={ROW}>
                      <span class="prop-name">add</span>
                      <select name="add-cell" class={FIELD} onChange={(e) => addCellFromPicker(row(), e)}>
                        <option value="">component…</option>
                        <For each={COMPONENT_REGISTRY}>{(c) => <option value={c.is}>{c.label}</option>}</For>
                      </select>
                    </label>
                    <div class="flex gap-1.5 pt-1">
                      <button type="button" class={KEY} onClick={() => moveScreenRow(scr(), row().id, -1)}>
                        ↑ move
                      </button>
                      <button type="button" class={KEY} onClick={() => moveScreenRow(scr(), row().id, 1)}>
                        move ↓
                      </button>
                      <button type="button" class={DELETE_KEY} onClick={() => removeScreenRow(scr(), row().id)}>
                        delete
                      </button>
                    </div>
                  </section>
                </Match>

                {/* SCREEN: frame root */}
                <Match when={screen()}>
                  <section class="flex flex-col gap-3">
                    <p class="micro text-muted-foreground">Screen</p>
                    <NumberField
                      modelValue={scr().gap}
                      label="row gap"
                      min={0}
                      max={64}
                      onUpdateModelValue={(v) => (scr().gap = v)}
                    />
                    <NumberField
                      modelValue={scr().padding}
                      label="padding"
                      min={0}
                      max={64}
                      onUpdateModelValue={(v) => (scr().padding = v)}
                    />
                    <button type="button" class={cn("self-start", KEY)} onClick={() => addScreenRow(scr())}>
                      + row
                    </button>
                  </section>
                </Match>

                {/* IMAGE builder */}
                <Match when={image()}>
                  <section class="flex flex-col gap-3">
                    <p class="micro text-muted-foreground">Image</p>
                    <Text
                      label="src"
                      name="image-src"
                      value={img().src}
                      set={(v) => (img().src = v)}
                      placeholder="https://…"
                    />
                    <Text label="alt" name="image-alt" value={img().alt} set={(v) => (img().alt = v)} />
                    <Range
                      label="pixel"
                      name="image-cell"
                      min={1}
                      max={8}
                      step={1}
                      value={img().cell}
                      set={(v) => (img().cell = v)}
                    >
                      {img().cell}px
                    </Range>
                    <Range
                      label="focus"
                      name="image-focus"
                      min={0}
                      max={1}
                      step={0.05}
                      value={img().focusY}
                      set={(v) => (img().focusY = v)}
                    >
                      {img().focusY.toFixed(2)}
                    </Range>
                    <Range
                      label="fade"
                      name="image-fade"
                      min={0}
                      max={80}
                      step={2}
                      value={img().fade}
                      set={(v) => (img().fade = v)}
                    >
                      {img().fade}px
                    </Range>
                  </section>
                </Match>

                {/* GRADIENT builder */}
                <Match when={gradient()}>
                  <section class="flex flex-col gap-3">
                    <p class="micro text-muted-foreground">Gradient</p>
                    <Segmented
                      modelValue={grad().direction}
                      options={GRAD_DIRS}
                      label="direction"
                      onUpdateModelValue={(v) => (grad().direction = v)}
                    />
                    <Range
                      label="pixel"
                      name="gradient-cell"
                      min={1}
                      max={8}
                      step={1}
                      value={grad().cell}
                      set={(v) => (grad().cell = v)}
                    >
                      {grad().cell}px
                    </Range>
                    <Range
                      label="opacity"
                      name="gradient-opacity"
                      min={0}
                      max={1}
                      step={0.05}
                      value={grad().opacity}
                      set={(v) => (grad().opacity = v)}
                    >
                      {grad().opacity.toFixed(2)}
                    </Range>
                    <div class="text-[11px] text-muted-foreground">
                      <span class="mb-1 block">from</span>
                      <ColorField
                        modelValue={asFieldColor(grad().from)}
                        onUpdateModelValue={(v) => (grad().from = v)}
                      />
                    </div>
                    <Toggle
                      modelValue={grad().twoTone}
                      label="two-tone (blend into a colour)"
                      onUpdateModelValue={(v) => (grad().twoTone = v)}
                    />
                    <Show when={grad().twoTone}>
                      <div class="text-[11px] text-muted-foreground">
                        <span class="mb-1 block">to</span>
                        <ColorField modelValue={asFieldColor(grad().to)} onUpdateModelValue={(v) => (grad().to = v)} />
                      </div>
                    </Show>
                    <BloomField modelValue={grad().bloom} onUpdateModelValue={(v) => (grad().bloom = v)} />
                  </section>
                </Match>

                {/* REEL: the cut */}
                <Match when={reel()}>
                  <ReelPanel reel={reel()!} artboardId={A().id} />
                </Match>
              </Switch>
            </Match>

            {/* SERIES / SLICE */}
            <Match when={kind() === "series" && series()}>
              <Text label="label" name="series-label" value={S().label} set={(v) => (S().label = v)} />
              <div class="text-[11px] text-muted-foreground">
                <span class="mb-1 block">color</span>
                <ColorField modelValue={S().color} onUpdateModelValue={(v) => (S().color = v)} />
              </div>
              <Show when={C().type !== "line"}>
                <TextureField modelValue={S().variant} onUpdateModelValue={(v) => (S().variant = v)} />
              </Show>
              <Show when={fam() === "cartesian"}>
                <Range
                  label="opacity"
                  name="series-opacity"
                  min={0}
                  max={1}
                  step={0.05}
                  value={S().opacity}
                  set={(v) => (S().opacity = v)}
                >
                  {S().opacity.toFixed(2)}
                </Range>
              </Show>
              <div class="flex gap-4 pt-0.5">
                <Toggle modelValue={S().on} label="visible" onUpdateModelValue={(v) => (S().on = v)} />
                <Toggle
                  modelValue={S().isClickable}
                  label="clickable"
                  onUpdateModelValue={(v) => (S().isClickable = v)}
                />
              </div>

              <Show when={fam() === "cartesian"}>
                <section class="flex flex-col gap-2.5 border-t border-border/60 pt-3">
                  <p class="micro text-muted-foreground">Markers</p>
                  <Toggle
                    modelValue={S().dots.on}
                    label="dots at every point"
                    onUpdateModelValue={(v) => (S().dots.on = v)}
                  />
                  <Show when={S().dots.on}>
                    <Segmented
                      modelValue={S().dots.variant}
                      options={DOT_VARIANTS}
                      label="style"
                      onUpdateModelValue={(v) => (S().dots.variant = v)}
                    />
                    <NumberField
                      modelValue={S().dots.r}
                      label="radius"
                      min={1}
                      max={8}
                      step={0.5}
                      onUpdateModelValue={(v) => (S().dots.r = v)}
                    />
                  </Show>
                  <Toggle
                    modelValue={S().activeDot.on}
                    label="active dot on hover"
                    onUpdateModelValue={(v) => (S().activeDot.on = v)}
                  />
                  <Show when={S().activeDot.on}>
                    <Segmented
                      modelValue={S().activeDot.variant}
                      options={DOT_VARIANTS}
                      label="style"
                      onUpdateModelValue={(v) => (S().activeDot.variant = v)}
                    />
                    <NumberField
                      modelValue={S().activeDot.r}
                      label="radius"
                      min={1}
                      max={10}
                      step={0.5}
                      onUpdateModelValue={(v) => (S().activeDot.r = v)}
                    />
                  </Show>
                </section>
              </Show>
            </Match>

            {/* PIE */}
            <Match when={kind() === "pie"}>
              <TextureField modelValue={pieVariant()} onUpdateModelValue={setPieVariant} />
              <Range
                label="radius"
                name="pie-radius"
                min={0}
                max={0.85}
                step={0.05}
                value={C().innerRadius}
                set={(v) => (C().innerRadius = v)}
              >
                {C().innerRadius.toFixed(2)}
              </Range>
            </Match>

            {/* GRID */}
            <Match when={kind() === "grid"}>
              <div class="flex gap-4">
                <Toggle
                  modelValue={C().grid.horizontal}
                  label="horizontal"
                  onUpdateModelValue={(v) => (C().grid.horizontal = v)}
                />
                <Toggle
                  modelValue={C().grid.vertical}
                  label="vertical"
                  onUpdateModelValue={(v) => (C().grid.vertical = v)}
                />
              </div>
              <Text
                label="dash"
                name="grid-dash"
                value={C().grid.dash}
                set={(v) => (C().grid.dash = v)}
                placeholder="3 3"
              />
              <NumberField
                modelValue={C().grid.tickCount}
                label="lines"
                min={1}
                max={12}
                onUpdateModelValue={(v) => (C().grid.tickCount = v)}
              />
            </Match>

            {/* X AXIS */}
            <Match when={kind() === "xAxis"}>
              <NumberField
                modelValue={C().xAxis.tickMargin}
                label="tick gap"
                min={0}
                onUpdateModelValue={(v) => (C().xAxis.tickMargin = v)}
              />
              <NumberField
                modelValue={C().xAxis.maxTicks}
                label="max ticks"
                min={1}
                max={20}
                onUpdateModelValue={(v) => (C().xAxis.maxTicks = v)}
              />
            </Match>

            {/* Y AXIS */}
            <Match when={kind() === "yAxis"}>
              <NumberField
                modelValue={C().yAxis.tickCount}
                label="ticks"
                min={2}
                max={12}
                onUpdateModelValue={(v) => (C().yAxis.tickCount = v)}
              />
              <NumberField
                modelValue={C().yAxis.tickMargin}
                label="tick gap"
                min={0}
                onUpdateModelValue={(v) => (C().yAxis.tickMargin = v)}
              />
            </Match>

            {/* LEGEND */}
            <Match when={kind() === "legend"}>
              <Segmented
                modelValue={C().legend.align}
                options={LEGEND_ALIGNS}
                label="align"
                onUpdateModelValue={(v) => (C().legend.align = v)}
              />
              <Toggle
                modelValue={C().legend.clickable}
                label="clickable"
                onUpdateModelValue={(v) => (C().legend.clickable = v)}
              />
            </Match>

            {/* TOOLTIP */}
            <Match when={kind() === "tooltip"}>
              <Segmented
                modelValue={C().tooltip.variant}
                options={TOOLTIP_VARIANTS}
                label="variant"
                onUpdateModelValue={(v) => (C().tooltip.variant = v)}
              />
            </Match>
          </Switch>
        </div>
      </div>
    </Show>
  )
}
