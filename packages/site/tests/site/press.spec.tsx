// The press (`shared/lib/press.ts`): a key marked down under the pointer,
// up once let go (never before its travel down has played), unmarked when
// its spring ends; a card only where nothing inside it takes the press;
// nothing under reduced motion or on a disabled key.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PRESS_DOWN_MS, installPress, pressedBy } from "@/shared/lib/press"

let reduced = false
let uninstall = () => {}
beforeEach(() => {
  reduced = false
  window.matchMedia = ((q: string) => ({ matches: reduced && q.includes("reduce") })) as unknown as typeof matchMedia
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] })
  uninstall = installPress(document)
})
afterEach(() => {
  uninstall()
  vi.useRealTimers()
  document.body.innerHTML = ""
})

const page = (html: string) => {
  document.body.innerHTML = html
  return (sel: string) => document.querySelector<HTMLElement>(sel)!
}
const pointer = (el: Element, type: string) =>
  el.dispatchEvent(Object.assign(new Event(type, { bubbles: true }), { isPrimary: true, button: 0 }))
const ended = (el: Element, animationName: string) =>
  el.dispatchEvent(Object.assign(new Event("animationend", { bubbles: true }), { animationName }))

describe("the press", () => {
  it("marks a key down, then up after its travel, then lets go when the spring ends", () => {
    const $ = page(`<button class="key"><span class="label">Go</span></button>`)
    pointer($(".label"), "pointerdown")
    expect($(".key").dataset.pressed).toBe("down")
    vi.advanceTimersByTime(20)
    pointer($(".label"), "pointerup")
    // a quick tap still reaches the bottom first
    expect($(".key").dataset.pressed).toBe("down")
    vi.advanceTimersByTime(PRESS_DOWN_MS)
    expect($(".key").dataset.pressed).toBe("up")
    ended($(".key"), "press-down")
    expect($(".key").dataset.pressed).toBe("up")
    ended($(".key"), "press-up")
    expect($(".key").dataset.pressed).toBeUndefined()
  })

  it("lets go of a press the browser cancels (a touch that became a scroll)", () => {
    const $ = page(`<a class="nav-a" href="#x">Docs</a>`)
    pointer($(".nav-a"), "pointerdown")
    vi.advanceTimersByTime(PRESS_DOWN_MS)
    pointer($(".nav-a"), "pointercancel")
    expect($(".nav-a").dataset.pressed).toBe("up")
  })

  it("presses a card only where nothing inside it takes the press", () => {
    const $ = page(
      `<li data-press="card"><p class="ground">Name</p><button class="key">Roll</button><canvas></canvas><input type="range"></li>`,
    )
    expect(pressedBy($(".ground"))).toBe($("li"))
    expect(pressedBy($(".key"))).toBe($(".key"))
    expect(pressedBy($("canvas"))).toBeNull()
    expect(pressedBy($("input"))).toBeNull()
  })

  it("never presses a disabled key, or anything under reduced motion", () => {
    const $ = page(`<button class="key" disabled>No</button><button class="key-chrome">Yes</button>`)
    expect(pressedBy($(".key"))).toBeNull()
    reduced = true
    pointer($(".key-chrome"), "pointerdown")
    expect($(".key-chrome").dataset.pressed).toBeUndefined()
  })
})
