// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { applyTheme, THEME_TOKENS, themeCss, themeVars } from "../dither-kit/theme"

describe("theme from JavaScript", () => {
  it("maps known tokens to custom properties and drops the rest", () => {
    expect(themeVars({ accent: " #123 ", radius: "4px", bogus: "x", foreground: "" } as never)).toEqual({ "--accent": "#123", "--radius": "4px" })
    expect(THEME_TOKENS).toContain("muted-foreground")
    expect(themeCss({ background: "#000", foreground: "#fff" }, ".dark")).toBe(".dark {\n  --background: #000;\n  --foreground: #fff;\n}\n")
    expect(themeCss({})).toBe("")
  })

  it("applies to an element and undoes exactly", () => {
    const el = document.createElement("div")
    el.style.setProperty("--accent", "red")
    const undo = applyTheme({ accent: "blue", radius: "2px" }, el)
    expect(el.style.getPropertyValue("--accent")).toBe("blue")
    expect(el.style.getPropertyValue("--radius")).toBe("2px")
    undo()
    expect(el.style.getPropertyValue("--accent")).toBe("red")
    expect(el.style.getPropertyValue("--radius")).toBe("")
    expect(typeof applyTheme({ accent: "x" }, null)).toBe("function")
  })
})
