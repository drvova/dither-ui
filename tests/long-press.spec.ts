// @rstest-environment jsdom
// WebKit on iOS fires no contextmenu on a long press; the Studio's polyfill
// does: a still touch opens the menu, a moving one (a scroll) or a mouse
// does not, a text field keeps its own, the platform's own menu wins, and
// the release's click never lands on the menu that just opened.
import { afterEach, beforeEach, describe, expect, it, rs } from "rstack/test"
import { installLongPress } from "../src/shared/lib/long-press"

const pointer = (type: string, init: PointerEventInit) =>
  new PointerEvent(type, { bubbles: true, cancelable: true, isPrimary: true, pointerId: 1, ...init })

let uninstall = () => {}
let row: HTMLElement
let menus: MouseEvent[]
beforeEach(() => {
  rs.useFakeTimers()
  document.body.innerHTML = `<div id="row">Area chart</div><input id="name" />`
  row = document.getElementById("row")!
  menus = []
  row.addEventListener("contextmenu", (e) => menus.push(e))
  uninstall = installLongPress(document, 500)
})
afterEach(() => {
  uninstall()
  rs.useRealTimers()
})

describe("long press", () => {
  it("opens the menu under a still finger, at the finger", () => {
    row.dispatchEvent(pointer("pointerdown", { pointerType: "touch", clientX: 40, clientY: 12 }))
    rs.advanceTimersByTime(499)
    expect(menus).toHaveLength(0)
    rs.advanceTimersByTime(1)
    expect(menus.map((e) => [e.clientX, e.clientY])).toEqual([[40, 12]])
  })

  it("leaves a scroll, a quick tap, a mouse and a text field alone", () => {
    row.dispatchEvent(pointer("pointerdown", { pointerType: "touch", clientX: 40, clientY: 12 }))
    row.dispatchEvent(pointer("pointermove", { pointerType: "touch", clientX: 40, clientY: 40 }))
    rs.advanceTimersByTime(600)
    row.dispatchEvent(pointer("pointerdown", { pointerType: "touch", clientX: 40, clientY: 12 }))
    row.dispatchEvent(pointer("pointerup", { pointerType: "touch", clientX: 40, clientY: 12 }))
    rs.advanceTimersByTime(600)
    row.dispatchEvent(pointer("pointerdown", { pointerType: "mouse", clientX: 40, clientY: 12 }))
    rs.advanceTimersByTime(600)
    const field = document.getElementById("name")!
    field.addEventListener("contextmenu", (e) => menus.push(e))
    field.dispatchEvent(pointer("pointerdown", { pointerType: "touch", clientX: 5, clientY: 30 }))
    rs.advanceTimersByTime(600)
    expect(menus).toHaveLength(0)
  })

  it("swallows the click the release makes", () => {
    let clicks = 0
    row.addEventListener("click", () => clicks++)
    row.dispatchEvent(pointer("pointerdown", { pointerType: "touch", clientX: 40, clientY: 12 }))
    rs.advanceTimersByTime(500)
    row.dispatchEvent(pointer("pointerup", { pointerType: "touch", clientX: 40, clientY: 12 }))
    row.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    expect(clicks).toBe(0)
    rs.advanceTimersByTime(500)
    row.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    expect(clicks).toBe(1)
  })
})
