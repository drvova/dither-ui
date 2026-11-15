// The chart family: every kind prints SVG (no canvas, and before any
// measure), the parts land in the root's layers, the marks name the data, the legend and tooltip read whichever root they sit in,
// and a part outside its root says which root it belongs in.
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { createSignal, type JSX } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import ActiveDot from "../../src/solid/ActiveDot"
import Area from "../../src/solid/Area"
import { AreaChart, LineChart } from "../../src/solid/area-chart"
import Bar from "../../src/solid/Bar"
import { BarChart } from "../../src/solid/bar-chart"
import DitherScreen from "../../src/solid/DitherScreen"
import Dot from "../../src/solid/Dot"
import Grid from "../../src/solid/Grid"
import Legend from "../../src/solid/Legend"
import Line from "../../src/solid/Line"
import Pie from "../../src/solid/Pie"
import { PieChart } from "../../src/solid/pie-chart"
import Radar from "../../src/solid/Radar"
import { RadarChart } from "../../src/solid/radar-chart"
import RadarFrame from "../../src/solid/RadarFrame"
import RadarSweep from "../../src/solid/RadarSweep"
import { usePolarPart } from "../../src/solid/runtime/polar-context"
import Sparkline from "../../src/solid/Sparkline"
import Tooltip from "../../src/solid/Tooltip"
import XAxis from "../../src/solid/XAxis"
import YAxis from "../../src/solid/YAxis"
import type { ScreenKind } from "../../src/engine/pixel"
import { world } from "../support/world"

const rows = [
  { month: "Jan", sales: 10, costs: 4 },
  { month: "Feb", sales: 30, costs: 8 },
  { month: "Mar", sales: 20, costs: 6 },
]
const config = { sales: { label: "Sales", color: "blue" }, costs: { label: "Costs", color: "grey" } } as const
const slices = [
  { name: "web", value: 60 },
  { name: "app", value: 40 },
]
const sliceConfig = { web: { label: "Web", color: "blue" }, app: { label: "App", color: "grey" } } as const
const axes = [
  { axis: "speed", now: 3, then: 1 },
  { axis: "reach", now: 2, then: 4 },
  { axis: "depth", now: 5, then: 2 },
]
const radarConfig = { now: { label: "Now", color: "blue" }, then: { label: "Then", color: "grey" } } as const

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
  // jsdom has no layout: an observer that reports a 300x200 box lets the
  // chart measure itself and render its parts.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private cb: ResizeObserverCallback) {}
      observe(target: Element) {
        this.cb([{ target, contentRect: { width: 300, height: 200 } } as ResizeObserverEntry], this as never)
      }
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  cleanup()
  w.restore()
  vi.restoreAllMocks()
})

/** Mounted, in view, and one frame in. */
async function shown(ui: () => JSX.Element) {
  const view = render(ui)
  w.show()
  await w.frame(100)
  return view
}

/** The print's inks: every stroked path of its SVG. */
const inksOf = (root: ParentNode) => [...root.querySelectorAll(".dk-chart-print path[stroke]")]
const printOf = (root: ParentNode) =>
  inksOf(root)
    .map((p) => `${p.getAttribute("stroke")}${p.getAttribute("d")}`)
    .join()

describe("every chart kind prints SVG", () => {
  const kinds: [string, () => JSX.Element][] = [
    [
      "area",
      () => (
        <AreaChart data={rows} config={config}>
          <Area dataKey="sales" />
          <Area dataKey="costs" variant="dotted" />
        </AreaChart>
      ),
    ],
    [
      "line",
      () => (
        <LineChart data={rows} config={config}>
          <Line dataKey="sales" />
        </LineChart>
      ),
    ],
    [
      "bar",
      () => (
        <BarChart data={rows} config={config}>
          <Bar dataKey="sales" />
          <Bar dataKey="costs" />
        </BarChart>
      ),
    ],
    [
      "pie",
      () => (
        <PieChart data={slices} config={sliceConfig} dataKey="value" nameKey="name">
          <Pie />
        </PieChart>
      ),
    ],
    [
      "radar",
      () => (
        <RadarChart data={axes} config={radarConfig} nameKey="axis">
          <Radar dataKey="now" />
          <Radar dataKey="then" />
        </RadarChart>
      ),
    ],
    ["sparkline", () => <Sparkline data={[1, 3, 2, 5, 4]} color="blue" />],
  ]
  for (const [kind, ui] of kinds) {
    it(`${kind}: mounts with a small dataset and prints its cells as paths, no canvas`, () => {
      const { container } = render(ui)
      expect(container.querySelector("canvas")).toBeNull()
      expect(inksOf(container).length).toBeGreaterThan(0)
      expect(container.querySelector("svg.dk-chart")!.getAttribute("viewBox")).toBe("0 0 300 200")
    })
  }

  it("prints at its fallback size before anything measures it, scaled into its box", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    const area = render(() => (
      <AreaChart data={rows} config={config}>
        <Area dataKey="sales" />
      </AreaChart>
    ))
    expect(area.container.querySelector("svg.dk-chart")!.getAttribute("viewBox")).toBe("0 0 600 240")
    expect(inksOf(area.container).length).toBeGreaterThan(0)
    const pie = render(() => (
      <PieChart data={slices} config={sliceConfig} dataKey="value" nameKey="name">
        <Pie />
      </PieChart>
    ))
    expect(pie.container.querySelector("svg.dk-chart")!.getAttribute("viewBox")).toBe("0 0 320 320")
  })

  it("shows a precompiled image in place of the print", () => {
    const { container } = render(() => (
      <BarChart data={rows} config={config} precompiled="data:image/png;base64,AAAA">
        <Bar dataKey="sales" />
      </BarChart>
    ))
    expect(inksOf(container)).toEqual([])
    const img = container.querySelector("image")!
    expect(img.getAttribute("href")).toBe("data:image/png;base64,AAAA")
    expect(img.getAttribute("aria-hidden")).toBe("true")
  })

  it("prints again when its data changes", () => {
    const [data, setData] = createSignal(rows)
    const { container } = render(() => (
      <BarChart data={data()} config={config} animate={false}>
        <Bar dataKey="sales" />
      </BarChart>
    ))
    const before = printOf(container)
    setData([...rows, { month: "Apr", sales: 50, costs: 9 }])
    expect(printOf(container)).not.toBe(before)
  })

  it("plays its entrance in CSS, timed on the root, and none when it does not animate", () => {
    const moving = render(() => (
      <AreaChart data={rows} config={config} animationDuration={400} animationDelay={50} easing="glide">
        <Area dataKey="sales" />
      </AreaChart>
    ))
    const svg = moving.container.querySelector<SVGSVGElement>("svg.dk-chart")!
    expect(svg.hasAttribute("data-enter")).toBe(true)
    expect(svg.style.getPropertyValue("--dk-chart-duration")).toBe("400ms")
    expect(svg.style.getPropertyValue("--dk-chart-delay")).toBe("50ms")
    expect(svg.style.getPropertyValue("--dk-chart-ease")).toBe("cubic-bezier(0.22, 1, 0.36, 1)")
    expect(svg.querySelector(".dk-chart-sweep .dk-chart-fill")).not.toBeNull()
    const still = render(() => (
      <AreaChart data={rows} config={config} animate={false}>
        <Area dataKey="sales" />
      </AreaChart>
    ))
    expect(still.container.querySelector("svg.dk-chart")!.hasAttribute("data-enter")).toBe(false)
  })
})

describe("a chart under a DitherScreen", () => {
  const charts: [string, () => JSX.Element][] = [
    [
      "area",
      () => (
        <AreaChart data={rows} config={config} sparkles={false} animate={false}>
          <Area dataKey="sales" />
        </AreaChart>
      ),
    ],
    [
      "bar",
      () => (
        <BarChart data={rows} config={config} animate={false}>
          <Bar dataKey="sales" />
        </BarChart>
      ),
    ],
    [
      "pie",
      () => (
        <PieChart data={slices} config={sliceConfig} dataKey="value" nameKey="name" animate={false}>
          <Pie />
        </PieChart>
      ),
    ],
    [
      "radar",
      () => (
        <RadarChart data={axes} config={radarConfig} nameKey="axis" animate={false}>
          <Radar dataKey="now" />
        </RadarChart>
      ),
    ],
  ]

  for (const [kind, chart] of charts) {
    it(`${kind}: prints through the new screen when the screen changes, as a fresh mount under it does`, () => {
      const [screen, setScreen] = createSignal<ScreenKind>("bayer")
      const { container } = render(() => <DitherScreen screen={screen()}>{chart()}</DitherScreen>)
      const bayer = printOf(container)
      expect(bayer).not.toBe("")
      setScreen("line")
      const line = printOf(container)
      expect(line).not.toBe(bayer)
      const fresh = render(() => <DitherScreen screen="line">{chart()}</DitherScreen>)
      expect(printOf(fresh.container)).toBe(line)
    })
  }
})

describe("a chart root's layers", () => {
  it("stacks the grid, the print and the axes in one named SVG, the legend over it", () => {
    const { container } = render(() => (
      <AreaChart data={rows} config={config}>
        <Legend />
        <XAxis dataKey="month" />
        <YAxis />
        <Grid />
        <Area dataKey="sales">
          <Dot />
          <ActiveDot />
        </Area>
      </AreaChart>
    ))
    const root = container.firstElementChild!
    expect(root.className).toBe("relative h-full w-full")
    expect([...root.children].map((c) => c.tagName.toLowerCase())).toEqual(["svg", "div"])
    const [svg, legend] = [...root.children]
    expect(svg.getAttribute("role")).toBe("group")
    expect(svg.getAttribute("aria-label")).toBe("Area chart: Sales, Costs")
    expect(svg.querySelector("title")!.textContent).toBe("Area chart: Sales, Costs")
    const [back, plot, front] = [...svg.children].filter((c) => c.tagName === "g")
    expect(back.querySelectorAll("g.stroke-border line").length).toBeGreaterThan(0)
    expect(inksOf(plot).length).toBeGreaterThan(0)
    expect(front.getAttribute("transform")).toBe("translate(36,10)")
    expect([...front.querySelectorAll("text")].map((t) => t.textContent)).toEqual(
      expect.arrayContaining(["Jan", "Feb", "Mar"]),
    )
    // one dot a point, inside its series, fading in after the entrance
    expect(front.querySelectorAll(".dk-chart-after circle").length).toBe(rows.length)
    expect(legend.textContent).toBe("SalesCosts")
  })

  it("frames a radar behind its print, rings and axis names as text", () => {
    const radar = render(() => (
      <RadarChart data={axes} config={radarConfig} nameKey="axis" rings={3}>
        <Radar dataKey="now" />
      </RadarChart>
    ))
    const back = radar.container.querySelector("svg.dk-chart > g")!
    expect(back.querySelectorAll("g.stroke-border path").length).toBe(3)
    expect([...back.querySelectorAll("text")].map((t) => t.textContent)).toEqual(["speed", "reach", "depth"])
  })

  it("takes the root element's own attributes and class", () => {
    const { container } = render(() => (
      <AreaChart data={rows} config={config} class="h-40" data-chart="sales">
        <Area dataKey="sales" />
      </AreaChart>
    ))
    const root = container.firstElementChild!
    expect(root.className).toContain("h-40")
    expect(root.getAttribute("data-chart")).toBe("sales")
  })
})

describe("a chart's marks", () => {
  const labels = (root: ParentNode) =>
    [...root.querySelectorAll('.dk-chart-mark[role="img"]')].map((m) => m.getAttribute("aria-label"))

  it("names each data index's values, and shows the one marked", () => {
    const { container } = render(() => (
      <AreaChart data={rows} config={config} markerIndex={1}>
        <Area dataKey="sales" />
        <Area dataKey="costs" />
      </AreaChart>
    ))
    expect(labels(container)).toEqual(["Jan: Sales 10, Costs 4", "Feb: Sales 30, Costs 8", "Mar: Sales 20, Costs 6"])
    const marked = container.querySelectorAll(".dk-chart-mark[data-marked]")
    expect(marked.length).toBe(1)
    expect([...marked[0].querySelectorAll(".dk-chart-value")].map((t) => t.textContent)).toEqual([
      "Sales 30",
      "Costs 8",
    ])
  })

  it("names every bar and every slice, and leaves the values to a composed tooltip", () => {
    const bars = render(() => (
      <BarChart data={rows} config={config}>
        <Bar dataKey="sales" />
        <Tooltip />
      </BarChart>
    ))
    expect(labels(bars.container)).toContain("Feb: Sales 30")
    expect(bars.container.querySelector("svg.dk-chart")!.hasAttribute("data-tooltip")).toBe(true)
    const pie = render(() => (
      <PieChart data={slices} config={sliceConfig} dataKey="value" nameKey="name">
        <Pie />
      </PieChart>
    ))
    expect(labels(pie.container)).toEqual(["Web: 60 (60%)", "App: 40 (40%)"])
    expect(pie.container.querySelector("svg.dk-chart")!.hasAttribute("data-tooltip")).toBe(false)
  })

  it("draws none where the pointer does not read the chart", () => {
    const { container } = render(() => <Sparkline data={[1, 3, 2]} color="blue" />)
    expect(container.querySelectorAll(".dk-chart-mark").length).toBe(0)
  })
})

describe("Legend", () => {
  it("lists the series by label, as plain keys unless it can be pressed", () => {
    const { container, queryAllByRole } = render(() => (
      <AreaChart data={rows} config={config}>
        <Area dataKey="sales" />
        <Legend />
      </AreaChart>
    ))
    expect(queryAllByRole("button")).toEqual([])
    expect(container.textContent).toContain("Sales")
    expect(container.textContent).toContain("Costs")
  })

  it("selects a series when pressed, dims the others, and clears on a second press", () => {
    const picked: (string | null)[] = []
    const { getByRole } = render(() => (
      <AreaChart data={rows} config={config} onSelectionChange={(key) => picked.push(key)}>
        <Area dataKey="sales" />
        <Area dataKey="costs" />
        <Legend isClickable />
      </AreaChart>
    ))
    const sales = getByRole("button", { name: "Sales" })
    const costs = getByRole("button", { name: "Costs" })
    expect(sales.getAttribute("type")).toBe("button")
    fireEvent.click(sales)
    expect(picked).toEqual(["sales"])
    expect(sales.className).not.toContain("opacity-40")
    expect(costs.className).toContain("opacity-40")
    fireEvent.click(sales)
    expect(picked).toEqual(["sales", null])
    expect(costs.className).not.toContain("opacity-40")
  })

  it("spotlights the series under the pointer or the focus, selection winning", () => {
    const { getByRole } = render(() => (
      <BarChart data={rows} config={config} defaultSelectedDataKey="costs">
        <Bar dataKey="sales" />
        <Bar dataKey="costs" />
        <Legend isClickable />
      </BarChart>
    ))
    const sales = getByRole("button", { name: "Sales" })
    const costs = getByRole("button", { name: "Costs" })
    expect(sales.className).toContain("opacity-40")
    fireEvent.pointerEnter(sales)
    expect(sales.className).toContain("opacity-40")
    fireEvent.click(costs)
    expect(sales.className).not.toContain("opacity-40")
    fireEvent.focus(sales)
    expect(costs.className).toContain("opacity-40")
    fireEvent.blur(sales)
    expect(costs.className).not.toContain("opacity-40")
  })

  it("lists a pie's slices", () => {
    const { getByRole } = render(() => (
      <PieChart data={slices} config={sliceConfig} dataKey="value" nameKey="name">
        <Pie />
        <Legend isClickable align="center" />
      </PieChart>
    ))
    expect(getByRole("button", { name: "Web" }).parentElement!.className).toContain("justify-center")
    expect(getByRole("button", { name: "App" })).toBeTruthy()
  })
})

describe("Tooltip", () => {
  it("shows the hovered index's rows under its heading, and leaves with the pointer", async () => {
    const hovered: (number | null)[] = []
    const { container } = await shown(() => (
      <AreaChart data={rows} config={config} onHoverChange={(i) => hovered.push(i)}>
        <Area dataKey="sales" />
        <Area dataKey="costs" />
        <Tooltip labelKey="month" valueFormatter={(v, name) => `${name}=${v}`} />
      </AreaChart>
    ))
    const root = container.firstElementChild!
    expect(container.querySelector(".dk-tooltip-card")).toBeNull()
    fireEvent.pointerEnter(root)
    // the plot is 252 wide past a 36px margin: 162 is its middle, the second row
    fireEvent.pointerMove(root, { clientX: 162 })
    expect(hovered).toEqual([1])
    const card = container.querySelector(".dk-tooltip-card")!
    expect(card.className).toContain("bg-popover")
    expect(card.firstElementChild!.textContent).toBe("Feb")
    expect(card.textContent).toContain("Sales")
    expect(card.textContent).toContain("sales=30")
    expect(card.textContent).toContain("costs=8")
    await w.frame(150)
    fireEvent.pointerLeave(root)
    expect(hovered).toEqual([1, null])
    await w.frame(200)
    await w.frame(300)
    expect(container.querySelector(".dk-tooltip-card")).toBeNull()
  })

  it("dims the rows a selection leaves out", async () => {
    const { container } = await shown(() => (
      <BarChart data={rows} config={config} defaultSelectedDataKey="sales">
        <Bar dataKey="sales" />
        <Bar dataKey="costs" />
        <Tooltip variant="frosted-glass" />
      </BarChart>
    ))
    fireEvent.pointerMove(container.firstElementChild!, { clientX: 40 })
    const card = container.querySelector<HTMLElement>(".dk-tooltip-card")!
    expect(card.className).toContain("backdrop-blur-sm")
    const lines = [...card.querySelectorAll<HTMLElement>(".tabular-nums")]
    expect(lines.map((l) => l.style.opacity)).toEqual(["1", "0.4"])
    expect(lines[0].textContent).toBe("Sales10")
  })
})

describe("a series you can press", () => {
  it("selects itself, and lets go on a second press", async () => {
    const picked: (string | null)[] = []
    const { container } = await shown(() => (
      <BarChart data={rows} config={config} onSelectionChange={(key) => picked.push(key)}>
        <Bar dataKey="sales" isClickable />
      </BarChart>
    ))
    const hit = container.querySelectorAll<SVGRectElement>('rect[style*="cursor"]')
    expect(hit.length).toBe(rows.length)
    fireEvent.click(hit[0])
    fireEvent.click(hit[1])
    expect(picked).toEqual(["sales", null])
  })
})

describe("a part outside its chart root", () => {
  const thrown = (ui: () => JSX.Element) => {
    try {
      render(ui)
    } catch (e) {
      return (e as Error).message
    }
    return null
  }
  it("says which root it belongs in", () => {
    expect(thrown(() => <Grid />)).toBe("<Grid /> must be used within a chart root.")
    expect(thrown(() => <XAxis />)).toBe("<XAxis /> must be used within a chart root.")
    expect(thrown(() => <YAxis />)).toBe("<YAxis /> must be used within a chart root.")
    expect(thrown(() => <Area dataKey="a" />)).toBe("<Area /> must be used within <AreaChart />.")
    expect(thrown(() => <Line dataKey="a" />)).toBe("<Line /> must be used within <LineChart />.")
    expect(thrown(() => <Bar dataKey="a" />)).toBe("<Bar /> must be used within <BarChart />.")
    expect(thrown(() => <Pie />)).toBe("<Pie /> must be used within <PieChart />.")
    expect(thrown(() => <Radar dataKey="a" />)).toBe("<Radar /> must be used within <RadarChart />.")
    expect(thrown(() => <RadarFrame />)).toBe("Polar chart parts must be used within a polar chart root.")
    expect(thrown(() => <Dot />)).toBe("Chart parts must be used within a chart root (e.g. <AreaChart />).")
    expect(thrown(() => <Legend />)).toBe("<Legend /> / <Tooltip /> must be used within a chart root.")
    expect(thrown(() => <Tooltip />)).toBe("<Legend /> / <Tooltip /> must be used within a chart root.")
  })

  it("names the root it was wrongly put in", () => {
    expect(
      thrown(() => (
        <AreaChart data={rows} config={config}>
          <Bar dataKey="sales" />
        </AreaChart>
      )),
    ).toBe("<Bar /> is not valid inside <AreaChart /> — it belongs in <BarChart />.")
    expect(
      thrown(() => (
        <PieChart data={slices} config={sliceConfig} dataKey="value" nameKey="name">
          <Radar dataKey="web" />
        </PieChart>
      )),
    ).toBe("<Radar /> is not valid inside <PieChart /> — it belongs in <RadarChart />.")
    expect(
      thrown(() => (
        <AreaChart data={rows} config={config}>
          <Dot />
        </AreaChart>
      )),
    ).toBe("<Dot /> must be rendered inside a series (e.g. <Area />).")
  })
})

// `<Radar>` inside a `<RadarChart>` is the chart's series part, which
// registers its texture with the chart; the sweep background is
// `DitherRadar` and has a file of its own, so the two never collide.
describe("Radar", () => {
  it("registers each series' texture with its chart", () => {
    let seen: ((key: string) => unknown) | null = null
    const Probe = () => {
      seen = usePolarPart("Probe", "radar").variantOf
      return <g />
    }
    const { container } = render(() => (
      <RadarChart data={[{ axis: "a", now: 1 }]} config={{ now: { label: "Now", color: "blue" } }} nameKey="axis">
        <Radar dataKey="now" variant="dotted" />
        <Probe />
      </RadarChart>
    ))
    expect(seen!("now")).toBe("dotted")
    // No background runtime is mounted inside the chart.
    expect(container.querySelector("canvas")).toBeNull()
  })

  it("is not the sweep background", () => {
    expect(Radar).not.toBe(RadarSweep)
  })
})

// A sparkline scrubs only when asked: interactive, the pointer reports the
// point under it and leaving reports null; by default it reports nothing.
describe("Sparkline scrub", () => {
  const data = [1, 3, 2, 5, 4]
  const hover = (interactive: boolean) => {
    const seen: (number | null)[] = []
    const { container } = render(() => (
      <Sparkline data={data} color="blue" interactive={interactive} onHoverChange={(i) => seen.push(i)} />
    ))
    const root = container.firstElementChild!
    fireEvent.pointerEnter(root)
    fireEvent.pointerMove(root, { clientX: 0 })
    fireEvent.pointerLeave(root)
    return seen
  }

  it("reports the point under the pointer, then null on leave", () => {
    const seen = hover(true)
    expect(seen.length).toBe(2)
    expect(typeof seen[0]).toBe("number")
    expect(seen[1]).toBeNull()
  })

  it("stays still by default", () => {
    // Leaving reports null whatever the mode; no point is ever reported.
    expect(hover(false).filter((i) => i !== null)).toEqual([])
  })

  it("is a slider for the keyboard when interactive: arrows step, Home and End jump, Escape clears", () => {
    const seen: (number | null)[] = []
    const { getByRole } = render(() => (
      <Sparkline data={data} color="blue" interactive label="Revenue" onHoverChange={(i) => seen.push(i)} />
    ))
    const root = getByRole("slider", { name: "Revenue" })
    expect(root.getAttribute("tabindex")).toBe("0")
    expect(root.className).toContain("focus-visible:ring-ring")
    expect(root.getAttribute("aria-valuemax")).toBe("4")
    for (const key of ["ArrowLeft", "ArrowLeft"]) fireEvent.keyDown(root, { key })
    expect(root.getAttribute("aria-valuenow")).toBe("2")
    expect(root.getAttribute("aria-valuetext")).toBe("2")
    for (const key of ["Home", "End", "Escape"]) fireEvent.keyDown(root, { key })
    expect(seen).toEqual([3, 2, 0, 4, null])
    expect(root.getAttribute("aria-valuenow")).toBe("4")
  })

  it("lets go of the keyed point as focus leaves", () => {
    const seen: (number | null)[] = []
    const { getByRole } = render(() => (
      <Sparkline data={data} color="blue" interactive onHoverChange={(i) => seen.push(i)} />
    ))
    const root = getByRole("slider", { name: "Series" })
    fireEvent.keyDown(root, { key: "Home" })
    fireEvent.blur(root)
    expect(seen).toEqual([0, null])
  })

  it("takes no focus and no role when still", () => {
    const { container } = render(() => <Sparkline data={data} color="blue" />)
    const root = container.firstElementChild!
    expect(root.getAttribute("role")).toBeNull()
    expect(root.getAttribute("tabindex")).toBeNull()
  })
})
