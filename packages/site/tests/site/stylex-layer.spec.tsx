// The Solid kit's StyleX layer at run time: generated components
// (the `dither-kit-stylex` package) on the docs' StyleX runtime (the work an
// app's StyleX compiler does, done in the page), so the generated JSX, the
// layer's `cn` and a consumer's styles all run.
import { cleanup, render } from "@solidjs/testing-library"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as stylex from "@/widgets/source/model/stylex"
import CheckboxCard from "dither-kit-stylex/CheckboxCard.tsx"
import DitherCollapsible from "dither-kit-stylex/DitherCollapsible.tsx"
import DitherGauge from "dither-kit-stylex/DitherGauge.tsx"
import DitherInput from "dither-kit-stylex/DitherInput.tsx"
import DitherSidebarItem from "dither-kit-stylex/DitherSidebarItem.tsx"
import DitherSidebarSub from "dither-kit-stylex/DitherSidebarSub.tsx"
import Heading from "dither-kit-stylex/Heading.tsx"
import * as layer from "dither-kit-stylex"
import Spacer from "dither-kit-stylex/Spacer.tsx"
import Text from "dither-kit-stylex/Text.tsx"
import * as solid from "dither-kit"
import { world } from "dither-kit/testing/world.ts"

vi.mock("@stylexjs/stylex", async () => await import("@/widgets/source/model/stylex"))

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
})
afterEach(() => {
  cleanup()
  w.restore()
})

const sheets = () => [...document.querySelectorAll("style[data-run-stylex]")].map((s) => s.textContent ?? "").join("\n")

/** The declarations an element's StyleX classes carry, as `rule` text. */
function rules(el: Element): string {
  const css = sheets()
  return [...el.classList]
    .flatMap((c) => css.split("\n").filter((r) => r.includes(`.${c}{`) || r.includes(`.${c}:`)))
    .join()
}

describe("the Solid StyleX layer", () => {
  it("styles an element from its records and lets a consumer's style win", () => {
    const own = rules(
      render(() => (
        <Text tone="muted" size="lg">
          t
        </Text>
      )).container.firstElementChild!,
    )
    expect(own).toContain("color:var(--muted-foreground)")
    expect(own).toContain("font-size:15px")
    const custom = stylex.create({ ink: { color: "red" } })
    const theirs = rules(
      render(() => (
        <Text tone="muted" xstyle={custom.ink}>
          t
        </Text>
      )).container.firstElementChild!,
    )
    expect(theirs).toContain("color:red")
    expect(theirs).not.toContain("color:var(--muted-foreground)")
  })

  it("passes class names through beside the styles, and keeps `xstyle` off the element", () => {
    const el = render(() => (
      <Heading level="1" class="mine">
        t
      </Heading>
    )).container.firstElementChild!
    expect(el.tagName).toBe("H1")
    expect(el.classList).toContain("mine")
    expect(rules(el)).toContain("font-size:1.5rem")
    const text = render(() => <Text xstyle={stylex.create({ a: { color: "red" } }).a}>t</Text>).container
      .firstElementChild!
    expect(text.hasAttribute("xstyle")).toBe(false)
  })

  it("keeps a component's own hooks and hands a child component its styles", () => {
    const root = render(() => <CheckboxCard label="Ship it" />).container.firstElementChild!
    expect(root.classList).toContain("dk-check-card")
    expect(rules(root)).toContain("border-style:solid")
    const box = root.querySelector("[role=checkbox], input, button")!
    expect(rules(box)).toContain("margin-top:0.125rem")
  })

  it("spreads an element's own style as its class", () => {
    const root = render(() => <CheckboxCard label="Ship it" description="Now" />).container.firstElementChild!
    const title = [...root.querySelectorAll("span")].find((s) => s.textContent === "Ship it")!
    expect(title.hasAttribute("classname")).toBe(false)
    expect(rules(title)).toContain("font-weight:500")
  })

  it("spreads a style on an SVG element too", () => {
    const svg = render(() => <DitherGauge value={40} label="Load" />).container.querySelector("svg")!
    expect(svg.getAttribute("class")).toBeTruthy()
    expect(rules(svg)).toContain("position:absolute")
  })

  it("writes conditions: a pseudo-element, focus and hover", () => {
    render(() => <DitherInput placeholder="Name" />)
    const css = sheets()
    expect(css).toMatch(/::placeholder\{color:var\(--placeholder, ?var\(--muted-foreground\)\)\}/)
    expect(css).toMatch(/:focus-visible\{border-color:var\(--ring\)\}/)
    expect(css).toMatch(/@media \(hover: hover\)\{\.x\w+:hover\{border-color:/)
  })

  it("reads a record of records", () => {
    const y = render(() => <Spacer size="lg" />).container.firstElementChild!
    expect(rules(y)).toContain("height:24px")
    expect(rules(y)).toContain("flex-shrink:0")
    const x = render(() => <Spacer size="xs" axis="x" />).container.firstElementChild!
    expect(rules(x)).toContain("width:4px")
  })

  it("carries a template literal and a `classList` as conditions", () => {
    const [open, shut] = [true, false].map((modelValue) => {
      const { container } = render(() => (
        <DitherSidebarSub label="More" modelValue={modelValue}>
          x
        </DitherSidebarSub>
      ))
      return rules([...container.querySelectorAll("span")].find((s) => s.textContent?.trim() === "›")!)
    })
    expect(open).toMatch(/rotate:90deg|rotate\(90deg\)/)
    expect(shut).not.toMatch(/rotate:90deg|rotate\(90deg\)/)
    expect(shut).toContain("font-size:11px")

    const marks = [true, false].map((modelValue) => {
      const { container } = render(() => (
        <DitherCollapsible title="More" modelValue={modelValue}>
          x
        </DitherCollapsible>
      ))
      return [...container.querySelectorAll("*")].some((el) => /rotate:90deg|rotate\(90deg\)/.test(rules(el)))
    })
    expect(marks).toEqual([true, false])
  })

  it("merges a class list written by hand, the consumer's style last", () => {
    const mine = stylex.create({ tall: { height: "99px" } })
    const el = render(() => <DitherSidebarItem label="Home" active xstyle={mine.tall} class="mine" />).container
      .firstElementChild!
    expect(el.classList).toContain("mine")
    expect(rules(el)).toContain("height:99px")
    expect(rules(el)).not.toContain("height:2rem")
    expect(rules(el)).toContain("background-color:var(--card)")
  })

  it("exports what the Solid layer exports", () => {
    expect(Object.keys(layer).sort()).toEqual(Object.keys(solid).sort())
  })
})
