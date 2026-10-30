// @rstest-environment jsdom
// The StyleX layer at run time: its components on the docs' StyleX runtime
// (the work an app's StyleX compiler does, done in the page), so the
// generated templates, the layer's `cn` and a consumer's styles all run.
import { mount } from "@vue/test-utils"
import { describe, expect, it, rs } from "rstack/test"
import * as stylex from "../../src/widgets/source/model/stylex"
import CheckboxCard from "../../dither-kit/stylex/CheckboxCard.vue"
import DitherInput from "../../dither-kit/stylex/DitherInput.vue"
import Heading from "../../dither-kit/stylex/Heading.vue"
import Text from "../../dither-kit/stylex/Text.vue"

rs.mock("@stylexjs/stylex", () => stylex)

const sheets = () => [...document.querySelectorAll("style[data-run-stylex]")].map((s) => s.textContent ?? "").join("\n")

/** The declarations an element's StyleX classes carry, as `rule` text. */
function rules(el: Element): string[] {
  const css = sheets()
  return [...el.classList].flatMap((c) => css.split("\n").filter((r) => r.includes(`.${c}{`) || r.includes(`.${c}:`)))
}

describe("the StyleX layer", () => {
  it("styles an element from its records and lets a consumer's style win", () => {
    const own = rules(mount(Text, { props: { tone: "muted", size: "lg" }, slots: { default: "t" } }).element)
    expect(own.join()).toContain("color:var(--muted-foreground)")
    expect(own.join()).toContain("font-size:15px")
    const custom = stylex.create({ ink: { color: "red" } })
    const theirs = rules(mount(Text, { props: { tone: "muted", xstyle: custom.ink }, slots: { default: "t" } }).element)
    expect(theirs.join()).toContain("color:red")
    expect(theirs.join()).not.toContain("color:var(--muted-foreground)")
  })

  it("passes class names through beside the styles", () => {
    const el = mount(Heading, { props: { level: "1", class: "mine" }, slots: { default: "t" } }).element
    expect(el.tagName).toBe("H1")
    expect(el.classList).toContain("mine")
    expect(rules(el).join()).toContain("font-size:1.5rem")
  })

  it("keeps a component's own hooks and hands a child component its styles", () => {
    const w = mount(CheckboxCard, { props: { label: "Ship it" } })
    expect(w.element.classList).toContain("dk-check-card")
    expect(rules(w.element).join()).toContain("border-style:solid")
    const box = w.findComponent({ name: "DitherCheckbox" })
    expect(rules(box.element).join()).toContain("margin-top:0.125rem")
  })

  it("writes conditions: a pseudo-element, focus and hover", () => {
    rules(mount(DitherInput, { props: { placeholder: "Name" } }).find("input").element)
    const css = sheets()
    expect(css).toMatch(/::placeholder\{color:color-mix\(in oklab, var\(--muted-foreground\) 60%, transparent\)\}/)
    expect(css).toMatch(/:focus-visible\{border-color:var\(--ring\)\}/)
    expect(css).toMatch(/@media \(hover: hover\)\{\.x\w+:hover\{border-color:/)
  })
})
