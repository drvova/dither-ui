// The inspector's names stand in ONE column (`.prop-name`, app/styles.css),
// and a long camelCase name breaks between its words instead of running
// under its control. Pinned here: the break points (the column and the rows
// wearing it are the Solid site's specs').
import { describe, expect, it } from "rstack/test"
import { breakable } from "@/shared/lib/words"

const ZW = "​"

describe("the inspector's name column", () => {
  it("breaks a camelCase name at its humps and leaves the letters as they are", () => {
    expect(breakable("chromaticAberration")).toBe(`chromatic${ZW}Aberration`)
    expect(breakable("pageLoadAnimation")).toBe(`page${ZW}Load${ZW}Animation`)
    expect(breakable("placeholder")).toBe("placeholder")
    expect(breakable("tick gap")).toBe("tick gap")
    expect(breakable("chromaticAberration").replaceAll(ZW, "")).toBe("chromaticAberration")
  })
})
