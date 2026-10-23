// @rstest-environment jsdom
import { describe, expect, it, rs } from "rstack/test"
import { flushPromises, mount } from "@vue/test-utils"
import { h, nextTick } from "vue"
import DemoCard from "@/pages/docs/DemoCard.vue"
import { contrast, formatColor, grade, hex, over, parseColor } from "@/widgets/workbench/model/color"
import { boxFrom, distances, dock, snap } from "@/widgets/workbench/model/geometry"
import { encodeGif, lzw, medianCut, quantize } from "@/widgets/workbench/model/gif"
import { arrowPaths, erase, hitLine, inkOutline, pressures, type InkPoint } from "@/widgets/workbench/model/ink"
import {
  controlOf,
  focusOrder,
  labelOf,
  nameOf,
  pathOf,
  resolvePath,
  roleOf,
  selectorOf,
  statesOf,
  walk,
} from "@/widgets/workbench/model/measure"
import { DEFAULT_SETTINGS, normalizeSettings } from "@/widgets/workbench/model/settings"
import {
  createHistory,
  emptyWorkspace,
  feedbackMarkdown,
  normalizeWorkspace,
  type Workspace,
} from "@/widgets/workbench/model/workspace"

describe("workbench colour", () => {
  it("reads every form a browser computes", () => {
    expect(parseColor("rgb(237, 237, 237)")).toEqual({ r: 237, g: 237, b: 237, a: 1 })
    expect(parseColor("rgba(31, 111, 214, 0.5)")).toEqual({ r: 31, g: 111, b: 214, a: 0.5 })
    expect(parseColor("rgb(31 111 214 / 50%)")).toEqual({ r: 31, g: 111, b: 214, a: 0.5 })
    expect(parseColor("#1f6fd6")).toEqual({ r: 31, g: 111, b: 214, a: 1 })
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 })
    expect(parseColor("transparent")?.a).toBe(0)
    // oklab/oklch round-trip close to sRGB white and the kit's ember.
    expect(parseColor("oklab(1 0 0)")).toEqual({ r: 255, g: 255, b: 255, a: 1 })
    const ember = parseColor(formatColor({ r: 255, g: 150, b: 50, a: 1 }, "oklch"))!
    expect(Math.abs(ember.r - 255) + Math.abs(ember.g - 150) + Math.abs(ember.b - 50)).toBeLessThanOrEqual(3)
    expect(parseColor("color(srgb 1 0 0)")).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    expect(parseColor("not a colour")).toBeNull()
  })

  it("prints the formats a reader copies", () => {
    const c = { r: 31, g: 111, b: 214, a: 1 }
    expect(formatColor(c, "hex")).toBe("#1f6fd6")
    expect(formatColor(c, "rgb")).toBe("rgb(31 111 214)")
    expect(formatColor({ ...c, a: 0.5 }, "rgb")).toBe("rgb(31 111 214 / 0.5)")
    expect(formatColor(c, "hsl")).toMatch(/^hsl\(213(\.\d)? \d+(\.\d)?% \d+(\.\d)?%\)$/)
    expect(formatColor(c, "oklch")).toMatch(/^oklch\(\d+(\.\d)?% 0\.\d+ \d+(\.\d)?\)$/)
    expect(hex("rgba(0, 0, 0, 0)")).toBe("transparent")
    expect(hex("rgb(31 111 214 / 50%)")).toBe("#1f6fd680")
  })

  it("grades contrast by WCAG", () => {
    const white = { r: 255, g: 255, b: 255, a: 1 }
    const black = { r: 0, g: 0, b: 0, a: 1 }
    expect(contrast(black, white)).toBeCloseTo(21, 5)
    expect(contrast(white, white)).toBeCloseTo(1, 5)
    expect(grade(4.6, false)).toEqual({ aa: true, aaa: false })
    expect(grade(3.2, true)).toEqual({ aa: true, aaa: false })
    expect(grade(3.2, false).aa).toBe(false)
    expect(over({ r: 255, g: 255, b: 255, a: 0.5 }, black)).toEqual({ r: 128, g: 128, b: 128, a: 1 })
  })
})

describe("workbench geometry", () => {
  const a = { x: 0, y: 0, w: 100, h: 40 }
  it("measures a gap between separate boxes on each axis", () => {
    const right = distances(a, { x: 130, y: 10, w: 20, h: 20 })
    expect(right).toEqual([{ x1: 100, y1: 20, x2: 130, y2: 20, value: 30 }])
    const below = distances(a, { x: 0, y: 64, w: 100, h: 20 })
    expect(below.map((s) => s.value)).toEqual([24])
  })
  it("measures the four insets of nested boxes", () => {
    const inner = { x: 10, y: 5, w: 60, h: 20 }
    expect(
      distances(inner, a)
        .map((s) => s.value)
        .sort((p, q) => p - q),
    ).toEqual([5, 10, 15, 30])
  })
  it("adds a dashed extension when separate boxes share no span", () => {
    const segs = distances(a, { x: 140, y: 80, w: 20, h: 20 })
    expect(segs.some((s) => s.dashed)).toBe(true)
    expect(segs.filter((s) => !s.dashed).map((s) => s.value)).toEqual([40, 40])
  })
  it("snaps and docks within the threshold only", () => {
    expect(snap(103, [100, 200], 5)).toEqual({ value: 100, to: 100 })
    expect(snap(110, [100, 200], 5)).toEqual({ value: 110, to: null })
    expect(dock({ x: 52, y: 22 }, [a], 8)).toEqual({ x: 50, y: 20 })
    expect(dock({ x: 300, y: 300 }, [a], 8)).toBeNull()
    expect(boxFrom({ x: 10, y: 20 }, { x: 4, y: 2 })).toEqual({ x: 4, y: 2, w: 6, h: 18 })
  })
})

describe("workbench ink", () => {
  const line: InkPoint[] = Array.from({ length: 12 }, (_, i) => [i * 10, 0, i * 16, -1])
  it("thins fast strokes and keeps pen pressure", () => {
    const slow = pressures(Array.from({ length: 12 }, (_, i) => [i * 2, 0, i * 40, -1]))
    const fast = pressures(Array.from({ length: 12 }, (_, i) => [i * 40, 0, i * 8, -1]))
    expect(fast.at(-1)!).toBeLessThan(slow.at(-1)!)
    expect(pressures([[0, 0, 0, 0.3]])).toEqual([0.3])
  })
  it("outlines ink as one closed path and a dot as a circle", () => {
    expect(inkOutline(line, 4)).toMatch(/^M[\d.-]+ [\d.-]+.*Z$/)
    expect(inkOutline([[5, 5, 0, -1]], 4)).toMatch(/a[\d.]+ [\d.]+ 0 1 0/)
  })
  it("erases only what the eraser passes over", () => {
    expect(erase(line, { x: 55, y: 0 }, 6)).toHaveLength(2)
    expect(erase(line, { x: 500, y: 500 }, 6)).toEqual([line])
    expect(erase(line, { x: 55, y: 0 }, 1000)).toEqual([])
  })
  it("hit-tests lines and builds arrows", () => {
    const pts = line.map(([x, y]) => ({ x, y }))
    expect(hitLine(pts, { x: 33, y: 3 }, 4)).toBe(true)
    expect(hitLine(pts, { x: 33, y: 9 }, 4)).toBe(false)
    const { shaft, head } = arrowPaths({ x: 0, y: 0 }, { x: 100, y: 0 }, 2)
    expect(shaft).toMatch(/^M0 0L\d/)
    expect(head).toMatch(/^M100 0L.*Z$/)
  })
})

/** GIF LZW, decoded: the sub-blocks of one image back into indices. */
function unlzw(data: Uint8Array): number[] {
  const min = data[0]
  const bytes: number[] = []
  for (let i = 1; data[i]; i += data[i] + 1) bytes.push(...data.subarray(i + 1, i + 1 + data[i]))
  const clear = 1 << min
  let size = min + 1
  let table: number[][] = []
  const reset = () => {
    table = Array.from({ length: clear + 2 }, (_, i) => [i])
    size = min + 1
  }
  reset()
  const out: number[] = []
  let prev: number[] | null = null
  let bit = 0
  while (bit + size <= bytes.length * 8) {
    let code = 0
    for (let k = 0; k < size; k++, bit++) code |= ((bytes[bit >> 3] >> (bit & 7)) & 1) << k
    if (code === clear) {
      reset()
      prev = null
      continue
    }
    if (code === clear + 1) break
    const entry: number[] = table[code] ?? (prev ? [...prev, prev[0]] : [])
    out.push(...entry)
    if (prev) table.push([...prev, entry[0]])
    prev = entry
    if (table.length === 1 << size && size < 12) size++
  }
  return out
}

describe("workbench GIF", () => {
  it("round-trips LZW, including table resets", () => {
    const short = Uint8Array.from([1, 1, 1, 2, 2, 3, 1, 1, 1, 2])
    expect(unlzw(lzw(short))).toEqual([...short])
    const long = Uint8Array.from({ length: 20000 }, (_, i) => (i * 7919) % 251)
    expect(unlzw(lzw(long))).toEqual([...long])
  })
  it("finds the colours a frame holds and dithers between them by the Bayer matrix", () => {
    const palette = medianCut([0x000000, 0x000000, 0xffffff, 0xffffff], 2)
    expect(palette).toEqual([
      [0, 0, 0],
      [255, 255, 255],
    ])
    // A flat mid grey over 8×8 pixels becomes a pattern of both colours.
    const grey = new Uint8ClampedArray(8 * 8 * 4).fill(128)
    const idx = quantize(grey, 8, palette, 255)
    expect(new Set(idx).size).toBe(2)
  })
  it("writes a looping GIF89a", () => {
    const frame = new Uint8ClampedArray(4 * 2 * 4).fill(255)
    const gif = encodeGif([frame, frame], 4, 2, 8)
    expect(String.fromCharCode(...gif.subarray(0, 6))).toBe("GIF89a")
    expect(gif[6] | (gif[7] << 8)).toBe(4)
    expect(gif[8] | (gif[9] << 8)).toBe(2)
    expect(String.fromCharCode(...gif.subarray(13 + 768 + 3, 13 + 768 + 14))).toBe("NETSCAPE2.0")
    expect(gif.at(-1)).toBe(0x3b)
  })
})

describe("workbench workspace", () => {
  it("sanitizes untrusted storage", () => {
    const ws = normalizeWorkspace({
      guides: [{ id: "g1", axis: "x", at: 120 }, { axis: "z", at: 1 }, "junk"],
      arrows: [{ from: { x: 1, y: 2 }, to: { x: 3, y: 4 }, color: "javascript:alert(1)", width: 99 }],
      notes: [{ at: { x: 5, y: 5 }, text: "hi", color: "#ff9632" }],
      threads: [
        { anchor: { path: [0, 1], selector: "button", label: "button", box: {} }, messages: [{ text: "x" }] },
        { anchor: {}, messages: [] },
      ],
      grid: { columns: 1e9, show: { columns: true } },
    })
    expect(ws.guides).toEqual([{ id: "g1", axis: "x", at: 120 }])
    expect(ws.arrows[0].color).toBe("var(--swatch-orange)")
    expect(ws.arrows[0].width).toBe(12)
    expect(ws.notes[0].color).toBe("#ff9632")
    expect(ws.threads).toHaveLength(1)
    expect(ws.grid.columns).toBe(48)
    expect(ws.grid.show.columns).toBe(true)
    expect(normalizeWorkspace("nope")).toEqual(emptyWorkspace())
  })

  it("undoes and redoes by snapshot, and drops a gesture that changed nothing", () => {
    const history = createHistory()
    let ws: Workspace = emptyWorkspace()
    history.record(ws)
    ws = { ...ws, guides: [{ id: "g", axis: "y", at: 40 }] }
    expect(history.canUndo).toBe(true)
    ws = history.undo(ws)!
    expect(ws.guides).toEqual([])
    ws = history.redo(ws)!
    expect(ws.guides).toHaveLength(1)
    history.record(ws)
    history.drop()
    expect(history.undo(ws)!.guides).toEqual([])
  })

  it("writes the hand-off an agent reads", () => {
    const ws = normalizeWorkspace({
      threads: [
        {
          id: "t1",
          n: 1,
          anchor: {
            path: [0],
            selector: "#button button",
            label: "button “Deploy”",
            box: { x: 10, y: 20, w: 90, h: 32 },
          },
          messages: [{ text: "needs a busy state" }, { text: "agreed" }],
        },
      ],
      guides: [{ axis: "x", at: 24 }],
      notes: [{ at: { x: 1, y: 2 }, text: "bolder" }],
    })
    const md = feedbackMarkdown(ws, {
      title: "Button",
      url: "https://dither-ui.com/docs/button",
      stage: { w: 640, h: 280 },
      theme: "dark",
    })
    expect(md).toContain("# Feedback — Button")
    expect(md).toContain("1. button “Deploy” — `#button button` at 10,20 90×32")
    expect(md).toContain("   > needs a busy state")
    expect(md).toContain("   - reply: agreed")
    expect(md).toContain("- vertical at 24 px")
    expect(md).toContain("note at 1,2: “bolder”")
  })

  it("keeps settings inside their choices", () => {
    expect(normalizeSettings({ highlight: "magenta", inkWidth: 400, format: "oklch", stills: "screen" })).toMatchObject(
      {
        highlight: DEFAULT_SETTINGS.highlight,
        inkWidth: 24,
        format: "oklch",
        stills: "screen",
      },
    )
  })
})

describe("workbench DOM readings", () => {
  it("names, walks, paths and selects elements", () => {
    document.body.innerHTML = `<div id="root"><nav aria-label="Main"><button aria-label="Save"><canvas></canvas></button><a href="/x">Docs</a></nav><p><span>a</span><span>b</span></p></div>`
    const root = document.getElementById("root")!
    const [nav, p] = root.children
    const button = nav.children[0]
    const canvas = button.children[0]
    expect(labelOf(button)).toBe("button “Save”")
    expect(walk(button, root, "next")).toBe(nav.children[1])
    expect(walk(nav, root, "up")).toBeNull()
    expect(resolvePath(root, pathOf(canvas, root))).toBe(canvas)
    expect(selectorOf(p.children[1], root)).toBe("p > span:nth-of-type(2)")
    expect(selectorOf(button, root)).toBe('nav > button[aria-label="Save"]')
    expect(controlOf(canvas, root)).toBe(button)
    expect(controlOf(p.children[0], root)).toBe(p.children[0])
  })

  it("reads roles, accessible names and states", () => {
    document.body.innerHTML = `<label for="f">Email</label><input id="f" type="email" required>
      <button aria-pressed="true">Bold</button><h2>Title</h2><img src="x.png"><a href="#">More</a><div role="switch" aria-checked="false"></div>`
    const [, input, button, h2, img, a, sw] = document.body.children
    expect(roleOf(input)).toBe("textbox")
    expect(nameOf(input)).toBe("Email")
    expect(statesOf(input)).toContain("required")
    expect(roleOf(button)).toBe("button")
    expect(nameOf(button)).toBe("Bold")
    expect(statesOf(button)).toContain("pressed=true")
    expect(roleOf(h2)).toBe("heading")
    expect(statesOf(h2)).toContain("level=2")
    expect(roleOf(img)).toBe("img")
    expect(nameOf(img)).toBe("")
    expect(roleOf(a)).toBe("link")
    expect(nameOf(sw)).toBe("")
  })

  it("orders Tab stops: positive tabindex first, then the document", () => {
    document.body.innerHTML = `<div id="r"><button>a</button><button tabindex="2">b</button><button disabled>c</button><span tabindex="0">d</span><button tabindex="1">e</button></div>`
    const r = document.getElementById("r")!
    // jsdom lays nothing out; give every element a box so none reads as hidden.
    rs.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      width: 10,
      height: 10,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 10,
      bottom: 10,
      toJSON() {},
    } as DOMRect)
    expect(focusOrder(r).map((el) => el.textContent)).toEqual(["e", "b", "a", "d"])
    rs.restoreAllMocks()
  })
})

describe("the workbench on a docs preview", () => {
  it("opens from Inspect, switches tools by key and by tray, and steps out with Escape", async () => {
    rs.stubGlobal("IntersectionObserver", undefined)
    localStorage.clear()
    const card = mount(DemoCard, {
      props: { code: "<DitherButton />" },
      slots: { default: () => h("button", { "aria-label": "Deploy" }) },
      attachTo: document.body,
    })
    await nextTick()
    const toggle = card.findAll("button").find((b) => b.text() === "Inspect")!
    await toggle.trigger("click")
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))
    await flushPromises()
    const tray = document.querySelector('[role="toolbar"][aria-label="Workbench tools"]')
    expect(tray).not.toBeNull()
    const pressed = () =>
      [...tray!.querySelectorAll('button[aria-pressed="true"]')].map((b) => b.getAttribute("aria-label"))
    expect(pressed()).toContain("Inspect (I)")

    const host = card.get('[role="group"]').element as HTMLElement
    host.focus()
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }))
    await nextTick()
    expect(pressed()).toContain("X-ray (X)")
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "2" }))
    await nextTick()
    expect(tray!.querySelector('[aria-label="Arrow (D)"]')).not.toBeNull()
    ;(tray!.querySelector('[aria-label="Comment (M)"]') as HTMLButtonElement).click()
    await nextTick()
    expect(pressed()).toContain("Comment (M)")
    expect(card.text()).toContain("click an element to start a thread on it")

    // Escape: the tool goes, then the workbench closes and focus returns.
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    await nextTick()
    expect(pressed().some((l) => l?.startsWith("Comment"))).toBe(false)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    await flushPromises()
    expect(document.querySelector('[aria-label="Workbench tools"]')).toBeNull()
    expect(toggle.attributes("aria-pressed")).toBe("false")
    card.unmount()
    rs.unstubAllGlobals()
  })
})
