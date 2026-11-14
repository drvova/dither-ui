// @rstest-environment jsdom
// The hand the reader reaches with: what opens under a finger takes no
// field's focus (the on-screen keyboard would cover half an iPad) and focus
// handed back after a touch is handed back without a ring; the keyboard and
// a mouse keep focus moving in as ever.
import { afterEach, beforeEach, describe, expect, it, rs } from "rstack/test"
import { focusBack, focusOnOpen, installHand, lastHand } from "../src/shared/lib/hand"
import { focusFirstMenuItem } from "../src/shared/lib/menu"

const down = (pointerType: string) =>
  document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType }))
const key = () => document.body.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }))

let uninstall = () => {}
beforeEach(() => {
  uninstall = installHand(document)
})
afterEach(() => {
  down("mouse")
  uninstall()
  document.body.innerHTML = ""
})

describe("the hand", () => {
  it("is named by the last pointer down or key down: a finger or a pen, a mouse, the keys", () => {
    down("touch")
    expect([lastHand(), focusOnOpen()]).toEqual(["touch", false])
    down("pen")
    expect(lastHand()).toBe("touch")
    down("mouse")
    expect([lastHand(), focusOnOpen()]).toEqual(["pointer", true])
    key()
    expect([lastHand(), focusOnOpen()]).toEqual(["keyboard", true])
  })

  it("opens a menu on its first item by the keys or a mouse, on the menu itself under a finger", () => {
    document.body.innerHTML = `<div role="menu" tabindex="-1"><button role="menuitem" disabled>Locked</button><button role="menuitem">Rename</button></div>`
    const menu = document.querySelector<HTMLElement>("[role=menu]")!
    key()
    focusFirstMenuItem(menu)
    expect(document.activeElement?.textContent).toBe("Rename")
    down("touch")
    focusFirstMenuItem(menu)
    expect(document.activeElement).toBe(menu)
  })

  it("hands focus back to a key unringed after a touch, letting go of the field that would pass its ring on", () => {
    document.body.innerHTML = `<button id="key">Library</button><input id="search" />`
    const target = document.getElementById("key")!
    const field = document.getElementById("search") as HTMLInputElement
    const focus = rs.spyOn(target, "focus")
    field.focus()
    down("touch")
    focusBack(target)
    expect(focus).toHaveBeenLastCalledWith({ focusVisible: false })
    expect(document.activeElement).toBe(target)
    key()
    focusBack(target)
    expect(focus).toHaveBeenLastCalledWith()
    focusBack(undefined)
  })
})
