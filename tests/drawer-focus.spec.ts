// @rstest-environment jsdom
import { describe, expect, it } from "rstack/test"
import { mount } from "@vue/test-utils"
import { defineComponent, h, nextTick, ref } from "vue"
import DitherDrawer from "../dither-kit/tailwind/DitherDrawer.vue"

const settle = async () => {
  for (let i = 0; i < 4; i++) await nextTick()
}

// A modal drawer holds focus like the kit's dialogs: in on open, Tab cycling
// inside, back to whatever opened it on close.
describe("DitherDrawer focus", () => {
  it("takes focus, keeps Tab inside and hands focus back on close", async () => {
    const open = ref(false)
    const Host = defineComponent(
      () => () =>
        h("div", [
          h("button", { id: "opener", onClick: () => (open.value = true) }, "open"),
          h(DitherDrawer, { open: open.value, title: "Filters", onClose: () => (open.value = false) }, () => [
            h("a", { id: "first-link", href: "#a" }, "a"),
            h("a", { id: "last-link", href: "#b" }, "b"),
          ]),
        ]),
    )
    const w = mount(Host, { attachTo: document.body })
    const opener = document.getElementById("opener") as HTMLButtonElement
    opener.focus()
    open.value = true
    await settle()

    const close = document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Close"]')
    expect(document.activeElement).toBe(close)

    // Tab off the last link wraps to the close key; Shift+Tab off it, back.
    const last = document.getElementById("last-link") as HTMLAnchorElement
    last.focus()
    last.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(close)
    close?.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(last)

    open.value = false
    await settle()
    // The leave transition finishes at once in jsdom; the scope unmounts.
    await new Promise((r) => setTimeout(r, 0))
    await settle()
    expect(document.activeElement).toBe(opener)
    w.unmount()
  })
})
