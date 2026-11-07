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
