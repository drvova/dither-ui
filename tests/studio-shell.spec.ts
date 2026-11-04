// @rstest-environment jsdom
// The Studio's window: the page's own keys, a sidebar row's menu, the ⌘K
// search over every project's chats, and the panel's two tabs.
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import { beforeEach, describe, expect, it } from "rstack/test"
import { chats, openProject } from "@/features/agent/chats"
import { pageKeyOf } from "@/features/keyboard"
import { activeProjectId, createProject, hydrate, projects } from "@/features/persistence"
import RowMenu from "@/pages/studio/ui/RowMenu.vue"
import SearchPalette from "@/pages/studio/ui/SearchPalette.vue"

// jsdom lays nothing out, so it has no scrolling to do.
Element.prototype.scrollIntoView ??= () => {}

const press = (key: string, extra: Partial<KeyboardEventInit> = {}, target?: HTMLElement) => {
  const e = new KeyboardEvent("keydown", { key, ctrlKey: true, bubbles: true, ...extra })
  if (target) Object.defineProperty(e, "target", { value: target })
  return pageKeyOf(e)
}

describe("the page's own keys", () => {
  it("answers ⌘K, ⌘I and ⌘B from anywhere, a field's included", () => {
    const field = document.createElement("textarea")
    expect(press("k")).toBe("search")
    expect(press("i", {}, field)).toBe("toggleChat")
    expect(press("B")).toBe("toggleSidebar")
    expect(press("k", { ctrlKey: false })).toBeNull()
    expect(press("k", { altKey: true })).toBeNull()
  })
  it("steps between chats outside a field only, where ⌘⇧ arrows select text", () => {
    expect(press("ArrowUp", { shiftKey: true })).toBe("chatBefore")
    expect(press("ArrowDown", { shiftKey: true, ctrlKey: false, metaKey: true })).toBe("chatAfter")
    expect(press("ArrowUp", { shiftKey: true }, document.createElement("textarea"))).toBeNull()
    expect(press("ArrowUp")).toBeNull()
  })
})

describe("a row's menu", () => {
  it("is a menu: focus on its first item, Escape hands focus back to its key", async () => {
    const ran: string[] = []
    const w = mount(RowMenu, {
      attachTo: document.body,
      props: {
        label: "Chat options",
        actions: [
          { label: "Rename", run: () => ran.push("rename") },
          { label: "Delete chat", run: () => ran.push("delete"), danger: true },
        ],
      },
    })
    const key = w.get("button[aria-haspopup='menu']")
    await key.trigger("click")
    await nextTick()
    await nextTick()
    const items = w.findAll("[role='menuitem']")
    expect(items.map((i) => i.text())).toEqual(["Rename", "Delete chat"])
    expect(document.activeElement).toBe(items[0].element)
    await w.get("[role='menu']").trigger("keydown", { key: "Escape" })
    await nextTick()
    expect(w.find("[role='menu']").exists()).toBe(false)
    expect(document.activeElement).toBe(key.element)
    await key.trigger("click")
    await nextTick()
    await w.findAll("[role='menuitem']")[1].trigger("click")
    expect(ran).toEqual(["delete"])
    expect(w.find("[role='menu']").exists()).toBe(false)
    w.unmount()
  })
})

describe("search", () => {
  let here = ""
  let there = ""
  beforeEach(() => {
    localStorage.clear()
    hydrate()
    createProject("Elsewhere")
    there = activeProjectId.value
    localStorage.setItem(
      `dither-agent-chats-${there}`,
      JSON.stringify([{ id: "far", title: "Pricing page far away", at: Date.now() }]),
    )
    here = projects[0].id
    localStorage.setItem(
      `dither-agent-chats-${here}`,
      JSON.stringify([{ id: "near", title: "Pricing table", at: Date.now() }]),
    )
    activeProjectId.value = here
    chats.project = ""
    openProject(here)
  })

  const open = async (locked = false) => {
    const w = mount(SearchPalette, { attachTo: document.body, props: { open: false, locked } })
    await w.setProps({ open: true })
    await nextTick()
    return w
  }
  const hits = (w: ReturnType<typeof mount>) =>
    w.findAll("[role='option']").map((o) => ({ text: o.text(), off: o.attributes("aria-disabled") === "true" }))

  it("finds chats in every project, the open one's first", async () => {
    const w = await open()
    await w.get("input").setValue("pricing")
    expect(hits(w).map((h) => h.text)).toEqual(["Pricing tablechat", "Pricing page far awaychat in Elsewhere"])
    w.unmount()
  })

  it("opens a chat in another project: the project, then the chat", async () => {
    const w = await open()
    await w.get("input").setValue("far away")
    await w.get("input").trigger("keydown", { key: "Enter" })
    expect(activeProjectId.value).toBe(there)
    expect(chats.project).toBe(there)
    expect(chats.active).toBe("far")
    expect(w.emitted("close")).toHaveLength(1)
    expect(w.emitted("agent")).toHaveLength(1)
    w.unmount()
  })

  it("keeps the open chat while a turn runs and holds every other back", async () => {
    const w = await open(true)
    await w.get("input").setValue("pricing")
    expect(hits(w).map((h) => h.off)).toEqual([false, true])
    await w.get("input").trigger("keydown", { key: "ArrowDown" })
    await w.get("input").trigger("keydown", { key: "Enter" })
    expect(activeProjectId.value).toBe(here)
    expect(w.emitted("close")).toBeUndefined()
    w.unmount()
  })

  it("says when nothing matches", async () => {
    const w = await open()
    await w.get("input").setValue("zzz")
    expect(w.text()).toContain("Nothing matches")
    w.unmount()
  })
})
