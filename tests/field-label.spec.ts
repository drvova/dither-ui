// @rstest-environment jsdom
// A text field's label setting: the field inside the kit's DitherField, so
// the visible label is tied to the control (its accessible name, which the
// audit's placeholder rule then passes), on the canvas and in the code
// export alike; without one, the field renders and exports as before.
import { mount } from "@vue/test-utils"
import { describe, expect, it, rs } from "rstack/test"
import { boundProps, componentEntry, fieldLabel, sanitizeComponentProps } from "@/entities/widget"
import { widgetCode } from "@/entities/widget/model/codegen"
import { createComponent } from "@/entities/widget/model/factory"
import { addCell, createScreen } from "@/entities/widget/model/screen"
import { audit, nameOf } from "@/shared/lib/inspect/measure"
import ScreenRenderer from "@/widgets/widget-renderer/ScreenRenderer.vue"
import WidgetRenderer from "@/widgets/widget-renderer/WidgetRenderer.vue"

const FIELDS = [
  "DitherInput",
  "DitherTextarea",
  "DitherSelect",
  "DitherPasswordInput",
  "DitherSearchInput",
  "DitherEmailInput",
  "DitherPhoneInput",
  "DitherCurrencyInput",
]

/** The screen from the live run: an email field and a password field. */
function signIn(labels: [string, string]) {
  const s = createScreen()
  const email = addCell(s.rows[0], componentEntry("DitherEmailInput")!)
  const password = addCell(s.rows[0], componentEntry("DitherPasswordInput")!)
  email.props.label = labels[0]
  password.props.label = labels[1]
  email.grow = true
  return s
}

describe("a field's label setting", () => {
  it("is a text setting on every kit field that reads a DitherField, empty by default", () => {
    for (const is of FIELDS) {
      const entry = componentEntry(is)!
      expect(entry.props[0], is).toEqual({ key: "label", kind: "text", def: "" })
      expect(sanitizeComponentProps(entry, { label: "  Email  " }).label).toBe("  Email  ")
    }
    // Not the component's own prop: the DitherField's.
    expect(boundProps("DitherEmailInput", { label: "Email", placeholder: "x" })).toEqual({ placeholder: "x" })
    expect(fieldLabel("DitherEmailInput", { label: "  Email  " })).toBe("Email")
    expect(fieldLabel("DitherEmailInput", { label: " " })).toBeNull()
    // A component whose own prop is called label keeps it.
    expect(boundProps("DitherField", { label: "Email" })).toEqual({ label: "Email" })
    expect(fieldLabel("DitherField", { label: "Email" })).toBeNull()
  })

  it("ties the label to the control on the canvas, so the audit's placeholder rule passes", () => {
    const named = mount(ScreenRenderer, {
      props: { screen: signIn(["Email", "Password"]), artboardId: "a" },
      attachTo: document.body,
    })
    const bare = mount(ScreenRenderer, {
      props: { screen: signIn(["", ""]), artboardId: "b" },
      attachTo: document.body,
    })
    const box = { width: 200, height: 40, x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 40, toJSON() {} }
    rs.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(box as DOMRect)
    const fields = (w: typeof named) => [...w.element.querySelectorAll("input:not([type=button])")].slice(0, 2)
    expect(fields(named).map(nameOf)).toEqual(["Email", "Password"])
    expect(audit(named.element, named.element).filter((i) => i.kind === "label")).toEqual([])
    expect(audit(bare.element, bare.element).filter((i) => i.kind === "label")).toHaveLength(2)
    expect(bare.element.querySelector("label")).toBeNull()
    rs.restoreAllMocks()
    named.unmount()
    bare.unmount()
  })

  it("labels a field standing as its own frame too", () => {
    const w = createComponent(componentEntry("DitherSearchInput")!)
    w.props.label = "Find a frame"
    const r = mount(WidgetRenderer, { props: { widget: w, artboardId: "c" }, attachTo: document.body })
    const label = r.element.querySelector("label")!
    expect(label.textContent?.trim()).toBe("Find a frame")
    expect(document.getElementById(label.getAttribute("for")!)?.tagName).toBe("INPUT")
    r.unmount()
  })

  it("exports the same pairing, and nothing new without a label", () => {
    const code = widgetCode(signIn(["Email", ""]), { w: 380, h: 300 })
    expect(code).toContain('import { DitherEmailInput, DitherField, DitherPasswordInput } from "@dither-kit"')
    expect(code).toMatch(
      /<DitherField label="Email" class="flex-1">\n\s+<DitherEmailInput [^>]*class="w-full" \/>\n\s+<\/DitherField>/,
    )
    expect(code).not.toContain('label=""')
    expect(code.match(/<DitherField/g)).toHaveLength(1)
    const alone = createComponent(componentEntry("DitherInput")!)
    expect(widgetCode(alone, { w: 280, h: 90 })).not.toContain("DitherField")
    alone.props.label = "Name"
    expect(widgetCode(alone, { w: 280, h: 90 })).toContain('<DitherField label="Name">')
  })
})
