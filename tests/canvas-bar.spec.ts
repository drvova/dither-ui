// @rstest-environment jsdom
// The canvas's one bar: the same keys in the same order whatever is
// selected (one that does not apply is disabled, never removed, so the bar
// never changes width), each with a name, and each the agent can press too:
// its action is one of the Studio's tools.
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import { beforeEach, describe, expect, it } from "rstack/test"
import { createArtboard } from "@/entities/artboard/model/factory"
import { deselect, editor, groupSelected, selectArtboard, selectMany, stopInspecting } from "@/entities/editor"
import { STUDIO_TOOLS } from "@/features/agent/tools"
import CanvasBar from "@/widgets/toolbar/CanvasBar.vue"

const keys = (w: ReturnType<typeof mount>) =>
  w.findAll("button").map((b) => ({
    agent: b.attributes("data-agent"),
    name: b.attributes("aria-label"),
    off: b.attributes("disabled") !== undefined,
  }))

beforeEach(() => {
  stopInspecting()
  const chart = createArtboard("bar")
  const button = createArtboard("button")
  editor.artboards = [chart, button]
  editor.groups = []
  editor.dataOpen = false
  deselect()
})

describe("the canvas bar", () => {
  it("keeps every key, in order, whatever is selected", async () => {
    const w = mount(CanvasBar)
    const [chart, button] = editor.artboards
    const shapes: string[][] = []
    const look = async () => {
      await nextTick()
      shapes.push(w.findAll("button").map((b) => b.attributes("data-key") ?? b.attributes("aria-label") ?? ""))
    }
    await look()
    selectArtboard(chart.id)
    await look()
    selectArtboard(button.id)
    await look()
    selectMany([chart.id, button.id])
    groupSelected()
    await look()
    for (const s of shapes) expect(s).toEqual(shapes[0])
    // Grouped, the group key ungroups; the slot is the same.
    expect(w.find('[data-key="group"]').attributes("aria-label")).toBe("Ungroup")
    w.unmount()
  })

  it("disables what needs a selection, and the data key for anything but a chart", async () => {
    const w = mount(CanvasBar)
    const on = () =>
      keys(w)
        .filter((k) => !k.off)
        .map((k) => k.agent)
    expect(on()).toEqual(["set_view", "set_view", "set_view", "set_view", "replay", "inspect"])
    selectArtboard(editor.artboards[1].id)
    await nextTick()
    expect(w.find('[data-key="data"]').attributes("disabled")).toBeDefined()
    selectArtboard(editor.artboards[0].id)
    await nextTick()
    expect(w.find('[data-key="data"]').attributes("disabled")).toBeUndefined()
    w.unmount()
  })

  it("names every key and gives each to the agent as one of its actions", () => {
    const w = mount(CanvasBar)
    const tools = STUDIO_TOOLS.map((t) => t.def.name)
    for (const k of keys(w)) {
      expect(k.name, String(k.agent)).toMatch(/^[A-Z]/)
      expect(tools, String(k.name)).toContain(k.agent)
    }
    w.unmount()
  })

  it("steps aside while the workbench inspects", async () => {
    const w = mount(CanvasBar)
    await w.find('[data-key="inspect"]').trigger("click")
    expect(editor.inspecting).toBe(true)
    expect(w.find('[role="toolbar"]').exists()).toBe(false)
    stopInspecting()
    await nextTick()
    expect(w.find('[role="toolbar"]').exists()).toBe(true)
    w.unmount()
  })
})
