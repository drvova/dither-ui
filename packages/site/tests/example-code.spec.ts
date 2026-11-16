// An example module as its card shows it for the props the page's pickers
// set: the props parameter gone, each read written as its value, its
// default, or (an attribute with neither) left out.
import { describe, expect, it } from "rstack/test"
import { exampleCode } from "@/pages/docs/example-code"

const TERMINAL = `import { DitherFaultyTerminal, type DitherColor } from "@dither-kit"

export default function Example(props: {
  tint?: DitherColor
  scale?: number
  dither?: number
  colors?: string[]
}) {
  return (
    <div class="relative h-56">
      <DitherFaultyTerminal
        tint={props.tint ?? "green"}
        scale={props.scale ?? 1.5}
        dither={props.dither}
        colors={props.colors ?? ["#5227FF", "#7CFF67"]}
      />
    </div>
  )
}
`

describe("an example's code", () => {
  it("writes each prop's default where the page sets none", () => {
    const code = exampleCode(TERMINAL)
    expect(code).toContain("export default function Example() {")
    expect(code).toContain('tint="green"')
    expect(code).toContain("scale={1.5}")
    expect(code).toContain('colors={["#5227FF", "#7CFF67"]}')
    expect(code).not.toContain("dither=")
    expect(code).not.toContain("props")
  })
  it("writes the values the pickers set, strings as the attribute's own", () => {
    const code = exampleCode(TERMINAL, { tint: "blue", dither: 1, colors: ["#FF3D2E"], scale: undefined })
    expect(code).toContain('tint="blue"')
    expect(code).toContain("dither={1}")
    expect(code).toContain('colors={["#FF3D2E"]}')
    expect(code).toContain("scale={1.5}")
  })
  it("refuses a read with neither a value nor a default outside an attribute", () => {
    expect(() =>
      exampleCode("export default function Example(props: { a?: string }) {\n  return <p>{props.a.length}</p>\n}"),
    ).toThrow()
  })
})
