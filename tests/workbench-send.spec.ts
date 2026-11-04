// @rstest-environment jsdom
// The workbench's feedback, where there is an agent to take it: the Studio
// hands the workbench a `send`, and K (or the tray's key) sends the
// feedback as Markdown instead of copying it, saying so.
import { flushPromises, mount } from "@vue/test-utils"
import { afterEach, describe, expect, it, rs } from "rstack/test"
import Workbench from "@/widgets/workbench/Workbench.vue"

afterEach(() => {
  document.body.innerHTML = ""
  rs.restoreAllMocks()
})

function bench(send?: (md: string) => void) {
  const card = document.createElement("main")
  const host = document.createElement("div")
  const content = document.createElement("div")
  content.innerHTML = `<button>Subscribe</button>`
  host.append(content)
  card.append(host)
  document.body.append(card)
  rs.stubGlobal("requestAnimationFrame", () => 0)
  return mount(Workbench, {
    props: { host, content, card, benchKey: "studio:t", section: "studio", title: "Canvas", url: "https://x", send },
    attachTo: card,
  })
}

describe("the workbench's feedback", () => {
  it("goes to the agent when the page gives it somewhere to go", async () => {
    const sent: string[] = []
    const w = bench((md) => sent.push(md))
    await flushPromises()
    const key = document.querySelector<HTMLButtonElement>('[aria-keyshortcuts="k"]')!
    expect(key.getAttribute("aria-label")).toBe("Send feedback to the agent (K)")
    key.click()
    await flushPromises()
    expect(sent).toHaveLength(1)
    expect(sent[0]).toContain("Canvas")
    w.unmount()
  })

  it("is copied where there is no agent", async () => {
    const w = bench()
    await flushPromises()
    const key = document.querySelector<HTMLButtonElement>('[aria-keyshortcuts="k"]')!
    expect(key.getAttribute("aria-label")).toBe("Copy feedback for an agent (K)")
    w.unmount()
  })
})
