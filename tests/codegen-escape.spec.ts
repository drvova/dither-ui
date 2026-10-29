// The code the Studio writes for a frame goes into the reader's project
// (the export dialog, `code.get`, the `get_code` tool), and a frame's values
// come from files, links and agents. Whatever a value holds, the SFC stays a
// valid component whose values are data: Vue's own compiler reads it, and no
// handler, mustache or script appears that the frame did not put there.
import { compileScript, compileTemplate, parse } from "vue/compiler-sfc"
import { describe, expect, it } from "rstack/test"
import { chartCode } from "../src/entities/chart/model/codegen"
import { createChart } from "../src/entities/chart/model/factory"
import { widgetCode } from "../src/entities/widget/model/codegen"
import { createComponent, createWidget } from "../src/entities/widget/model/factory"
import { componentEntry } from "../src/entities/widget/model/registry"

const HOSTILE = `x" @click="alert(1)" y='z' {{ alert(2) }} </script><script>alert(3)</script> &amp; ${String.fromCharCode(0x2028)}`

/** Compiles as Vue would; returns the render code and the script. */
function compile(code: string) {
  const { descriptor, errors } = parse(code)
  expect(errors).toEqual([])
  const script = compileScript(descriptor, { id: "t" }).content
  const tpl = compileTemplate({ source: descriptor.template!.content, filename: "t.vue", id: "t" })
  expect(tpl.errors).toEqual([])
  return { script, render: tpl.code }
}

const noInjection = ({ script, render }: { script: string; render: string }) => {
  expect(render).not.toMatch(/onClick/)
  expect(render).not.toMatch(/alert\(2\)\)/)
  expect(script).not.toMatch(/<script>alert/)
  expect(script).not.toMatch(/^\s*alert\(/m)
}

describe("generated SFCs keep document values as data", () => {
  it("a chart's labels, series keys and names", () => {
    const chart = createChart("area")
    chart.rows[0].month = HOSTILE
    chart.series[0].label = HOSTILE
    chart.grid.dash = HOSTILE
    const key = chart.series[0].key
    chart.series[0].key = `a: 1 }; alert(4); const b = { c`
    for (const r of chart.rows) r[chart.series[0].key] = r[key]
    const out = compile(chartCode(chart))
    noInjection(out)
    expect(out.script).not.toMatch(/^\s*alert\(4\)/m)
  })

  it("a custom glow, a seeded texture and a seeded easing come out as values", () => {
    const chart = createChart("line")
    chart.bloom = { blur: 4, brightness: 1.3, opacity: 0.6, blend: "screen" }
    chart.series[0].variant = 42
    chart.easing = 7
    const code = chartCode(chart)
    compile(code)
    expect(code).toContain(`:bloom='{ blur: 4, brightness: 1.3, opacity: 0.6, blend: "screen" }'`)
    expect(code).toContain(`:variant="42"`)
    expect(code).toContain(`:easing="7"`)
  })

  it("a component's props, slot text and v-model value", () => {
    const w = createComponent(componentEntry("DitherInput")!)
    w.props.placeholder = HOSTILE
    w.model = HOSTILE
    noInjection(compile(widgetCode(w, { w: 300, h: 200 })))
    const b = createComponent(componentEntry("DitherToggle")!)
    b.slotText = HOSTILE
    noInjection(compile(widgetCode(b, { w: 300, h: 200 })))
  })

  it("a bespoke button, avatar and image", () => {
    const button = { ...createWidget("button"), label: HOSTILE, variant: HOSTILE }
    noInjection(compile(widgetCode(button as never, { w: 300, h: 200 })))
    const avatar = { ...createWidget("avatar"), name: HOSTILE, mirror: HOSTILE }
    noInjection(compile(widgetCode(avatar as never, { w: 300, h: 200 })))
    const image = { ...createWidget("image"), src: HOSTILE, alt: HOSTILE }
    noInjection(compile(widgetCode(image as never, { w: 300, h: 200 })))
  })
})
