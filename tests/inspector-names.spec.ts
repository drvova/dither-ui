// @rstest-environment jsdom
// The inspector's names stand in ONE column (`.prop-name`, app/styles.css),
// so every control in the panel starts on the same line, and a long
// camelCase name breaks between its words instead of running under its
// control. Pinned here: the shared column everywhere a name stands beside a
// control (no fixed width of a row's own), the break points, and the
// panel's rows wearing them. Measured in the browser too: every row's
// control at one x, no name or field past its box, at 1024 and 1440.
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "rstack/test"
import { componentEntry } from "@/entities/widget"
import { breakable } from "@/shared/lib"
import NumberField from "@/shared/ui/NumberField.vue"
import ComponentPropsPanel from "@/widgets/inspector/ComponentPropsPanel.vue"

const ZW = "​"
const vueFiles = (dir: string) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".vue"))
    .map((f) => join(dir, f))

describe("the inspector's name column", () => {
  it("breaks a camelCase name at its humps and leaves the letters as they are", () => {
    expect(breakable("chromaticAberration")).toBe(`chromatic${ZW}Aberration`)
    expect(breakable("pageLoadAnimation")).toBe(`page${ZW}Load${ZW}Animation`)
    expect(breakable("placeholder")).toBe("placeholder")
    expect(breakable("tick gap")).toBe("tick gap")
    expect(breakable("chromaticAberration").replaceAll(ZW, "")).toBe("chromaticAberration")
  })

  it("is the one name width: no row keeps a fixed width of its own beside a control", () => {
    const files = [...vueFiles("src/widgets/inspector"), ...vueFiles("src/shared/ui")]
    // A fixed width that will not shrink, on anything but a readout of a value.
    const own = files.flatMap((f) =>
      [...readFileSync(f, "utf8").matchAll(/<span\s+(?:v-if="[^"]*"\s+)?class="([^"]*)"\s*>([^<]+)<\/span>/g)]
        .filter(([, cls]) => /\bw-\d+\b/.test(cls) && /\bshrink-0\b/.test(cls) && !/tabular-nums/.test(cls))
        .map(([, cls, text]) => `${f}: "${text.trim()}" (${cls})`),
    )
    expect(own).toEqual([])
  })

  it("wears it on every property row, long names broken", () => {
    const entry = componentEntry("DitherFaultyTerminal")!
    const props = Object.fromEntries(entry.props.map((p) => [p.key, p.def]))
    const w = mount(ComponentPropsPanel, { props: { entry, target: { props, slotText: null } } })
    const names = w.findAll(".prop-name").map((n) => n.text())
    expect(names).toContain(`chromatic${ZW}Aberration`)
    // Every text, list, number and choice property has its name in the column.
    const rowed = entry.props.filter((p) => ["text", "url", "list", "number", "select"].includes(p.kind))
    expect(names.map((n) => n.replaceAll(ZW, ""))).toEqual(rowed.map((p) => p.key))
    // The field's own name keeps its letters.
    expect(w.find('input[name="chromaticAberration"]').exists()).toBe(true)
    w.unmount()
  })

  it("lets a number field's name sit in a pair's grid", () => {
    const w = mount(NumberField, { props: { label: "X", modelValue: 1 } })
    expect(w.find(".prop-name").text()).toBe("X")
    const css = readFileSync("src/app/styles.css", "utf8")
    expect(css).toMatch(/\.prop-pairs \{[^}]*grid-template-columns: var\(--prop-name\)/)
    expect(css).toMatch(/\.prop-name \{[^}]*width: var\(--prop-name\)/)
    w.unmount()
  })
})
