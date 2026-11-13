// @rstest-environment jsdom
// The page transition's hand-off: the inline head script (run here as the
// page runs it) parks the navigation's transition, and the app takes it in
// either order, since the app's deferred script may run before the reveal.
import { afterEach, describe, expect, it } from "rstack/test"
import { PAGE_END_ID, PAGE_REVEAL_SCRIPT, takePageTransition } from "../src/app/page-reveal"

const transition = () =>
  ({ ready: Promise.resolve(), finished: new Promise(() => {}), skipTransition() {} }) as unknown as ViewTransition
const reveal = (viewTransition: ViewTransition | null) =>
  dispatchEvent(Object.assign(new Event("pagereveal"), { viewTransition }))
const arrive = (activation: unknown) => {
  Object.defineProperty(window, "navigation", { value: { activation }, configurable: true })
  new Function(PAGE_REVEAL_SCRIPT)()
}

afterEach(() => {
  document.head.innerHTML = ""
  delete (window as { navigation?: unknown }).navigation
})

describe("the page transition's hand-off", () => {
  it("parks the transition for an app that runs after the reveal", () => {
    arrive({ navigationType: "push", from: { index: 0 } })
    const t = transition()
    reveal(t)
    // The old page is held while the app loads.
    expect(document.head.querySelector("style")?.textContent).toContain("::view-transition-new(root)")
    const taken: ViewTransition[] = []
    takePageTransition((x) => taken.push(x))
    takePageTransition((x) => taken.push(x))
    expect(taken).toEqual([t])
  })

  it("hands it over at the reveal when the app ran first", () => {
    arrive({ navigationType: "push", from: { index: 0 } })
    const taken: ViewTransition[] = []
    takePageTransition((x) => taken.push(x))
    expect(taken).toEqual([])
    const t = transition()
    reveal(t)
    expect(taken).toEqual([t])
  })

  it("holds the first frame to the end of the HTML only when coming from one of the pages", () => {
    const expectLink = () => document.head.querySelector(`link[rel="expect"][href="#${PAGE_END_ID}"]`)
    arrive({ navigationType: "push", from: { index: 0 } })
    expect(expectLink()?.getAttribute("blocking")).toBe("render")
    document.head.innerHTML = ""
    arrive({ navigationType: "push", from: null })
    expect(expectLink()).toBeNull()
    arrive({ navigationType: "reload", from: { index: 0 } })
    expect(expectLink()).toBeNull()
    // A reveal without a transition parks nothing.
    reveal(null)
    const taken: ViewTransition[] = []
    takePageTransition((x) => taken.push(x))
    expect(taken).toEqual([])
  })
})
