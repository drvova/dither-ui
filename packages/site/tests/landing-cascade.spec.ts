// The landing's shared rules (`chapters.css`: `.landing .key`, `.seg`, the
// section heads) sit in whichever stylesheet the build gives the parts that
// share them, and a page links its sheets in no promised order. A part that
// restyles one of them therefore outranks it rather than following it: a
// rule with the shared rule's own weight (two classes) that sets the same
// property won only while its sheet happened to load later (the install's
// prompt key lost its size once the missing page no longer rode in the
// landing's chunk).
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"

const DIR = new URL("../src/pages/landing", import.meta.url).pathname

type Rule = { selector: string; props: string[] }

/** Every style rule of a sheet, at any depth of `@media`, as its selectors
 * and the properties it sets. */
function rules(css: string): Rule[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "")
  return [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(([, head, body]) =>
    head
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("@"))
      .map((selector) => ({
        selector,
        props: body
          .split(";")
          .map((d) => d.split(":")[0].trim())
          .filter(Boolean),
      })),
  )
}

/** The selector's last compound, the element it styles. */
const subject = (selector: string) => selector.split(/[\s>+~]+/).pop() ?? ""
const classes = (selector: string) => selector.match(/\.[\w-]+/g)?.length ?? 0

const SHARED = rules(readFileSync(join(DIR, "chapters.css"), "utf8")).filter((r) =>
  /^\.landing \.[\w-]+$/.test(r.selector),
)

describe("the landing's shared rules", () => {
  it("are restyled only by rules that outrank them", () => {
    expect(SHARED.length).toBeGreaterThan(0)
    const ties: string[] = []
    for (const file of readdirSync(DIR).filter((f) => f.endsWith(".css") && f !== "chapters.css"))
      for (const rule of rules(readFileSync(join(DIR, file), "utf8"))) {
        if (classes(rule.selector) > 2) continue
        const own: string[] = subject(rule.selector).match(/\.[\w-]+/g) ?? []
        for (const shared of SHARED) {
          if (!own.includes(subject(shared.selector))) continue
          const both = rule.props.filter((p) => shared.props.includes(p))
          if (both.length) ties.push(`${file}: ${rule.selector} sets ${both.join(", ")} as ${shared.selector} does`)
        }
      }
    expect(ties).toEqual([])
  })

  it("held the install's prompt key to its own size", () => {
    const css = readFileSync(join(DIR, "LandingPage.css"), "utf8")
    const key = rules(css).find((r) => r.selector.endsWith(".prompt-key"))
    expect(key?.selector).toBe(".landing-page-scope .key.prompt-key")
  })
})
