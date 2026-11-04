// @rstest-environment jsdom
// The Studio's side columns below 1280px: the chat and the properties panel
// take turns beside the canvas, so it keeps room for a frame.
import { shallowMount } from "@vue/test-utils"
import { nextTick } from "vue"
import { afterEach, describe, expect, it, rs } from "rstack/test"
import StudioPage from "@/pages/studio/StudioPage.vue"

const at = (width: number) =>
  rs.stubGlobal("matchMedia", (q: string) => ({
    matches: /max-width: (\d+)px/.test(q) ? width <= Number(q.match(/max-width: (\d+)px/)![1]) : width >= 1024,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }))
afterEach(() => {
  rs.unstubAllGlobals()
  localStorage.clear()
})

async function page(width: number) {
  at(width)
  // The chat is stubbed as the page holds it: a panel it can focus.
  const w = shallowMount(StudioPage, {
    global: { stubs: { AgentPanel: { template: "<div />", methods: { focus() {} } } } },
  })
  await nextTick()
  const bar = w.findComponent({ name: "Toolbar" })
  const state = () => ({ chat: bar.props("chatOpen") as boolean, panel: bar.props("panelOpen") as boolean })
  return { w, bar, state }
}

describe("the Studio's side columns", () => {
  it("take turns below 1280px: opening one puts the other away", async () => {
    const { w, bar, state } = await page(1100)
    expect(state()).toEqual({ chat: true, panel: false })
    bar.vm.$emit("update:panelOpen", true)
    await nextTick()
    await nextTick()
    expect(state()).toEqual({ chat: false, panel: true })
    bar.vm.$emit("update:chatOpen", true)
    await nextTick()
    await nextTick()
    expect(state()).toEqual({ chat: true, panel: false })
    w.unmount()
  })
  it("stand side by side on a wide screen", async () => {
    const { w, bar, state } = await page(1440)
    bar.vm.$emit("update:panelOpen", true)
    await nextTick()
    await nextTick()
    expect(state()).toEqual({ chat: true, panel: true })
    w.unmount()
  })
})
