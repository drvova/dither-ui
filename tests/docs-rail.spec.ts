// @rstest-environment jsdom
// "On this page" on a page opened straight on a section: it lists the
// section's parts from the first paint (it stood empty until the reader
// moved to another section, since the section shown never changed).
import { expect, it } from "rstack/test"
import { mount } from "@vue/test-utils"
import DocsPage from "@/pages/docs/DocsPage.vue"

it("lists the parts of a section opened straight from its address", async () => {
  history.replaceState(null, "", "/docs/avatar")
  const w = mount(DocsPage, { attachTo: document.body })
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
  const rail = w.find('nav[aria-label="On this page"]')
  expect(rail.exists()).toBe(true)
  expect(rail.findAll("button").map((b) => b.text())).toEqual(["Avatar", "Names", "API"])
  w.unmount()
})

it("renders only the sections it writes itself that are open or just read", async () => {
  // all of them rendered hidden once held most of a section page's nodes
  // and every one of its canvases
  history.replaceState(null, "", "/docs/area")
  const w = mount(DocsPage, { attachTo: document.body })
  const settle = async () => {
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
  }
  const filled = (id: string) => (document.getElementById(id)?.children.length ?? 0) > 0
  await settle()
  expect(["area", "bar", "dashboard"].map(filled)).toEqual([true, false, false])
  for (const id of ["bar", "line", "pie"]) {
    history.pushState(null, "", `/docs/${id}`)
    dispatchEvent(new PopStateEvent("popstate"))
    await settle()
  }
  // the last three read stay; the first lets go
  expect(["area", "bar", "line", "pie"].map(filled)).toEqual([false, true, true, true])
  w.unmount()
})

it("shows one section of a pack that arrives after the page, and lists its parts", async () => {
  // a pack is a chunk of its own: its sections came after the hiding ran,
  // and a family's every section showed at once
  history.replaceState(null, "", "/docs/aurora")
  const w = mount(DocsPage, { attachTo: document.body })
  for (let i = 0; i < 40 && !document.getElementById("aurora"); i++) await new Promise((r) => setTimeout(r, 10))
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
  const shownIds = [...document.querySelectorAll<HTMLElement>(".docs-flow > section")]
    .filter((s) => !s.hidden)
    .map((s) => s.id)
  expect(shownIds).toEqual(["aurora"])
  const rail = w.find('nav[aria-label="On this page"]')
  expect(rail.findAll("button").length).toBeGreaterThan(0)
  w.unmount()
})
