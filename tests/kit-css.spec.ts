import { describe, expect, it } from "vitest"
import { buildKitCss } from "../scripts/kit-css.mjs"

// Compiles the kit's stylesheet with Tailwind's own compiler — integration-scale budget.
describe("the kit's standalone stylesheet", () => {
  it("carries the tokens, the scoped base and the kit's utilities, and nothing global", { timeout: 60000 }, async () => {
    const css = await buildKitCss({ minify: false })
    expect(css).toContain("--background:")
    expect(css).toContain("--swatch-blue:")
    expect(css).toMatch(/\.dark\s*\{/)
    expect(css).toContain(":where(.dither-kit")
    expect(css).toContain(".text-muted-foreground")
    expect(css).toContain(".border-border")
    expect(css).toContain(".rounded-md")
    expect(css).toMatch(/@layer dither-kit\.utilities/)
    // Every element rule is scoped: no bare html / body / button selectors.
    expect(css).not.toMatch(/(^|\}|\n)\s*(html|body|button|input)\s*[{,]/)
    expect(css.length).toBeLessThan(600_000)
  })
})
