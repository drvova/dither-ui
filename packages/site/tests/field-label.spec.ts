// @rstest-environment jsdom
// A text field's label setting: the field inside the kit's DitherField, so
// the visible label is tied to the control (its accessible name, which the
// audit's placeholder rule then passes), on the canvas and in the code
// export alike; without one, the field renders and exports as before.
import { describe, expect, it } from "rstack/test"
import { boundProps, componentEntry, fieldLabel, sanitizeComponentProps } from "@/entities/widget"

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
})
