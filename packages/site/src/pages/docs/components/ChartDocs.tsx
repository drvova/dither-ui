// The charts: area, line, bar, pie and radar, each a root and its parts
// with a picker gallery driving the main preview (a pick swaps the prop and
// bumps the chart's replay token, so the kit's own dither entrance is the
// transition), and the sparkline for stat cards.
import { type DitherColor, type DotVariant } from "@dither-ui/kit"
import { For, type JSX } from "solid-js"
import { createStore } from "solid-js/store"
import { routePath } from "@/shared/lib"
import { lazyPart } from "@/shared/lib/lazy-part"
import { Bar, BarChart, Dot, Line, LineChart, Pie, PieChart, Sparkline } from "@/shared/ui/charts"
import DemoCard from "../DemoCard"
import { VARIANTS, wave } from "../demo-data"
import DocSection from "../DocSection"
import { thumbClass, thumbLabel } from "../gallery"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import areaChartProps from "virtual:dither-props/AreaChart"
import areaProps from "virtual:dither-props/Area"
import lineChartProps from "virtual:dither-props/LineChart"
import lineProps from "virtual:dither-props/Line"
import barChartProps from "virtual:dither-props/BarChart"
import barProps from "virtual:dither-props/Bar"
import pieChartProps from "virtual:dither-props/PieChart"
import radarChartProps from "virtual:dither-props/RadarChart"
import sparklineProps from "virtual:dither-props/Sparkline"
import { exampleCode } from "../example-code"
import type { AreaVariant } from "@dither-ui/kit"
import radarCode from "./examples/radar.tsx?raw"
import sparklineCode from "./examples/sparkline.tsx?raw"
import areaCode from "./examples/area.tsx?raw"
import lineCode from "./examples/line.tsx?raw"
import barCode from "./examples/bar.tsx?raw"
import pieCode from "./examples/pie.tsx?raw"

// The chart examples load with their charts, as chunks of their own: the
// kit's scales and shapes are the heaviest part a section holds, so the
// flow's first load stays its own (`shared/ui/charts.tsx` the same way).
// A server renders the page whole, so it loads them first.
const RadarExample = lazyPart(() => import("./examples/radar"))
const SparklineExample = lazyPart(() => import("./examples/sparkline"))
const AreaExample = lazyPart(() => import("./examples/area"))
const LineExample = lazyPart(() => import("./examples/line"))
const BarExample = lazyPart(() => import("./examples/bar"))
const PieExample = lazyPart(() => import("./examples/pie"))
if (import.meta.env.SSR)
  await Promise.all(
    [RadarExample, SparklineExample, AreaExample, LineExample, BarExample, PieExample].map((part) => part.preload()),
  )

const DOT_VARIANTS: DotVariant[] = ["border", "colored-border", "filled"]

// Seed-generative textures: one integer, one deterministic texture.
const SEEDS = [7, 1984, 4242, 90210, 31337]

// Tiny single-series set for the variant galleries.
const miniRows = [4, 7, 5, 9, 6, 8].map((v, i) => ({ x: i + 1, v }))
const miniConfig = { v: { color: "blue" as DitherColor } }
const miniPieRows = [
  { name: "a", value: 42 },
  { name: "b", value: 33 },
  { name: "c", value: 25 },
]
const miniPieConfig = {
  a: { color: "blue" as DitherColor },
  b: { color: "purple" as DitherColor },
  c: { color: "orange" as DitherColor },
}

export const API: Record<string, PropRow[]> = {
  area: [...kitTable(areaChartProps), ...kitTable(areaProps, { part: "series" })],
  line: [...kitTable(lineChartProps), ...kitTable(lineProps, { part: "series" })],
  bar: [...kitTable(barChartProps), ...kitTable(barProps, { part: "series" })],
  pie: kitTable(pieChartProps),
  radar: kitTable(radarChartProps),
  sparkline: kitTable(sparklineProps),
}

/** A chart section's heading beside its "Open in the Studio" link (the
 * Studio's `#new/<type>`, one of `CHART_TYPES`). */
const studioHead = (type: string) => (heading: JSX.Element) => (
  <div class="flex items-baseline justify-between gap-4">
    {heading}
    <a
      href={`${routePath("/studio")}#new/${type}`}
      class="-m-2 shrink-0 p-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      aria-label={`Open a new ${type} chart in the studio`}
    >
      Open in the Studio
    </a>
  </div>
)

export default function ChartDocs() {
  // The Sparkline section scrubs: the hour under the pointer, per card.

  // Variant galleries drive the main preview: picking one swaps the prop and
  // bumps the chart's replay token, so the kit's own dither entrance IS the
  // transition — no CSS theatre required.
  const [picked, setPicked] = createStore({
    area: "gradient" as AreaVariant | number,
    bar: "gradient" as AreaVariant,
    pie: "gradient" as AreaVariant,
    dot: "border" as DotVariant,
  })
  const [galleryReplay, setGalleryReplay] = createStore({ area: 0, bar: 0, pie: 0, line: 0 })

  function pick(section: "area" | "bar" | "pie", v: AreaVariant | number) {
    setPicked(section, v as never)
    setGalleryReplay(section, (n) => n + 1)
  }

  const randomSeed = () => pick("area", Math.floor(Math.random() * 1_000_000))
  function pickDot(v: DotVariant) {
    setPicked("dot", v)
    setGalleryReplay("line", (n) => n + 1)
  }

  // The code tabs write the picked variant into each example: what you see is what you copy.
  /** The seed the random tile rolled: a number picked that is not one of
   * the gallery's own. */
  const rolled = () => (typeof picked.area === "number" && !SEEDS.includes(picked.area) ? picked.area : null)

  return (
    <>
      {/* Area */}
      <DocSection defer id="area" head={studioHead("area")}>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Revenue against expenses, stacked. Hover for the tooltip; click a legend entry to isolate a series.
        </p>
        <DemoCard code={exampleCode(areaCode, { variant: picked.area })}>
          <AreaExample variant={picked.area} replayToken={galleryReplay.area} />
        </DemoCard>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Variants</h3>
        <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <For each={VARIANTS}>
            {(v) => (
              <button
                type="button"
                aria-pressed={picked.area === v}
                class={thumbClass(picked.area === v)}
                onClick={() => pick("area", v)}
              >
                <Sparkline data={wave} color="blue" variant={v} class="pointer-events-none h-14 w-full" />
                <div class={thumbLabel(picked.area === v)}>{v}</div>
              </button>
            )}
          </For>
        </div>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Seed-generative</h3>
        <p class="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          A number is a seed: the same deterministic idea as the avatar, applied to texture.{" "}
          <code class="text-foreground/80">{"variant={1984}"}</code> renders the same fill on every chart, forever.
        </p>
        <div class="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          <For each={SEEDS}>
            {(s) => (
              <button
                type="button"
                aria-pressed={picked.area === s}
                class={thumbClass(picked.area === s)}
                onClick={() => pick("area", s)}
              >
                <Sparkline data={wave} color="blue" variant={s} class="pointer-events-none h-14 w-full" />
                <div class={`${thumbLabel(picked.area === s)} tabular-nums`}>{s}</div>
              </button>
            )}
          </For>
          <button type="button" class={`${thumbClass(rolled() !== null)} grid content-center`} onClick={randomSeed}>
            <div class="text-center text-[13px] text-muted-foreground" aria-hidden="true">
              ~
            </div>
            <div class={`${thumbLabel(rolled() !== null)} tabular-nums`}>{rolled() ?? "random"}</div>
          </button>
        </div>
        <PropsTable rows={API.area} />
      </DocSection>

      {/* Line */}
      <DocSection defer id="line" head={studioHead("line")}>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Bright series lines with sparkles on the live edge; nest a <code class="text-foreground/80">Dot</code> inside
          a line for markers.
        </p>
        <DemoCard code={exampleCode(lineCode, { dot: picked.dot })}>
          <LineExample dot={picked.dot} replayToken={galleryReplay.line} />
        </DemoCard>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Dot variants</h3>
        <div class="mt-2 grid grid-cols-3 gap-2">
          <For each={DOT_VARIANTS}>
            {(d) => (
              <button
                type="button"
                aria-pressed={picked.dot === d}
                class={thumbClass(picked.dot === d)}
                onClick={() => pickDot(d)}
              >
                <div class="pointer-events-none h-20">
                  <LineChart
                    data={miniRows}
                    config={miniConfig}
                    interactive={false}
                    margins={{ top: 6, right: 6, bottom: 6, left: 6 }}
                  >
                    <Line dataKey="v">
                      <Dot variant={d} r={2.5} />
                    </Line>
                  </LineChart>
                </div>
                <div class={thumbLabel(picked.dot === d)}>{d}</div>
              </button>
            )}
          </For>
        </div>
        <PropsTable rows={API.line} />
      </DocSection>

      {/* Bar */}
      <DocSection defer id="bar" head={studioHead("bar")}>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Organic vs paid traffic, grouped. Set <code class="text-foreground/80">stackType</code> to stacked or percent
          to pile the columns.
        </p>
        <DemoCard code={exampleCode(barCode, { variant: picked.bar })}>
          <BarExample variant={picked.bar} replayToken={galleryReplay.bar} />
        </DemoCard>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Variants</h3>
        <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <For each={VARIANTS}>
            {(v) => (
              <button
                type="button"
                aria-pressed={picked.bar === v}
                class={thumbClass(picked.bar === v)}
                onClick={() => pick("bar", v)}
              >
                <div class="pointer-events-none h-20">
                  <BarChart
                    data={miniRows}
                    config={miniConfig}
                    interactive={false}
                    margins={{ top: 6, right: 6, bottom: 6, left: 6 }}
                  >
                    <Bar dataKey="v" variant={v} />
                  </BarChart>
                </div>
                <div class={thumbLabel(picked.bar === v)}>{v}</div>
              </button>
            )}
          </For>
        </div>
        <PropsTable rows={API.bar} />
      </DocSection>

      {/* Pie */}
      <DocSection defer id="pie" head={studioHead("pie")}>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Browser share as a donut. Click a slice or a legend entry to isolate it.
        </p>
        <DemoCard code={exampleCode(pieCode, { variant: picked.pie })}>
          <PieExample variant={picked.pie} replayToken={galleryReplay.pie} />
        </DemoCard>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Variants</h3>
        <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <For each={VARIANTS}>
            {(v) => (
              <button
                type="button"
                aria-pressed={picked.pie === v}
                class={thumbClass(picked.pie === v)}
                onClick={() => pick("pie", v)}
              >
                <div class="pointer-events-none h-24">
                  <PieChart data={miniPieRows} config={miniPieConfig} dataKey="value" nameKey="name" innerRadius={0.5}>
                    <Pie variant={v} />
                  </PieChart>
                </div>
                <div class={thumbLabel(picked.pie === v)}>{v}</div>
              </button>
            )}
          </For>
        </div>
        <PropsTable rows={API.pie} />
      </DocSection>

      {/* Radar */}
      <DocSection defer id="radar" head={studioHead("radar")}>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Sprint health across five axes, this sprint against the last.
        </p>
        <DemoCard code={radarCode}>
          <RadarExample />
        </DemoCard>
        <PropsTable rows={API.radar} />
      </DocSection>

      {/* Sparkline */}
      <DocSection defer id="sparkline">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A plain numeric series with zero margins, built for stat cards, table cells and dashboard rows. Set{" "}
          <code>interactive</code> and it scrubs: its own crosshair marks the point under the pointer and{" "}
          <code>onHoverChange</code> reports it, here rolling each card's figure to that hour.
        </p>
        <DemoCard code={sparklineCode}>
          <SparklineExample />
        </DemoCard>
        <PropsTable rows={API.sparkline} />
      </DocSection>
    </>
  )
}
