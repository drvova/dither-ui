// @rstest-environment jsdom
// The app mounts on its page's styles: the client's entry runs async, ahead
// of the head's stylesheets, and mounted under no styles on a slow load
// (Gecko: "Layout was forced before the page was fully loaded").
import { afterEach, describe, expect, it } from "rstack/test"
import { sheetsReady } from "../src/app/sheets-ready"

afterEach(() => {
  document.head.innerHTML = ""
})

/** A stylesheet link, loaded (it has its sheet) or still loading. */
function link(loaded: boolean): HTMLLinkElement {
  const el = document.createElement("link")
  el.rel = "stylesheet"
  Object.defineProperty(el, "sheet", { value: loaded ? {} : null, configurable: true })
  document.head.append(el)
  return el
}

const settled = async (p: Promise<void>) => {
  let done = false
  void p.then(() => (done = true))
  for (let i = 0; i < 5; i++) await Promise.resolve()
  return done
}

describe("waiting for the page's stylesheets", () => {
  it("resolves at once when every sheet has loaded", async () => {
    link(true)
    expect(await settled(sheetsReady(document))).toBe(true)
  })

  it("waits for each pending sheet to load or fail", async () => {
    link(true)
    const a = link(false)
    const b = link(false)
    const ready = sheetsReady(document, 60000)
    expect(await settled(ready)).toBe(false)
    a.dispatchEvent(new Event("load"))
    expect(await settled(ready)).toBe(false)
    b.dispatchEvent(new Event("error"))
    expect(await settled(ready)).toBe(true)
  })

  it("mounts all the same once its wait is over", async () => {
    link(false)
    const ready = sheetsReady(document, 10)
    expect(await settled(ready)).toBe(false)
    await new Promise((r) => setTimeout(r, 20))
    expect(await settled(ready)).toBe(true)
  })
})
