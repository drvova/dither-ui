// @rstest-environment jsdom
// What a field holds: a value is checked against its default's kind (as a
// document's value is on load), so a sign-in field can show its placeholder
// instead of the kit's sample. (Setting it through the protocol is the
// component specs', in `site/`.)
import { describe, expect, it } from "rstack/test"
import { componentEntry, sanitizeModel } from "@/entities/widget"

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
})
