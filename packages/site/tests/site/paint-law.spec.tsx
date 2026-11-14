// The paint law: a surface updated in place paints the same pixels as one
// mounted fresh with the same props at the same clock time.
//
// Every row of the component registry is put on the canvas as the Studio
// puts it (`WidgetRenderer`, its props a store the inspector writes), under
// a `DitherScreen`, in a box of the row's frame, with the kit clock directed
// to one moment. After a settle, ONE input is changed in place and a second
// copy is mounted with that input from the start; both settle together and
// what they show is compared: every canvas's paint (`@dither-ui/kit/testing/
// paint.ts`: what each canvas shows, uploads by their pixels) and the DOM
// (attributes in order, generated ids by first appearance). A difference is
// a failure named `<Component>.<input>`.
//
// The inputs: every prop the row declares, its second value made from its
// spec (a boolean flipped, a number halfway to its bound, the next option,
// another colour, a list reversed, a text that reads as a value from
// `TEXT_SAMPLES`), then the surroundings: the print screen, the theme and
// the box. First of all nothing: two copies that differ with nothing
// changed fail as `<Component>.<none>` (it runs on a timer the kit clock
// does not drive).
import { render } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { createMutable } from "solid-js/store"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { DitherScreen, type ScreenKind } from "@dither-ui/kit"
import { release, seek } from "@dither-ui/kit/engine/clock.ts"
import { paintOf, recordPaint } from "@dither-ui/kit/testing/paint.ts"
import { createComponent } from "@/entities/widget/model/factory"
import type { ComponentModel } from "@/entities/widget/model/types"
import { COMPONENT_REGISTRY, type ComponentEntry, type PropSpec, TEXT_SAMPLES } from "@/entities/widget/model/registry"
import { WidgetRenderer } from "../../src/widgets/frame-renderer"

/** The kit clock's moment, ms: past every entrance. */
const MOMENT = 2400
/** How long a copy runs before it is changed, and both after: every
 * transition and spring the kit runs on wall time is at rest by then. */
const SETTLE = 2000

// jsdom lays nothing out. Here an element's box on an axis is the nearest
// fixed Tailwind size on it or above it (`size-4`, `w-9`, `h-[30px]`), else
// the frame's, and text measures 8px a letter.
type Size = { w: number; h: number }
const frames = new Map<Element, Size>()
function fixedSize(el: Element, axis: "w" | "h"): number | null {
  const pattern = new RegExp(`^(?:size|${axis})-(?:(\\d+(?:\\.\\d+)?)|\\[(\\d+)px\\])$`)
  for (const c of el.classList) {
    const m = pattern.exec(c)
    if (m) return m[1] ? Number(m[1]) * 4 : Number(m[2])
  }
  return null
}
function sizeOf(el: Element): Size {
  const axis = (a: "w" | "h") => {
    for (let n: Element | null = el; n; n = n.parentElement) {
      const frame = frames.get(n)
      if (frame) return frame[a]
      const px = fixedSize(n, a)
      if (px != null) return px
    }
    return 0
  }
  return { w: axis("w"), h: axis("h") }
}

/** A resize observer as a browser runs one: it reports each element it
 * watches as it starts, then only when that box changed. */
class Observer {
  static all = new Set<Observer>()
  private seen = new Map<Element, string>()
  constructor(private cb: ResizeObserverCallback) {
    Observer.all.add(this)
  }
  observe(el: Element) {
    this.seen.set(el, "")
    queueMicrotask(() => this.report())
  }
  unobserve(el: Element) {
    this.seen.delete(el)
  }
  disconnect() {
    this.seen.clear()
    Observer.all.delete(this)
  }
  report() {
    const entries = [...this.seen].flatMap(([target, was]) => {
      const { w, h } = sizeOf(target)
      if (was === `${w}x${h}`) return []
      this.seen.set(target, `${w}x${h}`)
      const contentRect = { x: 0, y: 0, top: 0, left: 0, width: w, height: h, right: w, bottom: h }
      const box = [{ inlineSize: w, blockSize: h }]
      return [{ target, contentRect, borderBoxSize: box, contentBoxSize: box } as unknown as ResizeObserverEntry]
    })
    if (entries.length) this.cb(entries, this as unknown as ResizeObserver)
  }
}

let undoPaint: () => void
const scrollTo = Element.prototype.scrollTo
const textLength = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getComputedTextLength")
beforeAll(() => {
  undoPaint = recordPaint()
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
      "Date",
    ],
  })
  vi.stubGlobal("ResizeObserver", Observer)
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: false,
    media,
    addEventListener() {},
    removeEventListener() {},
  }))
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const { w, h } = sizeOf(this)
    return { x: 0, y: 0, top: 0, left: 0, width: w, height: h, right: w, bottom: h, toJSON() {} } as DOMRect
  })
  for (const [key, axis] of [
    ["clientWidth", "w"],
    ["clientHeight", "h"],
    ["offsetWidth", "w"],
    ["offsetHeight", "h"],
  ] as const)
    vi.spyOn(HTMLElement.prototype, key, "get").mockImplementation(function (this: HTMLElement) {
      return sizeOf(this)[axis]
    })
  Object.defineProperty(SVGElement.prototype, "getComputedTextLength", {
    configurable: true,
    value(this: SVGElement) {
      return (this.textContent ?? "").length * 8
    },
  })
  // A scroll lands at once and says so, as an instant one does.
  Element.prototype.scrollTo = function (this: Element, to?: ScrollToOptions | number, y?: number) {
    const top = typeof to === "number" ? y : to?.top
    if (top != null) this.scrollTop = top
    this.dispatchEvent(new Event("scroll"))
  }
  seek(MOMENT)
})
afterAll(() => {
  release()
  Element.prototype.scrollTo = scrollTo
  if (textLength) Object.defineProperty(SVGElement.prototype, "getComputedTextLength", textLength)
  else delete (SVGElement.prototype as { getComputedTextLength?: unknown }).getComputedTextLength
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  undoPaint()
})

/** A prop's second value, made from its spec. */
function secondValue(spec: PropSpec): unknown {
  switch (spec.kind) {
    case "boolean":
      return !spec.def
    case "number": {
      const step = spec.step ?? 1
      const toward = spec.max ?? (spec.def === 0 ? 4 * step : spec.def * 2)
      const v = Math.round((spec.def + (toward - spec.def) / 2) / step) * step
      return Number((v === spec.def ? (spec.min ?? spec.def - step) : v).toFixed(6))
    }
    case "select":
      return spec.options[(spec.options.indexOf(spec.def) + 1) % spec.options.length]
    case "color":
      return spec.def === "orange" ? "purple" : "orange"
    case "list":
      return spec.def.length > 1 ? [...spec.def].reverse() : [...spec.def, "Extra"]
    case "text":
      return TEXT_SAMPLES[spec.key] ?? (spec.def ? `${spec.def} too` : "Text")
    case "url":
      return "/faces.webp"
  }
}

type Surroundings = { screen: ScreenKind; size: Size; dark: boolean }
type Input = { name: string; apply: (widget: ComponentModel, around: Surroundings) => void }

/** Every input of a row: nothing, its props, then what stands around it. */
const inputsOf = (entry: ComponentEntry): Input[] => [
  { name: "<none>", apply: () => {} },
  ...entry.props.map((spec): Input => ({
    name: spec.key,
    apply: (widget) => void (widget.props[spec.key] = secondValue(spec)),
  })),
  { name: "<screen>", apply: (_, around) => void (around.screen = "dot") },
  { name: "<theme>", apply: (_, around) => void (around.dark = true) },
  {
    name: "<size>",
    apply: (_, around) =>
      void (around.size = { w: Math.round(around.size.w * 1.5), h: Math.round(around.size.h * 1.25) }),
  },
]

/** Attributes that name another element. */
const REFS = new Set([
  "id",
  "for",
  "name",
  "list",
  "form",
  "aria-controls",
  "aria-labelledby",
  "aria-describedby",
  "aria-activedescendant",
  "aria-owns",
  "aria-errormessage",
])

/** What a copy shows: every canvas's paint, in order, and its DOM with
 * attributes in order and generated ids by their first appearance. */
function shows(host: HTMLElement) {
  const ids = new Map<string, string>()
  const ref = (v: string) =>
    v
      .split(" ")
      .map((t) => ids.get(t) ?? (ids.set(t, `#${ids.size}`), ids.get(t)))
      .join(" ")
  const attr = (a: Attr) => {
    if (REFS.has(a.name)) return ref(a.value)
    if (a.name.endsWith("href") && a.value.startsWith("#")) return ref(a.value.slice(1))
    return a.value.replace(/url\((["']?)#([^)"']+)\1\)/g, (_, q: string, id: string) => `url(${q}${ref(id)}${q})`)
  }
  const dom = (n: Node): string => {
    if (n.nodeType === Node.TEXT_NODE) return n.textContent ?? ""
    if (!(n instanceof Element)) return ""
    const attrs = [...n.attributes].map((a) => `${a.name}="${attr(a)}"`).sort()
    return `<${n.localName} ${attrs.join(" ")}>${[...n.childNodes].map(dom).join("")}</${n.localName}>`
  }
  return { canvases: [...host.querySelectorAll("canvas")].map(paintOf).join("\n"), dom: dom(host) }
}

/** A copy of a row on the canvas, under a screen, in its frame, in a theme. */
function copy(entry: ComponentEntry, change?: Input) {
  const widget = createMutable(createComponent(entry))
  const [around, setAround] = createSignal<Surroundings>({ screen: "bayer", size: { ...entry.frame }, dark: false })
  const host = document.createElement("div")
  document.body.append(host)
  frames.set(host, around().size)
  /** Change an input in place, as the Studio's inspector does. */
  const apply = (input: Input) => {
    const next = { ...around(), size: { ...around().size } }
    input.apply(widget, next)
    setAround(next)
    frames.set(host, next.size)
    document.documentElement.classList.toggle("dark", next.dark)
    for (const o of Observer.all) o.report()
  }
  if (change) apply(change)
  const view = render(
    () => (
      <DitherScreen screen={around().screen}>
        <WidgetRenderer widget={widget} artboardId="a" />
      </DitherScreen>
    ),
    { container: host },
  )
  return {
    apply,
    shows: () => shows(host),
    dispose() {
      view.unmount()
      host.remove()
      frames.delete(host)
      document.documentElement.classList.remove("dark")
    },
  }
}

/** The row changed in place beside a copy mounted with the change, side by
 * side from the moment of the change, so a run either starts then starts
 * at the same time in both. Names the difference: canvas, DOM or a throw. */
async function differs(entry: ComponentEntry, input: Input): Promise<string | null> {
  const kept = copy(entry)
  try {
    await vi.advanceTimersByTimeAsync(SETTLE)
    kept.apply(input)
    const fresh = copy(entry, input)
    try {
      await vi.advanceTimersByTimeAsync(SETTLE)
      const [a, b] = [kept.shows(), fresh.shows()]
      return a.canvases !== b.canvases ? "canvas" : a.dom !== b.dom ? "dom" : null
    } finally {
      fresh.dispose()
    }
  } catch (e) {
    return `throws ${(e as Error).message}`
  } finally {
    kept.dispose()
  }
}

describe("the paint law: changed in place, a component paints what a fresh mount paints", () => {
  // A row mounts two copies of the Studio's renderer per input: an
  // integration-scale budget, as the reel renderer's.
  it.for(COMPONENT_REGISTRY.map((entry) => [entry.is, entry] as const))("%s", { timeout: 30000 }, async ([, entry]) => {
    const failures: string[] = []
    for (const input of inputsOf(entry)) {
      const how = await differs(entry, input)
      if (how) failures.push(`${entry.is}.${input.name} (${how})`)
    }
    expect(failures).toEqual([])
  })
})
