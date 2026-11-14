// The charts: area, line, bar, pie and radar, each a root and its parts
// with a picker gallery driving the main preview (a pick swaps the prop and
// bumps the chart's replay token, so the kit's own dither entrance is the
// transition), and the sparkline for stat cards.
import { cssColor, DitherNumberFlow, type DitherColor, type DotVariant } from "@dither-ui/kit"
import { createMemo, For, type JSX } from "solid-js"
import { createStore } from "solid-js/store"
import { routePath } from "@/shared/lib"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Dot,
  Grid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  Sparkline,
  Tooltip,
  XAxis,
  YAxis,
} from "@/shared/ui/charts"
import DemoCard from "../DemoCard"
import {
  config,
  pieConfig,
  pieRows,
  radarConfig,
  radarRows,
  rows,
  STATS,
  trafficConfig,
  trafficRows,
  VARIANTS,
  wave,
} from "../demo-data"
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
import { dataCode } from "../snippet"
import type { AreaVariant } from "@dither-ui/kit"

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

const SNIPPETS = {
  area: `${dataCode("rows", rows)}
${dataCode("config", config)}

<AreaChart class="h-64" data={rows} config={config} stackType="stacked">
  <Grid horizontal />
  <XAxis dataKey="month" maxTicks={6} />
  <YAxis tickCount={4} />
  <Area dataKey="expenses" variant="dotted" />
  <Area dataKey="revenue" variant="gradient" />
  <Legend align="right" />
  <Tooltip labelKey="month" />
</AreaChart>`,
  line: `${dataCode("rows", rows)}
${dataCode("config", config)}

<LineChart class="h-64" data={rows} config={config}>
  <Grid horizontal />
  <XAxis dataKey="month" maxTicks={6} />
  <Line dataKey="revenue">
    <Dot variant="border" r={2} />
  </Line>
  <Line dataKey="expenses" />
  <Legend align="right" />
  <Tooltip labelKey="month" />
</LineChart>`,
  bar: `${dataCode("trafficRows", trafficRows)}
${dataCode("trafficConfig", trafficConfig)}

<BarChart class="h-64" data={trafficRows} config={trafficConfig}>
  <Grid horizontal />
  <XAxis dataKey="month" />
  <YAxis tickCount={4} />
  <Bar dataKey="organic" />
  <Bar dataKey="paid" />
  <Legend align="right" />
  <Tooltip labelKey="month" />
</BarChart>`,
  pie: `${dataCode("pieRows", pieRows)}
${dataCode("pieConfig", pieConfig)}

<PieChart class="h-64" data={pieRows} config={pieConfig}
  dataKey="value" nameKey="name" innerRadius={0.55}>
  <Pie variant="gradient" isClickable />
  <Legend align="center" />
</PieChart>`,
  radar: `${dataCode("radarRows", radarRows)}
${dataCode("radarConfig", radarConfig)}

<RadarChart class="h-72" data={radarRows} config={radarConfig} nameKey="axis">
  <Radar dataKey="current" />
  <Radar dataKey="previous" />
  <Legend align="center" />
</RadarChart>`,
  sparkline: `const [hour, setHour] = createSignal<number | null>(null)
// The last 24 hours of revenue, in $k.
const last24h = Array.from({ length: 24 }, (_, i) =>
  Number((2.4 * (10 + i * 0.35 + Math.sin(i * 0.8 + 1) * 2 + Math.sin(i * 1.7 + 2) * 1.1)).toFixed(1)),
)

<div class="rounded-lg border p-4">
  <div class="text-xs text-muted-foreground">Revenue</div>
  <div class="flex items-baseline gap-2">
    <span class="text-lg tabular-nums">$<DitherNumberFlow value={last24h[hour() ?? 23]} decimals={1} />k</span>
    <span class="text-xs text-muted-foreground">{hour() === null ? "+48.3%" : \`\${23 - hour()}h ago\`}</span>
  </div>
  <Sparkline data={last24h} color="green" interactive label="Revenue" hoverLift={false}
    class="mt-3 h-8 w-full" onHoverChange={(i) => (setHour(i))} />
</div>`,
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
  const [scrubbed, setScrubbed] = createStore<Record<string, number | null>>({})

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

  // Code tabs mirror the picked variant — what you see is what you copy.
  const areaCode = createMemo(() =>
    SNIPPETS.area.replace(
      'dataKey="revenue" variant="gradient"',
      typeof picked.area === "number"
        ? `dataKey="revenue" variant={${picked.area}}  /* a seed: deterministic */`
        : `dataKey="revenue" variant="${picked.area}"`,
    ),
  )
  const lineCode = createMemo(() => SNIPPETS.line.replace('variant="border"', `variant="${picked.dot}"`))
  const barCode = createMemo(() =>
    SNIPPETS.bar
      .replace('<Bar dataKey="organic" />', `<Bar dataKey="organic" variant="${picked.bar}" />`)
      .replace('<Bar dataKey="paid" />', `<Bar dataKey="paid" variant="${picked.bar}" />`),
  )
  const pieCode = createMemo(() => SNIPPETS.pie.replace('variant="gradient"', `variant="${picked.pie}"`))
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
        <DemoCard code={areaCode()}>
          <div class="h-64">
            <AreaChart data={rows} config={config} stackType="stacked" replayToken={galleryReplay.area}>
              <Grid horizontal />
              <XAxis dataKey="month" maxTicks={6} />
              <YAxis tickCount={4} />
              <Area dataKey="expenses" variant="dotted" />
              <Area dataKey="revenue" variant={picked.area} />
              <Legend align="right" isClickable={true} />
              <Tooltip labelKey="month" />
            </AreaChart>
          </div>
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
        <DemoCard code={lineCode()}>
          <div class="h-64">
            <LineChart data={rows} config={config} replayToken={galleryReplay.line}>
              <Grid horizontal />
              <XAxis dataKey="month" maxTicks={6} />
              <Line dataKey="revenue">
                <Dot variant={picked.dot} r={2} />
              </Line>
              <Line dataKey="expenses" />
              <Legend align="right" />
              <Tooltip labelKey="month" />
            </LineChart>
          </div>
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
        <DemoCard code={barCode()}>
          <div class="h-64">
            <BarChart data={trafficRows} config={trafficConfig} replayToken={galleryReplay.bar}>
              <Grid horizontal />
              <XAxis dataKey="month" />
              <YAxis tickCount={4} />
              <Bar dataKey="organic" variant={picked.bar} />
              <Bar dataKey="paid" variant={picked.bar} />
              <Legend align="right" />
              <Tooltip labelKey="month" />
            </BarChart>
          </div>
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
        <DemoCard code={pieCode()}>
          <div class="h-64">
            <PieChart
              data={pieRows}
              config={pieConfig}
              dataKey="value"
              nameKey="name"
              innerRadius={0.55}
              replayToken={galleryReplay.pie}
            >
              {/* Pie takes no `isClickable`: the legend isolates */}
              <Pie variant={picked.pie} />
              <Legend align="center" isClickable={true} />
            </PieChart>
          </div>
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
        <DemoCard code={SNIPPETS.radar}>
          <div class="h-72">
            <RadarChart data={radarRows} config={radarConfig} nameKey="axis">
              <Radar dataKey="current" />
              <Radar dataKey="previous" />
              <Legend align="center" />
            </RadarChart>
          </div>
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
        <DemoCard code={SNIPPETS.sparkline}>
          <div class="grid gap-4 sm:grid-cols-3">
            <For each={STATS}>
              {(s) => (
                <div class="rounded-lg border border-border/60 p-4">
                  <div class="text-[11px] text-muted-foreground">{s.label}</div>
                  <div class="mt-1 flex items-baseline gap-2">
                    <span class="inline-flex items-center text-lg leading-none tracking-tight tabular-nums">
                      {s.unit.pre}
                      <DitherNumberFlow
                        value={s.read(s.data[scrubbed[s.label] ?? s.data.length - 1] ?? 0)}
                        decimals={s.unit.dec}
                        duration={240}
                      />
                      {s.unit.suf}
                    </span>
                    {/* The delta at rest, the hour while scrubbed: one cell. */}
                    <span class="grid text-[11px] tabular-nums">
                      <span
                        class={`[grid-area:1/1] transition-opacity duration-150 motion-reduce:transition-none ${
                          scrubbed[s.label] == null ? "opacity-100" : "opacity-0"
                        }`}
                        aria-hidden={scrubbed[s.label] != null}
                        style={{ color: cssColor(s.up ? "green" : "red") }}
                      >
                        {s.delta}
                      </span>
                      <span
                        class={`text-muted-foreground [grid-area:1/1] transition-opacity duration-150 motion-reduce:transition-none ${
                          scrubbed[s.label] == null ? "opacity-0" : "opacity-100"
                        }`}
                        aria-hidden={scrubbed[s.label] == null}
                      >
                        {s.data.length - 1 - (scrubbed[s.label] ?? s.data.length - 1)}h ago
                      </span>
                    </span>
                  </div>
                  <Sparkline
                    data={s.data}
                    color={s.color}
                    interactive
                    label={s.label}
                    hoverLift={false}
                    class="mt-3 h-8 w-full cursor-crosshair"
                    onHoverChange={(i) => setScrubbed(s.label, i)}
                  />
                </div>
              )}
            </For>
          </div>
        </DemoCard>
        <PropsTable rows={API.sparkline} />
      </DocSection>
    </>
  )
}
