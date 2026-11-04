// @rstest-environment jsdom
// What a field holds, set by the agent: a component's or a screen cell's
// v-model value through the protocol, checked against its default's kind
// (as a document's value is on load), so a sign-in field can show its
// placeholder instead of the kit's sample. And choice chips: a v-model that
// works, one name for their radios, a label tied to the group.
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it } from "rstack/test"
import { editor } from "@/entities/editor"
import { componentEntry, sanitizeModel } from "@/entities/widget"
import { runCommand } from "@/features/agent"
import ChoiceChips from "../dither-kit/tailwind/ChoiceChips.vue"

beforeEach(() => {
  editor.artboards = []
  editor.selectedIds = []
})

describe("a field's value", () => {
  it("keeps a value of its default's kind, bounded, and falls back otherwise", () => {
    const email = componentEntry("DitherEmailInput")!
    expect(sanitizeModel(email, "")).toBe("")
    expect(sanitizeModel(email, "me@studio.com")).toBe("me@studio.com")
    expect(sanitizeModel(email, 42)).toBe(email.vmodel!.def)
    expect(sanitizeModel(email, "x".repeat(30_000))).toBe(email.vmodel!.def)
    const sw = componentEntry("DitherSwitch")!
    expect(sanitizeModel(sw, false)).toBe(false)
    expect(sanitizeModel(sw, "yes")).toBe(sw.vmodel!.def)
    // No v-model: no value.
    expect(sanitizeModel(componentEntry("DitherBadge")!, "x")).toBeUndefined()
  })

  it("is set through the protocol: a component, a screen's cells, and an update", () => {
    const c = runCommand({ type: "component.add", is: "DitherEmailInput", value: "" })
    expect(c.ok).toBe(true)
    const a = editor.artboards[0]
    expect(a.widget?.kind === "component" && a.widget.model).toBe("")
    runCommand({ type: "artboard.update", id: a.id, patch: { widget: { value: "you@studio.com" } } })
    expect(a.widget?.kind === "component" && a.widget.model).toBe("you@studio.com")
    runCommand({ type: "artboard.update", id: a.id, patch: { widget: { value: { evil: true } } } })
    expect(a.widget?.kind === "component" && a.widget.model).toBe(componentEntry("DitherEmailInput")!.vmodel!.def)

    const s = runCommand({
      type: "screen.add",
      rows: [
        {
          cells: [
            { is: "DitherEmailInput", value: "" },
            { is: "DitherSwitch", value: 7 },
          ],
        },
      ],
    })
    expect(s.ok).toBe(true)
    const screen = editor.artboards[1].widget
    if (screen?.kind !== "screen") throw new Error("no screen")
    expect(screen.rows[0].cells.map((x) => x.model)).toEqual(["", componentEntry("DitherSwitch")!.vmodel!.def])
  })

  it("changes a screen's cells under widget, and refuses rows put beside it", () => {
    const s = runCommand({
      type: "screen.add",
      rows: [{ cells: [{ is: "DitherEmailInput", value: "ada@example.com" }] }],
    })
    const id = (s.data as { id: string }).id
    const cells = () => {
      const w = editor.artboards.find((a) => a.id === id)?.widget
      return w?.kind === "screen" ? w.rows[0].cells.map((c) => c.model) : null
    }
    // Where an agent put them in a live run: told so, nothing changed.
    const wrong = runCommand({
      type: "artboard.update",
      id,
      patch: { name: "Card", rows: [{ cells: [{ is: "DitherEmailInput", value: "" }] }] },
    })
    expect(wrong.ok).toBe(false)
    expect(wrong.ok ? "" : wrong.error).toContain("does not take rows")
    expect(editor.artboards.find((a) => a.id === id)?.name).not.toBe("Card")
    expect(cells()).toEqual(["ada@example.com"])
    const right = runCommand({
      type: "artboard.update",
      id,
      patch: { widget: { rows: [{ cells: [{ is: "DitherEmailInput", value: "" }] }] } },
    })
    expect(right.ok).toBe(true)
    expect(cells()).toEqual([""])
  })
})

describe("choice chips", () => {
  it("shows its v-model, shares one name across its radios, and names the group", () => {
    const w = mount(ChoiceChips, { props: { modelValue: "M", options: ["S", "M"], label: "Size" } })
    const radios = w.findAll<HTMLInputElement>('input[type="radio"]')
    expect(radios.map((r) => r.element.checked)).toEqual([false, true])
    expect(new Set(radios.map((r) => r.attributes("name"))).size).toBe(1)
    const group = w.get('[role="group"]')
    const label = w.get(`#${group.attributes("aria-labelledby")}`)
    expect(label.text()).toBe("Size")
    // The older `value` is still read; two groups never share a name.
    const old = mount(ChoiceChips, { props: { value: "S", options: ["S", "M"] } })
    expect(old.findAll<HTMLInputElement>("input").map((r) => r.element.checked)).toEqual([true, false])
    expect(old.get("input").attributes("name")).not.toBe(radios[0].attributes("name"))
    expect(old.get('[role="group"]').attributes("aria-labelledby")).toBeUndefined()
  })
})
