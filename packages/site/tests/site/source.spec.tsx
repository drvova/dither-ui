// The docs previews' source panel: the files a preview is made of,
// the compiler and the linker behind Run, the kit's served sources, and a
// DemoCard opened to its files, edited and run. The zip, the sounds and the
// StyleX runtime are framework-free modules, held by `tests/source.spec.ts`.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { KIT_SRC } from "@/shared/lib/kit-sources"
import { restyleSolid, STYLINGS } from "@dither-ui/restyle"
import { kitFiles } from "../../build/kit-sources"
import DemoCard, { DEMO_FIT } from "../../src/pages/docs/DemoCard"
import { toSolidCode } from "../../src/pages/docs/solid"
import { docsCode } from "../../src/pages/docs/snippet"
import { setStyling } from "../../src/shared/lib/restyle"
import {
  type Compile,
  CompileError,
  compiler,
  cssModule,
  evaluate,
  scopeTokens,
} from "../../src/widgets/source/model/compile"
import {
  exampleName,
  kitFilesOf,
  kitIndex,
  loadKitIndex,
  promptFor,
  resolveKitFile,
  type SourceFile,
} from "../../src/widgets/source/model/files"
import { PACKAGES } from "../../src/widgets/source/model/run"
import { asSfc, snippetKind } from "../../src/widgets/source/model/snippet"
import { world } from "@dither-ui/kit/testing/world.ts"

// the build's own listing of the kit (`kitSources` in `../../kit-sources.ts`)
const SOLID = await kitFiles()
const solidFiles = SOLID.map((f) => f.file)
const read = (list: typeof SOLID, file: string) => readFileSync(list.find((f) => f.file === file)!.path, "utf8")
const SOLID_INDEX = await loadKitIndex(async (f) => read(SOLID, f), solidFiles, "solid/index.ts")

const SWITCH = `<script setup lang="ts">
import { ref } from "vue"
import { DitherSwitch } from "@dither-kit"

const bloom = ref(true)
</script>

<template>
  <label class="flex items-center justify-between gap-4">
    <span class="text-[13px]">Bloom on hover</span>
    <DitherSwitch v-model="bloom" label="Bloom on hover" color="blue" />
  </label>
</template>`

const SWITCH_TSX = `import { createSignal } from "solid-js"
import { DitherSwitch } from "@dither-kit"

export default function Example() {
  const [bloom, setBloom] = createSignal(true)

  return (
    <label class="flex items-center justify-between gap-4">
      <span class="text-[13px]">Bloom on hover</span>
      <DitherSwitch modelValue={bloom()} onUpdateModelValue={setBloom} label="Bloom on hover" color="blue" />
    </label>
  )
}`

let compile: Compile
beforeAll(async () => {
  compile = await compiler()
}, 60000)

describe("the kit's served sources", () => {
  it("lists the kit as its files import each other", () => {
    expect(solidFiles).toContain("solid/index.ts")
    expect(solidFiles).toContain("solid/DitherSwitch.tsx")
    expect(solidFiles).toContain("solid/runtime/surface.ts")
    expect(solidFiles).toContain("engine/theme.css")
    expect(solidFiles).toContain("engine/pixel.ts")
    expect(solidFiles).toContain("tailwind/lib.ts")
    // the Tailwind layer gives its framework-free modules only; the StyleX layer nothing
    expect(solidFiles.filter((f) => /\.vue$|^stylex\/|node_modules/.test(f))).toEqual([])
    expect(solidFiles).toEqual([...solidFiles].sort())
  })

  it("holds every file the Solid kit's own files import", () => {
    const missing: string[] = []
    for (const f of SOLID.filter((x) => x.file.startsWith("solid/")))
      for (const m of readFileSync(f.path, "utf8").matchAll(/\b(?:from|import)\s*["'](\.[^"']+)["']/g))
        if (!resolveKitFile(m[1], solidFiles, f.file)) missing.push(`${f.file}: ${m[1]}`)
    expect(missing).toEqual([])
  })
})

describe("source files", () => {
  it("reads a kit index as export name → the file that defines it", () => {
    expect(SOLID_INDEX.get("DitherSwitch")).toEqual({ file: "solid/DitherSwitch.tsx", name: "default" })
    expect(SOLID_INDEX.get("DitherAurora")).toEqual({ file: "solid/Aurora.tsx", name: "default" })
    expect(SOLID_INDEX.get("cn")).toEqual({ file: "tailwind/lib.ts", name: "cn" })
    // through the engine's API, which every layer's index re-exports whole
    expect(SOLID_INDEX.get("copyText")).toEqual({ file: "engine/copy-text.ts", name: "copyText" })
    expect(kitIndex(read(SOLID, "solid/index.ts"), solidFiles, "solid/index.ts").has("copyText")).toBe(false)
    expect(SOLID_INDEX.has("DitherButtonProps")).toBe(false)
    expect(resolveKitFile("../engine/pixel", solidFiles, "solid/DitherButton.tsx")).toBe("engine/pixel.ts")
    expect(resolveKitFile("./DitherSwitch", solidFiles, "solid/index.ts")).toBe("solid/DitherSwitch.tsx")
    expect(resolveKitFile("../tailwind/lib", solidFiles, "solid/DitherButton.tsx")).toBe("tailwind/lib.ts")
    expect(resolveKitFile("./nope", solidFiles, "solid/x.tsx")).toBeUndefined()
  })

  it("completes a fragment into a Solid file with what it uses imported", () => {
    const names = new Set(SOLID_INDEX.keys())
    expect(snippetKind(SWITCH)).toBe("sfc")
    expect(toSolidCode(asSfc(SWITCH, names))).toBe(SWITCH_TSX)
    expect(toSolidCode(asSfc('const level = ref(40)\n\n<!-- one -->\n<DitherSlider v-model="level" />', names))).toBe(
      `import { createSignal } from "solid-js"
import { DitherSlider } from "@dither-kit"

export default function Example() {
  const [level, setLevel] = createSignal(40)

  return (
    <>
      {/* one */}
      <DitherSlider modelValue={level()} onUpdateModelValue={setLevel} />
    </>
  )
}`,
    )
    expect(toSolidCode(asSfc('<DitherButton :matrix="bayerMatrix(4)">Go</DitherButton>', names))).toBe(
      `import { DitherButton, bayerMatrix } from "@dither-kit"

export default function Example() {
  return (
    <DitherButton matrix={bayerMatrix(4)}>Go</DitherButton>
  )
}`,
    )
  })

  it("lists the kit files an example imports", () => {
    const solid =
      'import { DitherSwitch, DitherButton, type DitherColor } from "@dither-kit"\nimport { createSignal } from "solid-js"'
    expect(kitFilesOf(solid, SOLID_INDEX, solidFiles)).toEqual(["solid/DitherSwitch.tsx", "solid/DitherButton.tsx"])
    // a file of the kit by its path
    expect(kitFilesOf('import { cn } from "@dither-kit/tailwind/lib"', SOLID_INDEX, solidFiles)).toEqual([
      "tailwind/lib.ts",
    ])
  })

  it("names the example and writes the brief from the files", () => {
    expect(exampleName("area-chart", 1, "sfc")).toBe("AreaChartExample.tsx")
    expect(exampleName("switch", 2, "fragment")).toBe("SwitchExample2.tsx")
    expect(exampleName("install", 1, "sh")).toBe("install.sh")
    const files: SourceFile[] = [
      { path: "SwitchExample.tsx", name: "SwitchExample.tsx", lang: "tsx", role: "example" },
      { path: "SwitchExample.css", name: "SwitchExample.css", lang: "css", role: "styles" },
      { path: "dither-kit/solid/DitherSwitch.tsx", name: "DitherSwitch.tsx", lang: "tsx", role: "kit" },
      { path: "dither-kit/engine/theme.css", name: "theme.css", lang: "css", role: "tokens" },
      { path: "prompt.md", name: "prompt.md", lang: "md", role: "prompt" },
    ]
    const md = promptFor(
      {
        title: "Switch",
        description: "A dithered toggle.",
        url: "https://dither-ui.com/docs/switch",
        install: "npx degit drvova/dither-ui/packages/dither-kit/src src/dither-kit",
        styling: "css",
      },
      files,
    )
    expect(md).toMatch(/^# Switch\n\nA dithered toggle\.\n\nLive preview: https:\/\/dither-ui\.com\/docs\/switch/)
    expect(md).toContain("- Stack: SolidJS (a `.tsx` component, signals) with TypeScript")
    expect(md).not.toMatch(/\bVue\b/)
    expect(md).toContain("```sh\nnpx degit drvova/dither-ui/packages/dither-kit/src src/dither-kit\n```")
    expect(md).toContain("- `dither-kit/solid/DitherSwitch.tsx` — a kit file the example imports")
    expect(md).toContain("- `SwitchExample.css` — the stylesheet the example imports")
    expect(md).toContain("plain CSS, in the stylesheet the example imports")
    expect(md).toContain("Render `SwitchExample.tsx`")
    expect(md).not.toMatch(/\n\n\n/)
  })
})

describe("compile: Solid's compiler, TypeScript out, imports linked", () => {
  const run = (code: string, mods: Record<string, Record<string, unknown>> = {}, file = "t.ts") =>
    evaluate(compile(file, code), (s) => mods[s])

  it("cuts type syntax and keeps the file's JavaScript", () => {
    const out = compile(
      "t.ts",
      `import type { A } from "./a"
import { b, type C } from "./b"
export interface P { x?: number }
export type Q = P | null
declare const g: number
function f<T extends object>(this: void, x?: number, y: T = {} as T): x is number { return x! > (y as any) }
const m = new Map<string, number>()
let z!: number
enum E { A, B }
abstract class K<T> implements P { private readonly a: number = 1; protected b?: string; declare c: number; abstract d(): void }
export default class Z extends K<number> { public d(): void {} }
const s = { a: 1 } satisfies Record<string, number>
export const used = [b, f, m, s, E.B]`,
    )
    expect(() => new Function("require", "exports", out.body)).not.toThrow()
    expect(out.body).not.toMatch(/interface|type Q|declare|implements|private|readonly|protected|abstract|satisfies/)
    // the names the file needs at run time, type-only ones aside
    expect(out.imports).toEqual([{ spec: "./b", names: ["b"] }])
  })

  it("compiles JSX against Solid's own runtime, and locates a syntax error", () => {
    const out = compile("A.tsx", `export default () => <button class="x" onClick={() => 1}>go</button>`)
    expect(out.body).toContain('require("solid-js/web")')
    expect(out.body).toContain("<button class=x>")
    try {
      compile("e.tsx", "const a = 1\nconst b = ;")
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(CompileError)
      expect((e as CompileError).problems[0]).toMatchObject({ file: "e.tsx", line: 2, column: 11 })
      expect((e as CompileError).problems[0].message).not.toMatch(/e\.tsx|\(2:10\)|\n/)
    }
  })

  it("links imports, re-exports and live exports", () => {
    const mod = run(
      `import def, { two as deux } from "a"
import * as ns from "b"
export * from "b"
export { three as trois } from "b"
export let count = 0
export function bump() { count++ }
export default def + deux + ns.three
export const mode = import.meta.env.MODE`,
      { a: { default: 1, two: 2 }, b: { three: 3, four: 4 } },
    )
    expect(mod.default).toBe(6)
    expect(mod.four).toBe(4)
    expect(mod.trois).toBe(3)
    ;(mod.bump as () => void)()
    expect(mod.count).toBe(1)
    expect(mod.mode).toBeUndefined()
    expect(() => run('import { nope } from "a"\nnope', { a: {} })).toThrow(/does not provide an export named "nope"/)
  })

  it("scopes a tokens stylesheet to one preview", () => {
    const css = scopeTokens(
      "/* light */\n:root {\n  --accent: red;\n}\n.dark {\n  --accent: blue;\n}\n@media (min-width: 1px) {\n  .x { color: var(--accent) }\n}",
      "[data-run-1]",
    )
    expect(css).toContain("[data-run-1] {\n  --accent: red;\n}")
    expect(css).toContain(".dark [data-run-1] {\n  --accent: blue;\n}")
    expect(css).toContain("@media (min-width: 1px) {")
    expect(css).toContain("[data-run-1] .x {")
  })

  it("renames a CSS Module's classes, and maps the names a file reads", () => {
    const out = cssModule(
      ".row {\n  color: red;\n}\n.row:hover, .a.b > .c {\n  top: .5em;\n}\n@media (min-width: 1px) {\n  .row { left: 0 }\n}",
      "q1",
    )
    expect(out.map).toEqual({ row: "row_q1", a: "a_q1", b: "b_q1", c: "c_q1" })
    expect(out.css).toContain(".row_q1 {\n  color: red;\n}")
    expect(out.css).toContain(".row_q1:hover, .a_q1.b_q1 > .c_q1 {")
    expect(out.css).toContain("top: .5em;")
    expect(out.css).toMatch(/@media \(min-width: 1px\) \{\s*\.row_q1 \{/)
  })

  it("compiles every file of the Solid kit, and links every name it imports from a package", () => {
    const failures: string[] = []
    const missing = new Set<string>()
    for (const f of SOLID.filter((x) => x.file.startsWith("solid/") && !x.file.endsWith(".css"))) {
      try {
        const out = compile(`/dither-kit/${f.file}`, readFileSync(f.path, "utf8"))
        new Function("require", "exports", "module", "__meta", out.body)
        for (const { spec, names } of out.imports)
          if (!spec.startsWith("."))
            for (const name of names) if (!(name in (PACKAGES[spec] ?? {}))) missing.add(`${spec}: ${name} (${f.file})`)
        // what the compiled template itself calls
        for (const m of out.body.matchAll(/require\("(solid-js(?:\/\w+)?)"\)\.(\w+)/g))
          if (!(m[2] in PACKAGES[m[1]])) missing.add(`${m[1]}: ${m[2]} (${f.file})`)
      } catch (e) {
        failures.push(`${f.file}: ${(e as Error).message.split("\n")[0]}`)
      }
    }
    expect(failures).toEqual([])
    expect([...missing]).toEqual([])
  }, 120000)

  it("compiles every docs snippet's Solid file, in every styling system", () => {
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n)
        return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(n) ? [p] : []
      })
    const docs = [join(process.cwd(), "src/pages/docs")]
    const names = new Set(SOLID_INDEX.keys())
    const failures: string[] = []
    let snippets = 0
    for (const file of docs.flatMap(files)) {
      for (const m of readFileSync(file, "utf8").matchAll(/`((?:[^`\\]|\\.)*)`/g)) {
        if (!/<[A-Za-z]/.test(m[1])) continue
        const code = m[1]
          .replace(/\$\{[^}]*\}/g, "x")
          .replace(/\\([\s\S])/g, (_, c: string) => (c === "n" ? "\n" : c))
          .replace(/…/g, "etc")
        const kind = snippetKind(code)
        const bare = code.replace(/<!--[\s\S]*?-->/g, "")
        if ((kind !== "sfc" && kind !== "fragment") || bare.indexOf(">", bare.lastIndexOf("<")) < 0) continue
        snippets++
        const tsx = toSolidCode(asSfc(code, names))
        for (const system of STYLINGS)
          try {
            compile("Example.tsx", restyleSolid(tsx, system).code)
          } catch (e) {
            failures.push(`${file.slice(process.cwd().length + 1)} (${system}): ${(e as Error).message}`)
          }
      }
    }
    expect(snippets).toBeGreaterThan(270)
    expect(failures).toEqual([])
  }, 120000)
})

describe("the reader's styling system", () => {
  afterEach(() => {
    setStyling("tailwind")
    localStorage.clear()
  })

  it("shows a snippet in Solid, whatever framework an earlier visit stored", () => {
    localStorage.setItem("dither-docs-framework", "svelte")
    expect(docsCode('<DitherSwitch v-model="on" />')).toBe(
      "<DitherSwitch modelValue={on()} onUpdateModelValue={setOn} />",
    )
    setStyling("modules")
    expect(docsCode('<div class="flex" />')).toContain("<div class={styles.row} />")
  })
})

describe("the source panel on a docs preview", () => {
  let w: ReturnType<typeof world>
  const kits = (url: string) => {
    const at = String(url).indexOf(KIT_SRC)
    const file = at < 0 ? undefined : String(url).slice(at + KIT_SRC.length)
    const text =
      file === "files.json"
        ? JSON.stringify(solidFiles)
        : file !== undefined && solidFiles.includes(file)
          ? read(SOLID, file)
          : undefined
    return { ok: text !== undefined, status: text !== undefined ? 200 : 404, text: async () => text ?? "" }
  }
  const settle = async () => {
    for (let i = 0; i < 12; i++) {
      await Promise.resolve()
      await new Promise((r) => setTimeout(r, 0))
    }
  }
  function open(children = () => <p>the docs demo</p>) {
    w = world()
    vi.stubGlobal("fetch", async (url: string) => kits(url))
    const section = document.createElement("section")
    section.id = "switch"
    section.innerHTML = "<h2>Switch</h2><p>A toggle whose track is a dithered canvas.</p><div></div>"
    document.body.append(section)
    const view = render(() => <DemoCard code={SWITCH}>{children()}</DemoCard>, {
      container: section.lastElementChild as HTMLElement,
    })
    const card = view.container
    const tabs = () => [...card.querySelectorAll<HTMLElement>('[role="tab"]')]
    const tab = (name: string) => tabs().find((t) => t.textContent!.trim().startsWith(name))!
    const chip = (name: string) =>
      [...card.querySelectorAll<HTMLElement>('[role="group"] button')].find((b) => b.textContent!.trim() === name)!
    const files = () =>
      [...card.querySelectorAll('[role="tablist"][aria-label="Source files"] [role="tab"]')].map((t) => t.textContent)
    const editor = () => card.querySelector("textarea")!
    const type = (text: string) => fireEvent.input(editor(), { target: { value: text } })
    const run = async () => {
      fireEvent.click(card.querySelector("button.src-run")!)
      for (let i = 0; i < 40 && card.querySelector("button.src-run")!.textContent!.includes("Running"); i++)
        await settle()
      await settle()
    }
    const problems = () => card.querySelector('ol[aria-label="Run problems"]')
    /** Open the Code tab, and wait for the panel (its chunk, the kit's listing) to show its files. */
    const code = async () => {
      w.show()
      fireEvent.click(tab("Code"))
      for (let i = 0; i < 200 && files().length < 4; i++) await settle()
    }
    return { card, section, tab, chip, files, editor, type, run, problems, code }
  }
  afterEach(() => {
    cleanup()
    document.querySelectorAll("section").forEach((s) => s.remove())
    setStyling("tailwind")
    localStorage.clear()
    w.restore()
    vi.unstubAllGlobals()
  })

  it("mounts the demo as the card nears the viewport, and keeps it", async () => {
    const { card } = open()
    expect(card.textContent).not.toContain("the docs demo")
    expect(card.textContent).toContain("preview")
    w.show()
    expect(card.textContent).toContain("the docs demo")
    expect(card.querySelector("[data-demo-card]")).not.toBeNull()
    // the source panel is not there until its tab is opened
    expect(card.querySelector("textarea")).toBeNull()
    expect(card.querySelector(".demo-well")!.className).toContain("p-4 sm:p-10")
    cleanup()
    const bled = render(() => (
      <DEMO_FIT.Provider value="bleed">
        <DemoCard code={SWITCH} />
        <DemoCard code={SWITCH} fit="inset" />
      </DEMO_FIT.Provider>
    ))
    const wells = bled.container.querySelectorAll(".demo-well")
    expect(wells[0].className).toContain("bleed pb-6")
    expect(wells[1].className).not.toContain("bleed")
  })

  it("shows the files, runs an edit in the preview and restores the demo", async () => {
    const { card, tab, files, editor, type, run, problems, code } = open()
    await code()
    expect(files()).toEqual(["SwitchExample.tsx", "DitherSwitch.tsx", "theme.css", "prompt.md"])
    expect(editor().value).toBe(SWITCH_TSX)
    expect(editor().getAttribute("aria-label")).toBe("SwitchExample.tsx source")
    // the chips: the four styling systems, and no framework to pick
    const chips = (label: string) =>
      [...card.querySelectorAll(`[role="group"][aria-label="${label}"] button`)].map(
        (b) => `${b.textContent!.trim()}${b.getAttribute("aria-pressed") === "true" ? "*" : ""}`,
      )
    expect(chips("Framework")).toEqual([])
    expect(chips("Styling")).toEqual(["Tailwind*", "CSS", "Modules", "StyleX"])

    type(SWITCH_TSX.replace(">Bloom on hover</span>", ">Edited in the page</span>"))
    expect(files()[0]).toBe("SwitchExample.tsx, edited")
    await run()
    expect(problems()).toBeNull()
    expect(card.textContent).toContain("Running your files")
    expect(card.textContent).toContain("Edited in the page")
    expect(card.textContent).not.toContain("the docs demo")
    // the run is the page's own kit, on the page's own Solid: it answers a press
    const toggle = card.querySelector<HTMLElement>('.demo-well [role="switch"]')!
    expect(toggle.getAttribute("aria-checked")).toBe("true")
    fireEvent.click(toggle)
    expect(toggle.getAttribute("aria-checked")).toBe("false")

    // An edited kit file: the example links to a kit evaluated from source,
    // the edit included.
    fireEvent.click(tab("DitherSwitch.tsx"))
    await settle()
    type(editor().value.replace('role="switch"', 'role="switch" data-edited="yes"'))
    await run()
    expect(problems()).toBeNull()
    expect(card.querySelector('[data-edited="yes"]')).not.toBeNull()
    expect(card.textContent).toContain("Edited in the page")

    // The prompt names the section and its files.
    fireEvent.click(tab("prompt.md"))
    const prompt = editor().value
    expect(prompt).toMatch(/^# Switch\n\nA toggle whose track is a dithered canvas\./)
    expect(prompt).toContain("- `dither-kit/solid/DitherSwitch.tsx` — a kit file the example imports")
    expect(prompt).toContain("/src/dither-kit/solid")

    // A broken example reports where, and the last good run stays up.
    fireEvent.click(tab("SwitchExample"))
    type(SWITCH_TSX.replace("createSignal(true)", "createSignal(true"))
    await run()
    expect(problems()!.textContent).toMatch(/^SwitchExample\.tsx 7:\d+ /)
    expect(card.textContent).toContain("Edited in the page")
    // a click on the problem opens its file at the place
    fireEvent.click(problems()!.querySelector("button")!)
    await w.frame(0)
    expect(editor().value.slice(0, editor().selectionStart).split("\n")).toHaveLength(7)

    // What a run throws while it renders shows in the preview.
    type(SWITCH_TSX.replace("return (", 'throw new Error("no luck")\n  return ('))
    await run()
    expect(card.querySelector('.demo-well [role="alert"]')!.textContent).toBe("The run stopped. Error: no luck")

    fireEvent.click([...card.querySelectorAll("button")].find((b) => b.textContent!.trim() === "Restore the demo")!)
    expect(card.textContent).not.toContain("Running your files")
    expect(card.textContent).toContain("the docs demo")
  }, 120000)

  it("runs the example written as plain CSS, CSS Modules and StyleX", async () => {
    const { card, tab, chip, files, editor, run, problems, code } = open()
    await code()
    const sheets = () => [...document.head.querySelectorAll("style[data-run]")].map((s) => s.textContent).join("")

    // plain CSS: the stylesheet is a file beside the example, and styles this preview only
    fireEvent.click(chip("CSS"))
    await settle()
    expect(files()).toEqual(["SwitchExample.tsx", "SwitchExample.css", "DitherSwitch.tsx", "theme.css", "prompt.md"])
    expect(editor().value).toContain('import "./SwitchExample.css"')
    expect(editor().value).toContain('<label class="label">')
    await run()
    expect(problems()).toBeNull()
    const well = card.querySelector(".demo-well")!
    const scope = [...well.attributes].find((a) => a.name.startsWith("data-run-"))!.name
    expect(sheets()).toContain(`[${scope}] .label {`)
    expect(well.querySelector("label")!.className).toBe("label")

    // CSS Modules: the class names the file reads are the sheet's, renamed for the run
    fireEvent.click(chip("Modules"))
    await settle()
    expect(files()[1]).toBe("SwitchExample.module.css")
    expect(editor().value).toContain('import styles from "./SwitchExample.module.css"')
    await run()
    expect(problems()).toBeNull()
    const named = card.querySelector(".demo-well label")!.className
    expect(named).toMatch(/^label_\w+$/)
    expect(sheets()).toContain(`.${named} {`)
    // an edit to the stylesheet runs too
    fireEvent.click(tab("SwitchExample.module.css"))
    fireEvent.input(editor(), { target: { value: editor().value.replace("display: flex", "display: grid") } })
    await run()
    expect(sheets()).toContain("display: grid")

    // an edited theme.css restyles this preview only
    fireEvent.click(tab("theme.css"))
    await settle()
    fireEvent.input(editor(), {
      target: { value: ":root {\n  --accent: #ff00aa;\n}\n.dark {\n  --accent: #00ffaa;\n}" },
    })
    await run()
    expect(problems()).toBeNull()
    expect(sheets()).toContain(`[${scope}] {\n  --accent: #ff00aa;\n}`)
    expect(sheets()).toContain(`.dark [${scope}] {\n  --accent: #00ffaa;\n}`)
    fireEvent.click(card.querySelector('button[aria-label="Revert theme.css"]')!)
    fireEvent.click(tab("SwitchExample.tsx"))

    // StyleX: the runtime's atomic classes on the example's own elements
    fireEvent.click(chip("StyleX"))
    await settle()
    expect(files()).toEqual(["SwitchExample.tsx", "DitherSwitch.tsx", "theme.css", "prompt.md"])
    expect(editor().value).toContain("const styles = stylex.create({")
    expect(editor().value).toContain("<label {...stylex.props(styles.label)}>")
    await run()
    expect(problems()).toBeNull()
    const label = card.querySelector(".demo-well label")!
    const classes = label.className.split(" ")
    expect(classes.every((c) => /^x\w+$/.test(c))).toBe(true)
    const css = [...document.head.querySelectorAll("style[data-run-stylex]")].map((s) => s.textContent).join("")
    for (const c of classes) expect(css).toContain(`.${c}{`)
    expect(css).toContain("display:flex")
    // the kit's switch keeps its own classes: the Solid kit has one layer
    expect(card.querySelector('.demo-well [role="switch"]')!.className).not.toBe("")
  }, 120000)

  it("shows a reader who once stored Svelte the Solid files, and runs them", async () => {
    localStorage.setItem("dither-docs-framework", "svelte")
    const { card, files, editor, run, problems, code } = open()
    await code()
    expect(files()).toEqual(["SwitchExample.tsx", "DitherSwitch.tsx", "theme.css", "prompt.md"])
    expect(editor().value).toBe(SWITCH_TSX)
    expect(card.querySelector("button.src-run")!.getAttribute("aria-disabled")).not.toBe("true")
    await run()
    expect(problems()).toBeNull()
    expect(card.textContent).toContain("Running your files")
    expect(card.textContent).not.toMatch(/svelte/i)
  }, 120000)

  it("moves through the file tabs by keyboard, and reverts an edit", async () => {
    const { card, files, editor, type, code } = open()
    await code()
    const strip = card.querySelector('[role="tablist"][aria-label="Source files"]')!
    const selected = () => strip.querySelector('[aria-selected="true"]')!.textContent
    fireEvent.keyDown(strip, { key: "ArrowRight" })
    expect(selected()).toBe("DitherSwitch.tsx")
    expect(document.activeElement!.textContent).toBe("DitherSwitch.tsx")
    fireEvent.keyDown(strip, { key: "End" })
    expect(selected()).toBe("prompt.md")
    fireEvent.keyDown(strip, { key: "ArrowRight" })
    expect(selected()).toBe("SwitchExample.tsx")
    expect(strip.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
    type("edited")
    expect(files()[0]).toBe("SwitchExample.tsx, edited")
    fireEvent.click(card.querySelector('button[aria-label="Revert SwitchExample.tsx"]')!)
    expect(editor().value).toBe(SWITCH_TSX)
    expect(files()[0]).toBe("SwitchExample.tsx")
    // the editor: Tab indents, Escape hands the next Tab back to the page
    editor().setSelectionRange(0, 0)
    expect(fireEvent.keyDown(editor(), { key: "Tab" })).toBe(false)
    fireEvent.keyDown(editor(), { key: "Escape" })
    expect(fireEvent.keyDown(editor(), { key: "Tab" })).toBe(true)
  })
})
