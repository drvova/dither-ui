// The keyboard paths several components share (`engine/keys.ts`): a menu's
// arrows and Escape, a modal's Tab trap (Shift+Tab as WebKitGTK names it
// included), a roving group's arrows past disabled options and a slider's
// steps, each read the one way every component that has it reads it.
import { afterEach, describe, expect, it } from "rstack/test"
import { menuKeys, moveFocus, nextEnabled, rovingKeys, sliderKeys, trapKeys } from "../src/engine/keys"

type Key = { key: string; code?: string; shiftKey?: boolean }

/** A key event that remembers what was done with it. */
function press(k: Key) {
  const e = {
    key: k.key,
    code: k.code ?? k.key,
    shiftKey: !!k.shiftKey,
    prevented: false,
    stopped: false,
    preventDefault() {
      e.prevented = true
    },
    stopPropagation() {
      e.stopped = true
    },
  }
  return e as typeof e & KeyboardEvent
}

/** Elements focus moves between, the focused one standing as the page's. */
const page = globalThis as { document?: { activeElement: unknown } }
const had = "document" in page
const saved = page.document
afterEach(() => {
  if (had) page.document = saved
  else delete page.document
})
function elements(n: number) {
  page.document = { activeElement: null }
  const doc = page.document
  return Array.from({ length: n }, (_, i) => {
    const el = { i, isConnected: true, focus: () => (doc.activeElement = el) }
    return el
  }) as unknown as HTMLElement[]
}

describe("the shared keyboard paths", () => {
  it("walks to the next enabled option, wrapping, and -1 with none", () => {
    const options = [{}, { disabled: true }, {}, { disabled: true }]
    expect(nextEnabled(options, 0, 1)).toBe(2)
    expect(nextEnabled(options, 2, 1)).toBe(0)
    expect(nextEnabled(options, 0, -1)).toBe(2)
    expect(nextEnabled([{ disabled: true }], 0, 1)).toBe(-1)
    expect(nextEnabled([], -1, 1)).toBe(-1)
  })

  it("moves a roving group on the arrows only", () => {
    const options = [{}, { disabled: true }, {}]
    const right = press({ key: "ArrowRight" })
    expect(rovingKeys(right, options, 0)).toBe(2)
    expect(right.prevented).toBe(true)
    expect(rovingKeys(press({ key: "ArrowUp" }), options, 0)).toBe(2)
    const enter = press({ key: "Enter" })
    expect(rovingKeys(enter, options, 0)).toBe(-1)
    expect(enter.prevented).toBe(false)
  })

  it("steps a slider by a step, ten, or to its bounds", () => {
    const s = { value: 50, step: 2, min: 0, max: 100 }
    expect(sliderKeys(press({ key: "ArrowLeft" }), s)).toBe(48)
    expect(sliderKeys(press({ key: "ArrowUp" }), s)).toBe(52)
    expect(sliderKeys(press({ key: "PageDown" }), s)).toBe(30)
    expect(sliderKeys(press({ key: "PageUp" }), s)).toBe(70)
    expect(sliderKeys(press({ key: "Home" }), s)).toBe(0)
    expect(sliderKeys(press({ key: "End" }), s)).toBe(100)
    const tab = press({ key: "Tab" })
    expect(sliderKeys(tab, s)).toBe(null)
    expect(tab.prevented).toBe(false)
  })

  it("walks a menu's items and closes it on Escape", () => {
    const items = elements(3)
    let closed = 0
    menuKeys(press({ key: "ArrowDown" }), items, () => closed++)
    expect(page.document?.activeElement).toBe(items[0])
    menuKeys(press({ key: "ArrowUp" }), items, () => closed++)
    expect(page.document?.activeElement).toBe(items[2])
    moveFocus([undefined, items[0], items[2]], 1)
    expect(page.document?.activeElement).toBe(items[0])
    const esc = press({ key: "Escape" })
    menuKeys(esc, items, () => closed++)
    expect(closed).toBe(1)
    expect(esc.stopped).toBe(true)
  })

  it("keeps Tab inside a modal, Shift+Tab read by its code too", () => {
    const items = elements(3)
    items[2].focus()
    const tab = press({ key: "Tab" })
    trapKeys(tab, items, () => {})
    expect(tab.prevented).toBe(true)
    expect(page.document?.activeElement).toBe(items[0])
    // WebKitGTK: Shift+Tab is "Unidentified" with the code Tab.
    const back = press({ key: "Unidentified", code: "Tab", shiftKey: true })
    trapKeys(back, items, () => {})
    expect(back.prevented).toBe(true)
    expect(page.document?.activeElement).toBe(items[2])
    const inner = press({ key: "Tab", shiftKey: true })
    trapKeys(inner, items, () => {})
    expect(inner.prevented).toBe(false)
    const empty = press({ key: "Tab" })
    trapKeys(empty, [], () => {})
    expect(empty.prevented).toBe(true)
  })
})
