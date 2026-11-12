// "Every component, live.": the title beside a line and the docs link, then
// a bento of live kit components, row by row (`BENTO`), each a card of its
// art over its name. The name leads into the docs section; the art is the
// component itself, hands on, in the kit's blue with the ember for a second
// voice. Each card's art prints itself once as it comes into view; of the
// surfaces that move by themselves one plays at a time; everything that
// moves has its pause.
import { createEffect, createMemo, createSignal, For, type JSX, lazy, on, onCleanup, onMount, Show } from "solid-js"
import { createStore } from "solid-js/store"
import {
  Area,
  AreaChart,
  DitherButton,
  DitherDecryptedText,
  DitherGauge,
  DitherGradient,
  DitherIcon,
  DitherKnob,
  DitherNumberFlow,
  DitherReveal,
  DitherScreen,
  DitherSilk,
  DitherSlideAction,
  DitherWorld,
  SCREEN_KINDS,
  Sparkline,
  XAxis,
  cssColor,
  sampleWorld,
  type ButtonVariant,
  type DitherColor,
  type ScreenKind,
} from "@dither-kit"
import { COMPONENT_COUNT } from "@/pages/landing/facts"
import { BENTO, staggers } from "@/pages/landing/hub"
import { spotlight } from "@/pages/landing/spotlight"
import { DAYS, FRAMES, WEEK_CHANGE, ago, shown } from "@/pages/landing/stat"
import { rise, routePath } from "~/shared/lib"
import PauseChip from "./PauseChip"
import RiseWords from "./RiseWords"
import "./Examples.css"

// The heavy cards are their own chunks, fetched as the card nears the
// viewport: the shader's WebGL engine, the translator's utility map, the
// fluid's canvas engine.
const DitherShader = lazy(() => import("@dither-kit/solid/DitherShader"))
const ExportScene = lazy(() => import("./ExportScene"))
const DitherFerrofluid = lazy(() => import("@dither-kit/solid/Ferrofluid"))
const LAZY = new Set(["shader", "styling", "ferrofluid"])
// Cards whose art runs to the card's edges.
const FLUSH = new Set(["world", "print-screens", "silk", "shader", "ferrofluid", "styling"])

// One moving layer at a time (`spotlight.ts`): of the surfaces that move by
// themselves only the spotlit one plays, the rest hold a still frame. A
// chip says whether its surface plays: a pause is the reader's and outlasts
// the spotlight, and play on a held surface makes it the reader's choice.
// A mouse or pen hovering a card, or keyboard focus inside it, points at
// it; a touch chooses through the chip, since a tap (which also focuses)
// would point at the card and then toggle what it just started.
const MOVING = ["world", "shader", "ferrofluid", "silk"] as const
type Moving = (typeof MOVING)[number]
const isMoving = (id: string): id is Moving => (MOVING as readonly string[]).includes(id)

/** A set a render follows: a new set each time its members change. */
function createSet<T>() {
  const [has, write] = createSignal<ReadonlySet<T>>(new Set())
  return {
    has,
    add: (v: T) => void write((s) => (s.has(v) ? s : new Set(s).add(v))),
    delete: (v: T) =>
      void write((s) => {
        if (!s.has(v)) return s
        const next = new Set(s)
        next.delete(v)
        return next
      }),
  }
}

// 3D model: a seeded probe on a picked ramp; "New model" is the next seed.
const BLUE = ["#0c1730", "#1e429f", "#2f6fd0", "#7ba3ee", "#c9dbff"]
const RAMPS = {
  blue: BLUE,
  metal: ["#101214", "#25292d", "#5d6268", "#a6abb1", "#e4e1d8"],
  ember: ["#170b04", "#4f240b", "#a84d17", "#f08a3c", "#ffd9b0"],
}
type Ramp = keyof typeof RAMPS
const RAMP_NAMES = Object.keys(RAMPS) as Ramp[]

// Area chart: one seed sets every fill; roll it and every fill changes.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const REVENUE = [42, 51, 48, 63, 71, 68, 79, 86, 82, 94, 102, 118]
const EXPENSES = [31, 34, 33, 39, 44, 47, 46, 52, 55, 58, 61, 67]
const AREA_ROWS = MONTHS.map((month, i) => ({ month, revenue: REVENUE[i], expenses: EXPENSES[i] }))
const AREA_CONFIG = {
  revenue: { label: "Revenue", color: "blue" as DitherColor },
  expenses: { label: "Expenses", color: "grey" as DitherColor },
}

// Button: four fills, five hues.
const FILLS: ButtonVariant[] = ["gradient", "dotted", "hatched", "solid"]
const HUES: DitherColor[] = ["blue", "orange", "green", "purple", "pink"]

// Shader: the kit's seeded sample (every seed a different GLSL program),
// 1-bit in the kit's blue, on a palette ramp, or in its own colours.
const OUTPUTS = ["mono", "ramp", "colour"] as const
const SHADER_RAMP: DitherColor[] = ["blue", "purple", "pink", "orange"]

// Ferrofluid: the ember first (beside the blue area chart), the kit's blue,
// or the page's grey.
const FLUIDS = {
  blue: ["#2f6fd0", "#7ba3ee", "#c9dbff"],
  ember: ["#a84d17", "#f08a3c", "#ffd9b0"],
  grey: ["#25292d", "#5d6268", "#a6abb1"],
} as const
type Fluid = keyof typeof FLUIDS
const FLUID_NAMES = Object.keys(FLUIDS) as Fluid[]

// Silk, in the kit's blue.
const SILK = [BLUE[2], BLUE[4], BLUE[2]]

export default function Examples() {
  const near = createSet<string>()
  let bento: HTMLUListElement | undefined

  const stilled = createSet<Moving>()
  const [pointed, setPointed] = createSignal<Moving | null>(null)
  const [chosen, setChosen] = createSignal<Moving | null>(null)
  const visible = createSet<Moving>()
  const centred = createSet<Moving>()
  const [last, setLast] = createSignal<Moving | null>(null)
  const lit = createMemo(() =>
    spotlight(MOVING, {
      pointed: pointed(),
      chosen: chosen(),
      visible: visible.has(),
      centred: centred.has(),
      last: last(),
    }),
  )
  createEffect(on(lit, (id) => setLast(id), { defer: true }))
  const playing = (id: Moving) => lit() === id && !stilled.has().has(id)
  const setPlaying = (id: Moving, on: boolean) => {
    if (!on) return stilled.add(id)
    stilled.delete(id)
    setChosen(id)
  }
  const aim = (id: string) => {
    if (!isMoving(id)) return
    setPointed(id)
    setChosen(id)
  }
  const hover = (e: PointerEvent, id: string) => {
    if (e.pointerType !== "touch") aim(id)
  }
  const focus = (e: FocusEvent, id: string) => {
    if (e.target instanceof Element && e.target.matches(":focus-visible")) aim(id)
  }
  const leave = (id: string) => {
    if (pointed() === id) setPointed(null)
  }

  const observers: IntersectionObserver[] = []
  const watchCards = (
    selector: string,
    init: IntersectionObserverInit,
    on: (el: HTMLElement, inside: boolean, io: IntersectionObserver) => void,
  ) => {
    const cards = [...(bento?.querySelectorAll<HTMLElement>(selector) ?? [])]
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) on(e.target as HTMLElement, e.isIntersecting, io)
    }, init)
    for (const c of cards) io.observe(c)
    observers.push(io)
  }
  const movingOf = (el: HTMLElement) => el.dataset.moving as Moving
  // Each card's reveal delay, read from the laid-out bento before any reveal
  // plays (a reveal starts as its card comes into view, after this).
  const [delays, setDelays] = createSignal<number[]>([])
  /** Each card's delay from the bento's box and its cards' boxes. */
  function stagger(box: DOMRectReadOnly, cards: DOMRectReadOnly[]) {
    setDelays(
      staggers(
        cards.map((c) => ({ top: c.top - box.top, left: c.left - box.left })),
        box.width,
      ),
    )
  }
  onMount(() => {
    onCleanup(() => observers.forEach((io) => io.disconnect()))
    const el = bento
    if (el && typeof IntersectionObserver !== "undefined") {
      // The boxes come from an observer's first report, measured as the frame
      // lays out: read at mount they forced a layout of the whole page in the
      // middle of mounting it. It reports before the reveals' own observers.
      const at = new Map<Element, DOMRectReadOnly>()
      const measure = new IntersectionObserver((entries) => {
        for (const e of entries) at.set(e.target, e.boundingClientRect)
        const box = at.get(el)
        const cards = [...el.children].map((c) => at.get(c))
        if (!box || !cards.every(Boolean)) return
        measure.disconnect()
        stagger(box, cards as DOMRectReadOnly[])
      })
      observers.push(measure)
      measure.observe(el)
      for (const c of el.children) measure.observe(c)
    } else if (el)
      stagger(
        el.getBoundingClientRect(),
        [...el.children].map((c) => c.getBoundingClientRect()),
      )
    if (typeof IntersectionObserver === "undefined") {
      bento?.querySelectorAll<HTMLElement>("[data-lazy]").forEach((c) => near.add(c.dataset.lazy ?? ""))
      for (const id of MOVING) {
        visible.add(id)
        centred.add(id)
      }
      return
    }
    // The heavy cards load 600px ahead; each moving card is tracked on screen
    // and across the middle tenth of the viewport.
    watchCards("[data-lazy]", { rootMargin: "600px 0px" }, (el, inside, io) => {
      if (!inside) return
      near.add(el.dataset.lazy ?? "")
      io.unobserve(el)
    })
    watchCards("[data-moving]", {}, (el, inside) => (inside ? visible.add(movingOf(el)) : visible.delete(movingOf(el))))
    watchCards("[data-moving]", { rootMargin: "-45% 0px -45% 0px" }, (el, inside) =>
      inside ? centred.add(movingOf(el)) : centred.delete(movingOf(el)),
    )
  })

  const [ramp, setRamp] = createSignal<Ramp>("blue")
  const [model, setModel] = createSignal(7)
  const world = createMemo(() => sampleWorld(model()))

  // Rating.
  // The instrument: the knob sets the load, the dial's needle settles on it.
  const [load, setLoad] = createSignal(64)

  // Print screens: one tone ramp, raw on the left and printed on the right,
  // the split dragged (or stepped by keyboard) and the screen switched in
  // place. The raw ramp runs in linear light, so the printed cells average to
  // it: from a step back the two halves are one tone.
  const [screen, setScreen] = createSignal<ScreenKind>("bayer")
  const [split, setSplit] = createSignal(42)

  const [fills, setFills] = createSignal(1984)
  // Four digits, as the first: every roll keeps its columns and rolls them.
  const roll = () => setFills(1000 + Math.floor(Math.random() * 9000))

  const [btn, setBtn] = createStore({ variant: "gradient" as ButtonVariant, color: "blue" as DitherColor })

  const [output, setOutput] = createSignal<(typeof OUTPUTS)[number]>("mono")
  const [program, setProgram] = createSignal(3)

  const [fluid, setFluid] = createSignal<Fluid>("ember")

  // Slide action: how many slides confirmed.
  const [confirmed, setConfirmed] = createSignal(0)

  // Stat card: scrub the chart and the headline rolls to the day under the
  // pointer (`stat.ts`).
  const [day, setDay] = createSignal<number | null>(null)

  /** A card's art: the component itself, with its own controls. */
  function art(id: string): JSX.Element {
    switch (id) {
      case "world":
        return (
          <>
            <DitherWorld
              source={world()}
              colors={RAMPS[ramp()]}
              autoRotate={playing("world") ? 14 : 0}
              grain={0.4}
              frameRate={12}
              label={`A seeded 3D probe, model ${model()}, turning slowly through the kit's Bayer cells`}
              class="h-full w-full"
            />
            <PauseChip
              modelValue={playing("world")}
              onUpdateModelValue={(on) => setPlaying("world", on)}
              label="Pause the model"
              class="chip"
            />
            <div class="art-tools">
              <div class="seg" role="group" aria-label="Model ramp">
                <For each={RAMP_NAMES}>
                  {(r) => (
                    <button type="button" aria-pressed={ramp() === r} onClick={() => setRamp(r)}>
                      {r}
                    </button>
                  )}
                </For>
              </div>
              <button type="button" class="key" onClick={() => setModel((n) => n + 1)}>
                New model
              </button>
            </div>
          </>
        )
      case "gauge":
        return (
          <div class="instrument">
            <DitherGauge value={load()} label="load" warn={0.8} class="instrument-dial" />
            <DitherKnob modelValue={load()} onUpdateModelValue={setLoad} size={52} label="Load" />
          </div>
        )
      case "print-screens":
        return (
          <div class="split" style={{ "--split": `${split()}%` }}>
            <DitherScreen screen={screen()}>
              <DitherGradient from="#e4e1d8" to="#101214" direction="down" cell={5} class="split-layer" />
            </DitherScreen>
            <div class="split-layer split-raw" aria-hidden="true" />
            <input
              value={split()}
              onInput={(e) => setSplit(Number(e.currentTarget.value))}
              type="range"
              min="0"
              max="100"
              class="split-range"
              aria-label="The ramp raw on the left, printed on the right: move the split"
            />
            <span class="split-handle" aria-hidden="true">
              <span class="split-grip">
                <DitherIcon name="GripVertical" size={14} strokeWidth={1.75} />
              </span>
            </span>
            <div class="art-tools">
              <div class="seg" role="group" aria-label="Screen">
                <For each={SCREEN_KINDS}>
                  {(k) => (
                    <button type="button" aria-pressed={screen() === k} onClick={() => setScreen(k)}>
                      {k}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
        )
      case "area":
        return (
          <div class="panel">
            {/* A new seed is a new chart, so every fill prints in again. */}
            <Show when={fills()} keyed>
              {(seed) => (
                <AreaChart data={AREA_ROWS} config={AREA_CONFIG} seed={seed} sparkles={false} class="area-chart">
                  <XAxis dataKey="month" maxTicks={6} />
                  <Area dataKey="expenses" variant={seed + 1} />
                  <Area dataKey="revenue" variant={seed} />
                </AreaChart>
              )}
            </Show>
            <div class="row">
              <button type="button" class="key" onClick={roll}>
                Roll a seed
              </button>
              <span class="readout">
                seed <DitherNumberFlow value={fills()} duration={320} />
              </span>
            </div>
          </div>
        )
      case "button":
        return (
          <div class="stack">
            <DitherButton color={btn.color} variant={btn.variant} class="min-h-12 px-8 text-sm">
              Publish
            </DitherButton>
            <div class="seg" role="group" aria-label="Fill">
              <For each={FILLS}>
                {(v) => (
                  <button type="button" aria-pressed={btn.variant === v} onClick={() => setBtn("variant", v)}>
                    {v}
                  </button>
                )}
              </For>
            </div>
            <div class="swatches" role="group" aria-label="Hue">
              <For each={HUES}>
                {(c) => (
                  <button
                    type="button"
                    class="swatch"
                    aria-label={c}
                    aria-pressed={btn.color === c}
                    style={{ "background-color": cssColor(c) }}
                    onClick={() => setBtn("color", c)}
                  />
                )}
              </For>
            </div>
          </div>
        )
      case "shader":
        return (
          <>
            <div>
              <Show when={near.has().has("shader")}>
                <DitherShader
                  seed={program()}
                  mono={output() === "mono"}
                  colors={output() === "ramp" ? SHADER_RAMP : undefined}
                  color="blue"
                  cell={4}
                  paused={!playing("shader")}
                  label={`The kit's sample shader, seed ${program()}`}
                  class="h-full w-full"
                />
              </Show>
            </div>
            <PauseChip
              modelValue={playing("shader")}
              onUpdateModelValue={(on) => setPlaying("shader", on)}
              label="Pause the shader"
              class="chip"
            />
            <div class="art-tools">
              <div class="seg" role="group" aria-label="Shader output">
                <For each={OUTPUTS}>
                  {(m) => (
                    <button type="button" aria-pressed={output() === m} onClick={() => setOutput(m)}>
                      {m}
                    </button>
                  )}
                </For>
              </div>
              <button type="button" class="key" onClick={() => setProgram((n) => n + 1)}>
                New shader
              </button>
            </div>
          </>
        )
      case "ferrofluid":
        return (
          <>
            <div>
              <Show when={near.has().has("ferrofluid")}>
                <DitherFerrofluid colors={[...FLUIDS[fluid()]]} paused={!playing("ferrofluid")} class="h-full w-full" />
              </Show>
            </div>
            <PauseChip
              modelValue={playing("ferrofluid")}
              onUpdateModelValue={(on) => setPlaying("ferrofluid", on)}
              label="Pause the fluid"
              class="chip"
            />
            <div class="art-tools">
              <div class="seg" role="group" aria-label="Fluid palette">
                <For each={FLUID_NAMES}>
                  {(f) => (
                    <button type="button" aria-pressed={fluid() === f} onClick={() => setFluid(f)}>
                      {f}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </>
        )
      case "styling":
        return (
          <div>
            <Show when={near.has().has("styling")}>
              <ExportScene />
            </Show>
          </div>
        )
      case "slide-action":
        return (
          <div class="stack">
            <DitherSlideAction
              label="Slide to confirm"
              color="blue"
              class="w-full max-w-80"
              onConfirm={() => setConfirmed((n) => n + 1)}
            />
            <span class="readout">
              confirmed <DitherNumberFlow value={confirmed()} duration={320} />
            </span>
          </div>
        )
      case "stats-cards":
        return (
          <div class="panel stat">
            <span class="panel-d">Frames exported</span>
            <DitherNumberFlow value={shown(day())} duration={240} class="stat-v" />
            <span class="panel-d stat-sub">
              <span data-on={day() === null ? "" : undefined} aria-hidden={day() !== null}>
                <b>+{WEEK_CHANGE}%</b> on the week before
              </span>
              <span data-on={day() === null ? undefined : ""} aria-hidden={day() === null}>
                {ago(day() ?? DAYS - 1)}
              </span>
            </span>
            <Sparkline
              data={FRAMES}
              color="blue"
              interactive
              label="Frames exported"
              hoverLift={false}
              sparkles={false}
              class="stat-spark"
              onHoverChange={setDay}
            />
          </div>
        )
      case "silk":
        return (
          <>
            <DitherSilk colors={SILK} frameRate={12} paused={!playing("silk")} class="h-full w-full" />
            <PauseChip
              modelValue={playing("silk")}
              onUpdateModelValue={(on) => setPlaying("silk", on)}
              label="Pause the silk"
              class="chip"
            />
          </>
        )
      case "decrypted-text":
        return (
          <p class="cipher">
            <DitherDecryptedText text="Decoded as" />
            <DitherDecryptedText text="it comes into view." />
          </p>
        )
      default:
        return null
    }
  }

  return (
    <section id="examples" aria-labelledby="examples-h" class="examples-scope examples">
      <div ref={rise} class="sec-head">
        <h2 id="examples-h" class="section-title">
          <RiseWords text="Every component, live." />
        </h2>
        <div class="sec-side">
          <p data-rise class="sec-lede">
            {COMPONENT_COUNT} components on one engine. <span class="lede-key">Every card is the real thing</span>, so
            poke it, then open its docs for the props and the code.
          </p>
          <a data-rise href={routePath("/docs")} class="more-link">
            See every section in the docs
          </a>
        </div>
      </div>

      <ul ref={(el) => (bento = el)} class="bento" aria-label="Examples from the docs">
        <For each={BENTO}>
          {(t, i) => (
            <li
              class={`card t-${t.id}`}
              data-lazy={LAZY.has(t.id) ? t.id : undefined}
              data-moving={isMoving(t.id) ? t.id : undefined}
              onPointerEnter={(e) => hover(e, t.id)}
              onPointerLeave={() => leave(t.id)}
              onFocusIn={(e) => focus(e, t.id)}
              onFocusOut={() => leave(t.id)}
            >
              <DitherReveal
                class={FLUSH.has(t.id) ? "card-art flush" : "card-art"}
                duration={0.72}
                delay={delays()[i()] ?? 0}
                easing="glide"
              >
                {art(t.id)}
              </DitherReveal>
              <p class="card-foot">
                <a href={routePath(`/docs/${t.id}`)} class="card-name">
                  {t.label}
                </a>
              </p>
            </li>
          )}
        </For>
      </ul>
    </section>
  )
}
