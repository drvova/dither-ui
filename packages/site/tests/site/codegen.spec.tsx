// The code the Studio writes for a frame: a `.tsx` component on the
// kit's Solid layer, in the reader's styling system. It goes into the
// reader's project (the export dialog, `code.get`, the `get_code` tool), and
// a frame's values come from files, links and agents: whatever a value
// holds, the file stays a component Solid's own compiler reads, whose values
// are data.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cleanup, render } from "@solidjs/testing-library"
import { render as mount } from "solid-js/web"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { createArtboard } from "@/entities/artboard"
import { createChart } from "@/entities/chart/model/factory"
import { createComponent, createReel, createWidget } from "@/entities/widget/model/factory"
import { COMPONENT_REGISTRY, componentEntry } from "@/entities/widget/model/registry"
import { addCell, createScreen } from "@/entities/widget/model/screen"
import { CHART_TYPES } from "@/shared/config"
import { restyle, STYLINGS } from "@dither-ui/restyle"
import { frameCode, shown } from "../../src/entities/artboard/code"
import { chartCode } from "../../src/entities/chart/model/codegen"
import { widgetCode } from "../../src/entities/widget/model/codegen"
import { modelOf, SCOPED_CHILDREN } from "../../src/entities/widget/model/model"
import { registrySchema } from "../../src/features/agent"
import { type Compile, compiler, evaluate } from "../../src/widgets/source/model/compile"
import { PACKAGES } from "../../src/widgets/source/model/run"
import { WidgetRenderer } from "../../src/widgets/widget-renderer"
import { world } from "@dither-ui/kit/testing/world.ts"

const HOSTILE = `x" onClick={alert(1)} y='z' {alert(2)} {{ alert(2) }} </script><script>alert(3)</script><img src=x onerror=alert(5)> &amp; \\" */ \` \${alert(6)} ${String.fromCharCode(0x2028)}`
const FRAME = { w: 300, h: 200 }

let compile: Compile
beforeAll(async () => {
  compile = await compiler()
}, 60_000)

const alerted = vi.fn()
afterEach(() => {
  cleanup()
  alerted.mockClear()
  document.body.innerHTML = ""
})

type Seen = { is: string; props: Record<string, unknown> }

/** The file compiled by Solid's own compiler (the docs' Run's), evaluated
 * and mounted against a kit that only records what each component is
 * handed. Returns those props and the page it made. */
function run(code: string) {
  vi.stubGlobal("alert", alerted)
  const seen: Seen[] = []
  const kit = new Proxy(
    {},
    {
      has: () => true,
      get: (_, is) => (props: Record<string, unknown>) => {
        const own: Record<string, unknown> = {}
        for (const k of Object.keys(props)) if (k !== "children") own[k] = props[k]
        const children = props.children
        const inner = typeof children === "function" ? (children as (scope: object) => unknown)({}) : children
        seen.push({ is: String(is), props: { ...own, ...(typeof inner === "string" ? { children: inner } : {}) } })
        return inner
      },
    },
  )
  const exports = evaluate(compile("frame.tsx", code), (spec) =>
    spec === "@dither-kit"
      ? kit
      : spec.startsWith("./")
        ? { default: new Proxy({}, { get: (_, name) => String(name) }) }
        : PACKAGES[spec],
  )
  const host = document.body.appendChild(document.createElement("div"))
  const component = exports.default as (() => Element) | undefined
  if (component) mount(component, host)
  return { seen, host, component }
}

/** Nothing the frame did not put there: no script ran, no element or
 * listener came out of a value, and every component got only props. */
function noInjection({ seen, host }: ReturnType<typeof run>, allowed: string[] = []) {
  expect(alerted).not.toHaveBeenCalled()
  expect(host.querySelector("script, img")).toBeNull()
  for (const el of host.querySelectorAll("*"))
    expect(el.getAttributeNames().filter((n) => !["class", "style"].includes(n))).toEqual([])
  const handlers = seen.flatMap((s) => Object.keys(s.props).filter((k) => /^on|^y$/.test(k) && !allowed.includes(k)))
  expect(handlers).toEqual([])
}

const got = (out: ReturnType<typeof run>, is: string) => out.seen.find((s) => s.is === is)!.props

describe("generated components keep document values as data", () => {
  it("a chart's labels, series keys and names", () => {
    const chart = createChart("area")
    chart.rows[0].month = HOSTILE
    chart.series[0].label = HOSTILE
    chart.grid.dash = HOSTILE
    const key = chart.series[0].key
    chart.series[0].key = `a: 1 }; alert(4); const b = { c`
    for (const r of chart.rows) r[chart.series[0].key] = r[key]
    const out = run(chartCode(chart))
    noInjection(out)
    expect(got(out, "Grid").strokeDasharray).toBe(HOSTILE)
    const root = got(out, "AreaChart") as { data: Record<string, unknown>[]; config: Record<string, { label: string }> }
    expect(root.data[0].month).toBe(HOSTILE)
    expect(root.config[chart.series[0].key].label).toBe(HOSTILE)
    expect(got(out, "Area").dataKey).toBe(chart.series[0].key)
  })

  it("a custom glow, a seeded texture and a seeded easing come out as values", () => {
    const chart = createChart("line")
    chart.bloom = { blur: 4, brightness: 1.3, opacity: 0.6, blend: "screen" }
    chart.series[0].variant = 42
    chart.easing = 7
    const code = chartCode(chart)
    expect(code).toContain(`bloom={{ blur: 4, brightness: 1.3, opacity: 0.6, blend: "screen" }}`)
    expect(code).toContain(`variant={42}`)
    expect(code).toContain(`easing={7}`)
    const out = run(code)
    expect(got(out, "LineChart").bloom).toEqual(chart.bloom)
    expect(got(out, "Line").variant).toBe(42)
  })

  it("a field's label, carried by its DitherField", () => {
    const w = createComponent(componentEntry("DitherEmailInput")!)
    w.props.label = HOSTILE
    const out = run(widgetCode(w, { w: 280, h: 90 }))
    noInjection(out, ["onUpdateModelValue"])
    expect(got(out, "DitherField").label).toBe(HOSTILE.trim())
  })

  it("a component's props, slot text and model value", () => {
    const w = createComponent(componentEntry("DitherInput")!)
    w.props.placeholder = HOSTILE
    w.model = HOSTILE
    const out = run(widgetCode(w, FRAME))
    noInjection(out, ["onUpdateModelValue"])
    expect(got(out, "DitherInput")).toMatchObject({ placeholder: HOSTILE, modelValue: HOSTILE })
    const b = createComponent(componentEntry("DitherToggle")!)
    b.slotText = HOSTILE
    const toggle = run(widgetCode(b, FRAME))
    noInjection(toggle, ["onUpdateModelValue"])
    expect(got(toggle, "DitherToggle").children).toBe(HOSTILE)
    // a scoped component's text is a function's answer, as much a value
    const scoped = createComponent(componentEntry("DitherInView")!)
    scoped.slotText = HOSTILE
    const inView = run(widgetCode(scoped, FRAME))
    noInjection(inView)
    expect(got(inView, "DitherInView").children).toBe(HOSTILE)
  })

  it("a bespoke button, avatar and image", () => {
    const button = run(widgetCode({ ...createWidget("button"), label: HOSTILE, variant: HOSTILE } as never, FRAME))
    noInjection(button)
    expect(got(button, "DitherButton")).toEqual({ variant: HOSTILE, children: HOSTILE })
    const avatar = run(widgetCode({ ...createWidget("avatar"), name: HOSTILE, mirror: HOSTILE } as never, FRAME))
    noInjection(avatar)
    expect(got(avatar, "DitherAvatar")).toMatchObject({ name: HOSTILE, mirror: HOSTILE })
    const image = run(widgetCode({ ...createWidget("image"), src: HOSTILE, alt: HOSTILE } as never, FRAME))
    noInjection(image)
    expect(got(image, "DitherImage")).toMatchObject({ src: `${HOSTILE.slice(0, 80)}…`, alt: HOSTILE })
  })

  it("a screen's cells, and a size that is not a number", () => {
    const s = createScreen()
    const input = addCell(s.rows[0], componentEntry("DitherInput")!)
    input.props.label = HOSTILE
    input.props.placeholder = HOSTILE
    input.model = HOSTILE
    addCell(s.rows[0], componentEntry("DitherBadge")!).slotText = HOSTILE
    ;(s as { gap: unknown }).gap = `1px" onClick={alert(7)} x="`
    ;(s.rows[0] as { align: unknown }).align = HOSTILE
    const out = run(widgetCode(s, { w: 380, h: 300 }))
    noInjection(out, ["onUpdateModelValue"])
    expect(got(out, "DitherInput")).toMatchObject({ placeholder: HOSTILE, modelValue: HOSTILE })
    expect(out.host.querySelector("div")!.getAttribute("style")).toContain("gap:0px")
  })

  it("a reel's words cannot close the comment they stand in", () => {
    const reel = createReel(["a */ alert(8) /*"])
    reel.clips[0].chapter = { line: "*/ alert(9) /*", spec: [] }
    const code = widgetCode(reel, FRAME)
    expect(code.match(/\*\//g)).toHaveLength(1)
    const out = run(code)
    expect(out.component).toBeUndefined()
    expect(alerted).not.toHaveBeenCalled()
  })

  it("every way of styling a hostile frame", () => {
    const a = createArtboard("button")
    a.name = HOSTILE
    a.widget = createScreen()
    addCell(a.widget.rows[0], componentEntry("DitherInput")!).props.placeholder = HOSTILE
    for (const system of STYLINGS) {
      const f = frameCode(a, system)
      expect(f.file).toMatch(/^[\w-]+\.tsx$/)
      if (f.sheet) expect(f.sheet.file).toMatch(/^[\w-]+(\.module)?\.css$/)
      noInjection(run(f.code), ["onUpdateModelValue"])
    }
  })
})

describe("widgetCode", () => {
  const frame = { w: 280, h: 280 }
  it("writes a default-exported Solid component on the kit", () => {
    const code = widgetCode(createWidget("button"), frame)
    expect(code).toBe(
      `import { DitherButton } from "@dither-kit"\n\nexport default function Frame() {\n  return (\n    <DitherButton>${(createWidget("button") as { label: string }).label}</DitherButton>\n  )\n}`,
    )
    expect(code).not.toMatch(/<script|<template|v-model|from "vue"/)
  })
  it("avatar defaults stay minimal (name + size only)", () => {
    const code = widgetCode(createWidget("avatar"), frame)
    expect(code).toContain("DitherAvatar")
    expect(code).toContain('name="Ada Lovelace"')
    expect(code).toContain("size={280}")
    expect(code).not.toContain("grid=")
    expect(code).not.toContain("mirror=")
  })
  it("avatar non-defaults emit", () => {
    const a = createWidget("avatar")
    if (a.kind !== "avatar") throw new Error("unreachable")
    a.grid = 12
    a.density = 0.2
    a.mirror = "vertical"
    a.autoColor = false
    a.color = "#7cbf87"
    a.cellPx = 6
    const code = widgetCode(a, frame)
    expect(code).toContain("grid={12}")
    expect(code).toContain("density={0.2}")
    expect(code).toContain('mirror="vertical"')
    expect(code).toContain('color="#7cbf87"')
    expect(code).toContain("cellPx={6}")
  })
  it("button label lands in the children; custom bloom emits an object", () => {
    const b = createWidget("button")
    if (b.kind !== "button") throw new Error("unreachable")
    b.label = "Deploy"
    b.bloom = { blur: 5, brightness: 1.5, opacity: 0.78, saturate: 1.5 }
    const code = widgetCode(b, frame)
    expect(code).toContain(">Deploy</DitherButton>")
    expect(code).toContain("bloom={{ blur: 5, brightness: 1.5, opacity: 0.78, saturate: 1.5 }}")
  })
  it("gradient two-tone emits from + to", () => {
    const g = createWidget("gradient")
    if (g.kind !== "gradient") throw new Error("unreachable")
    g.twoTone = true
    g.to = "#ff00aa"
    g.direction = "down"
    const code = widgetCode(g, frame)
    expect(code).toContain('from="blue"')
    expect(code).toContain('to="#ff00aa"')
    expect(code).toContain('direction="down"')
  })
  it("a model is a signal, bound by the prop and the callback the kit takes", () => {
    const input = widgetCode(createComponent(componentEntry("DitherInput")!), frame)
    expect(input).toContain('import { createSignal } from "solid-js"')
    expect(input).toContain('const [value, setValue] = createSignal("")')
    expect(input).toContain("<DitherInput modelValue={value()} onUpdateModelValue={setValue} />")
    // a model on its own prop and event: an update carries the next value...
    const page = widgetCode(createComponent(componentEntry("DitherPagination")!), frame)
    expect(page).toContain("page={value()} onUpdatePage={setValue}")
    // ...and an event that only says the control is done sets it false
    const dialog = widgetCode(createComponent(componentEntry("DitherDialog")!), frame)
    expect(dialog).toContain("open={value()} onClose={() => setValue(false)}")
    const out = run(dialog)
    ;(got(out, "DitherDialog").onClose as () => void)()
    // each cell of a screen binds its own, the same way
    const s = createScreen()
    addCell(s.rows[0], componentEntry("DitherSwitch")!)
    addCell(s.rows[0], componentEntry("DitherPagination")!)
    const screen = widgetCode(s, frame)
    expect(screen).toContain("modelValue={value1()} onUpdateModelValue={setValue1}")
    expect(screen).toContain("page={value2()} onUpdatePage={setValue2}")
  })
})

describe("chartCode", () => {
  it("defaults emit a minimal root tag", () => {
    const code = chartCode(createChart("area"))
    expect(code).toContain('<AreaChart data={data} config={config} bloom="low">')
    expect(code).toMatch(/^import \{ AreaChart, Area, .*type ChartConfig \} from "@dither-kit"\n/)
    expect(code).toContain("export default function Frame() {")
    expect(code).not.toContain("cell=")
    expect(code).not.toContain("easing=")
  })
  it("non-defaults emit their attributes", () => {
    const c = createChart("bar")
    c.cell = 4
    c.stagger = 0.8
    c.easing = "linear"
    c.barGap = 0.1
    const code = chartCode(c)
    expect(code).toContain("cell={4}")
    expect(code).toContain("stagger={0.8}")
    expect(code).toContain('easing="linear"')
    expect(code).toContain("barGap={0.1}")
  })
  it("custom bezier + texture + bloom emit object/array literals", () => {
    const c = createChart("area")
    c.easing = [0.4, 0.68, 0.3, 1]
    c.bloom = { blur: 12, brightness: 1.35, opacity: 0.4, saturate: 1.4 }
    c.series[0].variant = { ramp: 0.3, hatch: 6 }
    const code = chartCode(c)
    expect(code).toContain("easing={[0.4, 0.68, 0.3, 1]}")
    expect(code).toContain("bloom={{ blur: 12, brightness: 1.35, opacity: 0.4, saturate: 1.4 }}")
    expect(code).toContain("variant={{ ramp: 0.3, hatch: 6 }}")
  })
  it("markers render as children with imports", () => {
    const c = createChart("area")
    c.series[0].dots.on = true
    c.series[0].activeDot.on = true
    const code = chartCode(c)
    expect(code).toContain("<Dot />")
    expect(code).toContain("<ActiveDot />")
    expect(code).toContain("</Area>")
    expect(code).toMatch(/import \{ .*Dot.*ActiveDot.* \}/)
  })
  it("edited data flows into the literal", () => {
    const c = createChart("area")
    c.rows[0].desktop = 999
    expect(chartCode(c)).toContain("desktop: 999")
  })
  it("names every prop the way the Solid kit takes it", () => {
    const pie = chartCode(createChart("pie"))
    expect(pie).toMatch(/dataKey="value"\n\s+nameKey="name"\n\s+innerRadius=\{/)
    const c = createChart("area")
    c.grid.dash = "2 6"
    c.stackType = "stacked"
    c.margins.left = 60
    const code = chartCode(c)
    expect(code).toContain('strokeDasharray="2 6"')
    expect(code).toContain('stackType="stacked"')
    expect(code).toContain("margins={{ top: 10, right: 12, bottom: 22, left: 60 }}")
    expect(`${pie}${code}${chartCode(createChart("radar"))}`).not.toMatch(/\s:?[a-z]+-[a-z-]+=/)
  })
})

describe("a field's label in the export", () => {
  /** The screen from the live run: an email field and a password field. */
  function signIn(labels: [string, string]) {
    const s = createScreen()
    const email = addCell(s.rows[0], componentEntry("DitherEmailInput")!)
    const password = addCell(s.rows[0], componentEntry("DitherPasswordInput")!)
    email.props.label = labels[0]
    password.props.label = labels[1]
    email.grow = true
    return s
  }

  it("exports the same pairing, and nothing new without a label", () => {
    const code = widgetCode(signIn(["Email", ""]), { w: 380, h: 300 })
    expect(code).toContain('import { DitherEmailInput, DitherField, DitherPasswordInput } from "@dither-kit"')
    expect(code).toMatch(
      /<DitherField label="Email" class="flex-1">\n\s+<DitherEmailInput [^>]*class="w-full" \/>\n\s+<\/DitherField>/,
    )
    expect(code).not.toContain('label=""')
    expect(code.match(/<DitherField/g)).toHaveLength(1)
    const alone = createComponent(componentEntry("DitherInput")!)
    expect(widgetCode(alone, { w: 280, h: 90 })).not.toContain("DitherField")
    alone.props.label = "Name"
    expect(widgetCode(alone, { w: 280, h: 90 })).toContain('<DitherField label="Name">')
  })
})

describe("a frame as the files a reader takes away", () => {
  it("names the component after the frame, and the stylesheet it imports", () => {
    const a = createArtboard("image")
    a.name = "Hero shot"
    expect(frameCode(a, "tailwind")).toMatchObject({ file: "hero-shot.tsx", sheet: null })
    expect(frameCode(a, "tailwind").code).toContain('class="h-64"')
    const css = frameCode(a, "css")
    expect(css.code).toContain('import "./hero-shot.css"')
    expect(css.code).not.toContain("h-64")
    expect(css.sheet).toMatchObject({ file: "hero-shot.css" })
    expect(css.sheet!.text).toContain("height: 16rem;")
    const modules = frameCode(a, "modules")
    expect(modules.code).toContain('import styles from "./hero-shot.module.css"')
    expect(modules.code).toContain("class={styles.")
    expect(modules.sheet!.file).toBe("hero-shot.module.css")
    const sx = frameCode(a, "stylex")
    expect(sx.sheet).toBeNull()
    expect(sx.code).toContain("stylex.create({")
    expect(sx.code).toContain("{...stylex.props(styles.")
    a.name = "  "
    expect(frameCode(a, "tailwind").file).toBe("-.tsx")
    a.name = ""
    expect(frameCode(a, "tailwind").file).toBe("artboard.tsx")
  })

  it("reads as `restyle(…)` writes it", () => {
    const a = createArtboard("gradient")
    a.name = "styles"
    for (const system of STYLINGS)
      expect(shown(frameCode(a, system))).toBe(restyle(widgetCode(a.widget!, { w: a.w, h: a.h }), system))
  })
})

describe("every frame the Studio can place", () => {
  const OWN_CLASSES = new Set(["dither-kit"])
  /** The Tailwind classes a StyleX rewrite left behind. */
  function leftovers(code: string): string[] {
    const left: string[] = []
    for (const m of code.matchAll(/\sclass="([^"]*)"/g)) left.push(...m[1].split(/\s+/))
    for (const m of code.matchAll(/\sclass=\{`([^`]*)`\}/g))
      left.push(...m[1].replace(/\$\{[^}]*\}/g, " ").split(/\s+/))
    return left.filter((c) => c && !OWN_CLASSES.has(c))
  }

  const frames: [string, string][] = [
    ...COMPONENT_REGISTRY.map((e): [string, string] => [e.is, widgetCode(createComponent(e), { w: 480, h: 320 })]),
    ...(["avatar", "button", "image", "gradient"] as const).map((k): [string, string] => [
      k,
      widgetCode(createWidget(k), { w: 480, h: 320 }),
    ]),
    ...CHART_TYPES.map((t): [string, string] => [`${t} chart`, chartCode(createChart(t))]),
  ]

  it("exports to a component Solid's compiler reads, in every styling system", () => {
    expect(frames.length).toBeGreaterThan(250)
    const bad: string[] = []
    for (const [what, code] of frames) {
      if (
        !/^(import [^\n]+\n)+\nexport default function Frame\(\) \{\n/.test(
          code.replace(/\nconst [\s\S]*?\n[}\]]\n/g, ""),
        )
      )
        bad.push(`${what}: not a default-exported component`)
      if (/<script|<template|\sv-[a-z]+|\s[:@][\w-]+=|from "vue"/.test(code)) bad.push(`${what}: Vue left in it`)
      for (const system of STYLINGS) {
        try {
          compile(`${what}.tsx`, restyle(code, system).replace(/\n\n\/\* [\w.-]+\.css \*\/\n[\s\S]*$/, ""))
        } catch (e) {
          bad.push(`${what} (${system}): ${(e as Error).message}`)
        }
      }
    }
    expect(bad).toEqual([])
  }, 120_000)

  it("mounts, handing each component only what its registry row names", () => {
    const bad: string[] = []
    for (const e of COMPONENT_REGISTRY) {
      const out = run(widgetCode(createComponent(e), { w: 480, h: 320 }))
      const model = modelOf(e)
      const known = new Set([...e.props.map((p) => p.key), "children", ...(model ? [model.prop, model.on] : [])])
      const props = out.seen.find((s) => s.is === e.is)?.props
      if (!props) bad.push(`${e.is}: not rendered`)
      else
        bad.push(
          ...Object.keys(props)
            .filter((k) => !known.has(k))
            .map((k) => `${e.is}: ${k}`),
        )
      out.host.remove()
    }
    expect(bad).toEqual([])
  }, 120_000)

  it("leaves no Tailwind class once restyled to StyleX", () => {
    const left: string[] = []
    for (const [what, code] of frames) left.push(...leftovers(restyle(code, "stylex")).map((c) => `${what}: ${c}`))
    // a screen's own layout classes, and the ones it hands its cells
    const s = createScreen()
    addCell(s.rows[0], componentEntry("DitherEmailInput")!).grow = true
    const labelled = addCell(s.rows[0], componentEntry("DitherInput")!)
    labelled.grow = true
    labelled.props.label = "Name"
    const screen = restyle(widgetCode(s, { w: 480, h: 320 }), "stylex")
    left.push(...leftovers(screen).map((c) => `screen: ${c}`))
    expect(screen).toContain("stylex.props(")
    expect(left).toEqual([])
  })
})

describe("the registry's model rows, for Solid", () => {
  it("names the prop and the callback of every model, from the shared table", () => {
    const rows = registrySchema().components
    expect(rows.every((r) => !("vmodel" in r))).toBe(true)
    const row = (is: string) => rows.find((r) => r.is === is)!.model
    expect(row("DitherSlider")).toEqual({ default: 40, prop: "modelValue", on: "onUpdateModelValue" })
    expect(row("DitherPagination")).toEqual({ default: 4, prop: "page", on: "onUpdatePage" })
    expect(row("DitherDialog")).toEqual({ default: false, prop: "open", on: "onClose" })
    expect(row("DitherAlertDialog")).toEqual({ default: false, prop: "open", on: "onCancel" })
    expect(row("DitherBadge")).toBeNull()
    for (const e of COMPONENT_REGISTRY)
      expect(row(e.is), e.is).toEqual(
        e.vmodel
          ? {
              default: e.vmodel.def,
              prop: e.vmodel.prop ?? "modelValue",
              on:
                { "update:page": "onUpdatePage", close: "onClose", cancel: "onCancel" }[e.vmodel.event ?? ""] ??
                "onUpdateModelValue",
            }
          : null,
      )
  })
})

describe("slot text on a component whose children are a function", () => {
  it("holds the list to the kit's own prop types", () => {
    const kit = join(__dirname, "../../../dither-kit/src/solid")
    const index = readFileSync(join(kit, "index.ts"), "utf8")
    const scoped = COMPONENT_REGISTRY.filter((e) => e.slotText != null)
      .filter((e) => {
        const file = new RegExp(`default as ${e.is}\\b[^}]*\\} from "\\./([\\w-]+)"`).exec(index)?.[1]
        expect(file, e.is).toBeTruthy()
        return /children\??: (\(scope|PluralSlot)/.test(readFileSync(join(kit, `${file}.tsx`), "utf8"))
      })
      .map((e) => e.is)
    expect(scoped.sort()).toEqual([...SCOPED_CHILDREN].sort())
  })

  it.each([...SCOPED_CHILDREN])("%s stands on the canvas with its text", (is) => {
    world()
    const w = createComponent(componentEntry(is)!)
    const r = render(() => <WidgetRenderer widget={w} artboardId="a" />)
    expect(r.container.textContent).toContain(w.slotText)
  })
})
