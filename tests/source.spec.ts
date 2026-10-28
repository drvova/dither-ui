// @rstest-environment jsdom
import { describe, expect, it, rs } from "rstack/test"
import { flushPromises, mount } from "@vue/test-utils"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { h, nextTick } from "vue"
import { babelParse } from "vue/compiler-sfc"
import DemoCard from "@/pages/docs/DemoCard.vue"
import { crc32, zip } from "@/shared/lib/files"
import { setStyling } from "@/shared/lib/restyle"
import { CUES, play, schedule, sounds } from "@/shared/lib/sound"
import {
  CompileError,
  compileModule,
  compileVue,
  evaluate,
  hashId,
  link,
  scopeTokens,
} from "@/widgets/source/model/compile"
import {
  asSfc,
  exampleName,
  kitFilesOf,
  kitIndex,
  promptFor,
  resolveKitFile,
  snippetKind,
  type SourceFile,
} from "@/widgets/source/model/files"
import * as stylex from "@/widgets/source/model/stylex"

const ROOT = process.cwd()
const KIT = join(ROOT, "dither-kit")
const kitFiles = (readdirSync(KIT, { recursive: true }) as string[])
  .map((f) => f.split("\\").join("/"))
  .filter((f) => /\.(vue|ts|css)$/.test(f))
const svelteFiles = (readdirSync(join(ROOT, "dither-kit-svelte"), { recursive: true }) as string[])
  .filter((f) => /\.(svelte|ts|css)$/.test(f) && !f.startsWith("node_modules"))
  .map((f) => f.split("\\").join("/"))
const read = (dir: string, f: string) => readFileSync(join(ROOT, dir, f), "utf8")
const VUE_INDEX = kitIndex(read("dither-kit", "tailwind/index.ts"), kitFiles, "tailwind/index.ts")
const SVELTE_INDEX = kitIndex(read("dither-kit-svelte", "index.ts"), svelteFiles)

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

describe("source files", () => {
  it("reads a kit index as export name → the file that defines it", () => {
    expect(VUE_INDEX.get("DitherSwitch")).toEqual({ file: "tailwind/DitherSwitch.vue", name: "default" })
    expect(VUE_INDEX.get("DitherAurora")).toEqual({ file: "tailwind/Aurora.vue", name: "default" })
    expect(VUE_INDEX.get("AreaChart")).toEqual({ file: "tailwind/area-chart.ts", name: "AreaChart" })
    expect(VUE_INDEX.get("copyText")).toEqual({ file: "engine/copy-text.ts", name: "copyText" })
    expect(VUE_INDEX.has("TooltipVariant")).toBe(false)
    expect(SVELTE_INDEX.get("Aurora")?.file).toBe("backgrounds/Aurora.svelte")
    expect(resolveKitFile("../engine/pixel", kitFiles, "tailwind/DitherButton.vue")).toBe("engine/pixel.ts")
    expect(resolveKitFile("./lib", kitFiles, "tailwind/DitherButton.vue")).toBe("tailwind/lib.ts")
    expect(resolveKitFile("./engine/pixel", kitFiles)).toBe("engine/pixel.ts")
    expect(resolveKitFile("./nope", kitFiles, "tailwind/x.vue")).toBeUndefined()
  })

  it("tells a snippet's kind", () => {
    expect(snippetKind(SWITCH)).toBe("sfc")
    expect(snippetKind('<DitherButton color="blue">Deploy</DitherButton>')).toBe("fragment")
    expect(snippetKind('const level = ref(40)\n\n<DitherSlider v-model="level" />')).toBe("fragment")
    expect(snippetKind("# 1 — copy the kit\nnpx degit drvova/dither-ui/dither-kit src/dither-kit")).toBe("sh")
    expect(snippetKind(":root {\n  --accent: #3f8ff3;\n}")).toBe("css")
    expect(snippetKind('toast("Saved", { tone: "green" })')).toBe("ts")
  })

  it("completes a fragment into an SFC with what it uses imported", () => {
    const names = new Set(VUE_INDEX.keys())
    expect(asSfc(SWITCH, names)).toBe(SWITCH)
    expect(asSfc('<DitherButton :matrix="bayerMatrix(4)">Go</DitherButton>\n<Transition />', names)).toBe(
      `<script setup lang="ts">
import { DitherButton, bayerMatrix } from "@dither-kit"
</script>

<template>
  <DitherButton :matrix="bayerMatrix(4)">Go</DitherButton>
  <Transition />
</template>`,
    )
    expect(asSfc('const level = ref(40)\n\n<!-- one -->\n<DitherSlider v-model="level" />', names)).toBe(
      `<script setup lang="ts">
import { ref } from "vue"
import { DitherSlider } from "@dither-kit"

const level = ref(40)
</script>

<template>
  <!-- one -->
  <DitherSlider v-model="level" />
</template>`,
    )
  })

  it("lists the kit files an example imports, per framework", () => {
    const vue = 'import { DitherSwitch, DitherButton, type DitherColor } from "@dither-kit"\nimport { ref } from "vue"'
    expect(kitFilesOf(vue, "vue", VUE_INDEX, kitFiles)).toEqual([
      "tailwind/DitherSwitch.vue",
      "tailwind/DitherButton.vue",
    ])
    const svelte =
      'import { Aurora } from "@dither-kit-svelte"\nimport { toast } from "@dither-kit-svelte/runtime/toast.svelte"'
    expect(kitFilesOf(svelte, "svelte", SVELTE_INDEX, svelteFiles)).toEqual([
      "backgrounds/Aurora.svelte",
      "runtime/toast.svelte.ts",
    ])
  })

  it("names the example and writes the brief from the files", () => {
    expect(exampleName("area-chart", 1, "sfc", "vue")).toBe("AreaChartExample.vue")
    expect(exampleName("switch", 2, "fragment", "svelte")).toBe("SwitchExample2.svelte")
    expect(exampleName("install", 1, "sh", "vue")).toBe("install.sh")
    const files: SourceFile[] = [
      { path: "SwitchExample.vue", name: "SwitchExample.vue", lang: "vue", role: "example" },
      { path: "dither-kit/tailwind/DitherSwitch.vue", name: "DitherSwitch.vue", lang: "vue", role: "kit" },
      { path: "dither-kit/engine/theme.css", name: "theme.css", lang: "css", role: "tokens" },
      { path: "prompt.md", name: "prompt.md", lang: "md", role: "prompt" },
    ]
    const md = promptFor(
      {
        title: "Switch",
        description: "A dithered toggle.",
        url: "https://dither-ui.com/docs/switch",
        install: "npx degit drvova/dither-ui/dither-kit src/dither-kit",
        flavor: "vue",
        styling: "css",
      },
      files,
    )
    expect(md).toMatch(/^# Switch\n\nA dithered toggle\.\n\nLive preview: https:\/\/dither-ui\.com\/docs\/switch/)
    expect(md).toContain("```sh\nnpx degit drvova/dither-ui/dither-kit src/dither-kit\n```")
    expect(md).toContain("- `dither-kit/tailwind/DitherSwitch.vue` — a kit file the example imports")
    expect(md).toContain("plain CSS — the example's own `<style>` block")
    expect(md).toContain("Render `SwitchExample.vue`")
    expect(md).not.toMatch(/\n\n\n/)
  })
})

describe("compile: TypeScript out, imports linked", () => {
  const run = (code: string, mods: Record<string, Record<string, unknown>> = {}) =>
    evaluate({ file: "t.ts", body: link(code, "t.ts"), css: [] }, (s) => mods[s])

  it("cuts type syntax and keeps the file's JavaScript", () => {
    const out = link(
      `import type { A } from "./a"
import { b, type C } from "./b"
export interface P { x?: number }
export type Q = P | null
declare const g: number
function f<T extends object>(this: void, x?: number, y: T = {} as T): x is number { return x! > (y as any) }
const n = <string>("s")
const m = new Map<string, number>()
let z!: number
abstract class K<T> implements P { private readonly a: number = 1; protected b?: string; declare c: number; abstract d(): void }
export default class Z extends K<number> { public d(): void {} }
const s = { a: 1 } satisfies Record<string, number>`,
      "t.ts",
    )
    expect(() => babelParse(`function w(){${out}}`)).not.toThrow()
    expect(out).not.toMatch(
      /interface|type Q|declare|implements|private|readonly|protected|abstract|satisfies|<string>|: number/,
    )
    expect(out).toContain('const b = __pick(__i0, "b", "./b")')
  })

  it("refuses TypeScript that would need a transpiler, with its place", () => {
    try {
      link("const a = 1\nenum E { A }", "e.ts")
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(CompileError)
      expect((e as CompileError).problems[0]).toMatchObject({ file: "e.ts", line: 2, column: 1 })
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
export default def + deux + ns.three`,
      { a: { default: 1, two: 2 }, b: { three: 3, four: 4 } },
    )
    expect(mod.default).toBe(6)
    expect(mod.four).toBe(4)
    expect(mod.trois).toBe(3)
    ;(mod.bump as () => void)()
    expect(mod.count).toBe(1)
    expect(() => run('import { nope } from "a"', { a: {} })).toThrow(/does not provide an export named "nope"/)
  })

  it("compiles an SFC with scoped and module styles, and locates its errors", () => {
    const scoped = compileVue(
      "/X.vue",
      '<template><p class="a">x</p></template>\n<style scoped>.a { color: red }</style>',
      {
        id: "abc",
      },
    )
    expect(scoped.css[0]).toContain(".a[data-v-abc]")
    expect(scoped.body).toContain('__sfc__.__scopeId = "data-v-abc"')
    const modules = compileVue(
      "/Y.vue",
      '<template><p :class="$style.box">y</p></template>\n<style module>.box { color: red } .unused { color: blue }</style>',
      { id: "q1" },
    )
    expect(modules.css[0]).toContain(".box_q1 {")
    expect(modules.css[0]).toContain(".unused {")
    expect(modules.body).toContain('"$style": {"box":"box_q1"}')
    const broken = () =>
      compileVue("/Z.vue", '<script setup lang="ts">\nconst a = ;\n</script>\n<template><i /></template>', { id: "z" })
    expect(broken).toThrow(CompileError)
    try {
      broken()
    } catch (e) {
      expect((e as CompileError).problems[0]).toMatchObject({ file: "/Z.vue", line: 2 })
    }
    expect(() => compileVue("/S.vue", '<template><i /></template><style lang="scss">a{}</style>', { id: "s" })).toThrow(
      /needs its preprocessor/,
    )
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

  it("links every name the kit and its compiled templates import from vue and packages", async () => {
    const { PACKAGES, VUE_NAMES } = await import("@/widgets/source/model/run")
    const vue = new Set(VUE_NAMES())
    const fs = {
      fileExists: (f: string) => kitFiles.includes(f.replace("/dither-kit/", "")),
      readFile: (f: string) => read("dither-kit", f.replace("/dither-kit/", "")),
    }
    const missing = new Set<string>()
    for (const f of kitFiles.filter((x) => !x.endsWith(".css"))) {
      const out = f.endsWith(".vue")
        ? compileVue(`/dither-kit/${f}`, read("dither-kit", f), { id: "x", fs })
        : compileModule(`/dither-kit/${f}`, read("dither-kit", f))
      for (const m of out.body.matchAll(/__pick\(__i\d+, "([^"]+)", "([^".][^"]*)"\)/g)) {
        const ok = m[2] === "vue" ? vue.has(m[1]) : m[1] in (PACKAGES[m[2]] ?? {})
        if (!ok) missing.add(`${m[2]}: ${m[1]} (${f})`)
      }
    }
    expect([...missing]).toEqual([])
  })

  it("compiles and links every file of the kit", () => {
    const fs = {
      fileExists: (f: string) => kitFiles.includes(f.replace("/dither-kit/", "")),
      readFile: (f: string) => read("dither-kit", f.replace("/dither-kit/", "")),
    }
    const failures: string[] = []
    for (const f of kitFiles.filter((x) => !x.endsWith(".css"))) {
      try {
        const out = f.endsWith(".vue")
          ? compileVue(`/dither-kit/${f}`, read("dither-kit", f), { id: hashId(f), fs })
          : compileModule(`/dither-kit/${f}`, read("dither-kit", f))
        babelParse(`async function f(){${out.body}}`)
      } catch (e) {
        failures.push(`${f}: ${(e as Error).message.split("\n")[0]}`)
      }
    }
    expect(failures).toEqual([])
  })
})

describe("files out", () => {
  it("checksums with CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926)
  })

  it("writes a zip every unzip reads", () => {
    const files = [
      { path: "SwitchExample.vue", text: SWITCH },
      { path: "dither-kit/théme.css", text: ":root { --a: 1 }" },
    ]
    const bytes = zip(files, new Date(2026, 9, 23, 12, 30, 10))
    const view = new DataView(bytes.buffer)
    const end = bytes.length - 22
    expect(view.getUint32(end, true)).toBe(0x06054b50)
    expect(view.getUint16(end + 10, true)).toBe(2)
    let at = view.getUint32(end + 16, true)
    const dec = new TextDecoder()
    for (const f of files) {
      expect(view.getUint32(at, true)).toBe(0x02014b50)
      const size = view.getUint32(at + 24, true)
      const nameLength = view.getUint16(at + 28, true)
      const local = view.getUint32(at + 42, true)
      expect(dec.decode(bytes.subarray(at + 46, at + 46 + nameLength))).toBe(f.path)
      expect(view.getUint32(local, true)).toBe(0x04034b50)
      const data = bytes.subarray(local + 30 + nameLength, local + 30 + nameLength + size)
      expect(dec.decode(data)).toBe(f.text)
      expect(view.getUint32(at + 16, true)).toBe(crc32(data))
      at += 46 + nameLength
    }
  })
})

describe("interface sounds", () => {
  function fakeAudio() {
    const events: { what: string; v: number; t: number; node: string }[] = []
    const param = (node: string) => ({
      setValueAtTime: (v: number, t: number) => events.push({ what: "set", v, t, node }),
      linearRampToValueAtTime: (v: number, t: number) => events.push({ what: "linear", v, t, node }),
      exponentialRampToValueAtTime: (v: number, t: number) => events.push({ what: "exp", v, t, node }),
      setTargetAtTime: (v: number, t: number) => events.push({ what: "target", v, t, node }),
    })
    const node = () => ({ connect() {}, disconnect() {} })
    const audio = {
      currentTime: 2,
      destination: {},
      createOscillator: () => ({
        ...node(),
        type: "",
        frequency: param("freq"),
        start: (t: number) => events.push({ what: "start", v: 0, t, node: "osc" }),
        stop: (t: number) => events.push({ what: "stop", v: 0, t, node: "osc" }),
      }),
      createGain: () => ({ ...node(), gain: param("gain") }),
      createBiquadFilter: () => ({ ...node(), type: "", frequency: param("lowpass") }),
    }
    return { audio: audio as unknown as BaseAudioContext, events }
  }

  it("schedules each cue's voices as measured", () => {
    const { audio, events } = fakeAudio()
    schedule(audio, "on", () => 0.5)
    const glide = events.find((e) => e.what === "exp")!
    expect(events[0]).toMatchObject({ what: "set", v: 520, t: 2 })
    expect(glide.v).toBe(880)
    expect(glide.t).toBeCloseTo(2.087, 6)
    expect(events.find((e) => e.what === "linear")!.v).toBeCloseTo(0.147, 6)
    expect(events.find((e) => e.what === "stop")!.t).toBeCloseTo(2.167, 6)

    const copy = fakeAudio()
    schedule(copy.audio, "copy", () => 0)
    const starts = copy.events.filter((e) => e.what === "start").map((e) => e.t)
    expect(starts[0]).toBeCloseTo(2, 6)
    expect(starts[1]).toBeCloseTo(2.04, 6)
    expect(copy.events.filter((e) => e.node === "freq").map((e) => e.v)).toEqual([1200, 1400])

    const fold = fakeAudio()
    schedule(fold.audio, "fold", () => 1)
    expect(fold.events.find((e) => e.node === "lowpass")!.v).toBe(2200)
    expect(Object.keys(CUES)).toEqual(["on", "off", "tap", "copy", "theme", "fold", "unfold"])
  })

  it("stays silent while switched off, and remembers the switch", async () => {
    const made = rs.fn()
    rs.stubGlobal(
      "AudioContext",
      class {
        constructor() {
          made()
        }
      },
    )
    sounds.value = false
    await nextTick()
    play("tap")
    expect(made).not.toHaveBeenCalled()
    expect(localStorage.getItem("dither-sounds")).toBe("off")
    sounds.value = true
    await nextTick()
    expect(localStorage.getItem("dither-sounds")).toBe("on")
    rs.unstubAllGlobals()
  })
})

describe("StyleX at run time", () => {
  const sheet = (kind: string) => document.head.querySelector(`style[data-run-stylex="${kind}"]`)?.textContent ?? ""

  it("applies styles as atomic classes, the last style to set a property winning", () => {
    const styles = stylex.create({
      a: { display: "flex", color: "red" },
      b: { color: "blue", padding: 8, opacity: 0.5 },
    })
    const names = stylex.attrs(styles.a, false, [null, styles.b]).class!.split(" ")
    expect(names).toHaveLength(4)
    expect(sheet("plain")).toContain(`.${names[0]}{display:flex}`)
    expect(sheet("plain")).toContain("color:blue")
    expect(sheet("plain")).not.toContain("color:red")
    expect(sheet("plain")).toContain("padding:8px")
    expect(sheet("plain")).toContain("opacity:0.5")
    // The same styles are the same classes, written once; React's spelling agrees.
    expect(stylex.attrs(styles.a, styles.b).class).toBe(names.join(" "))
    expect(stylex.props(styles.a, styles.b).className).toBe(names.join(" "))
    expect(sheet("plain").split(`.${names[0]}{`)).toHaveLength(2)
    expect(stylex.attrs(null, false)).toEqual({})
    expect(stylex.cssName("WebkitLineClamp")).toBe("-webkit-line-clamp")
  })

  it("writes conditions after plain rules: pseudo-classes in the selector, at-rules around it", () => {
    const styles = stylex.create({
      link: { color: { default: "gray", ":hover": { default: null, "@media (hover: hover)": "white" } } },
      mark: { "::before": { content: "'>'", color: { default: "gray", ":hover": "red" } } },
    })
    stylex.attrs(styles.link, styles.mark)
    expect(sheet("plain")).toContain("color:gray")
    expect(sheet("conditional")).toMatch(/@media \(hover: hover\)\{\.x\w+:hover\{color:white\}\}/)
    expect(sheet("conditional")).toMatch(/\.x\w+::before\{content:'>'\}/)
    // The pseudo-element is last in the selector, after the pseudo-class.
    expect(sheet("conditional")).toMatch(/\.x\w+:hover::before\{color:red\}/)
  })

  it("defines variables and keyframes, and keeps fallbacks in order", () => {
    const vars = stylex.defineVars({ accent: { default: "blue", "@media (prefers-color-scheme: light)": "navy" } })
    expect(vars.accent).toMatch(/^var\(--x\w+-accent\)$/)
    expect(sheet("plain")).toMatch(/:root\{--x\w+-accent:blue\}/)
    expect(sheet("conditional")).toMatch(/@media \(prefers-color-scheme: light\)\{:root\{--x\w+-accent:navy\}\}/)
    const spin = stylex.keyframes({ from: { rotate: "0deg" }, to: { rotate: "360deg" } })
    expect(sheet("plain")).toContain(`@keyframes ${spin}{from{rotate:0deg}to{rotate:360deg}}`)
    const styles = stylex.create({ box: { position: stylex.firstThatWorks("sticky", "fixed") } })
    const [name] = stylex.attrs(styles.box).class!.split(" ")
    expect(sheet("plain")).toContain(`.${name}{position:fixed;position:sticky}`)
  })
})

describe("the source panel on a docs preview", () => {
  it("shows the files, runs an edit in the preview and restores the demo", async () => {
    rs.stubGlobal("IntersectionObserver", undefined)
    rs.stubGlobal("fetch", async (url: string) => {
      const m = /kit\/src\/(vue|svelte)\/(.+)$/.exec(String(url))
      const dir = m?.[1] === "svelte" ? "dither-kit-svelte" : "dither-kit"
      const text = !m
        ? undefined
        : m[2] === "files.json"
          ? JSON.stringify(m[1] === "svelte" ? svelteFiles : kitFiles)
          : read(dir, m[2])
      return { ok: !!text, status: text ? 200 : 404, text: async () => text ?? "" }
    })
    const section = document.createElement("section")
    section.id = "switch"
    section.innerHTML = "<h2>Switch</h2><p>A toggle whose track is a dithered canvas.</p><div></div>"
    document.body.append(section)
    const card = mount(DemoCard, {
      props: { code: SWITCH },
      slots: { default: () => h("p", "the docs demo") },
      attachTo: section.lastElementChild as HTMLElement,
    })
    const settle = async () => {
      for (let i = 0; i < 12; i++) {
        await flushPromises()
        await new Promise((r) => setTimeout(r, 0))
      }
    }
    await card
      .findAll('[role="tab"]')
      .find((t) => t.text() === "Code")!
      .trigger("click")
    await settle()
    const files = () => card.findAll('[role="tablist"][aria-label="Source files"] [role="tab"]').map((t) => t.text())
    expect(files()).toEqual(["SwitchExample.vue", "DitherSwitch.vue", "theme.css", "prompt.md"])
    const editor = card.get("textarea")
    expect((editor.element as HTMLTextAreaElement).value).toBe(SWITCH)
    expect(editor.attributes("aria-label")).toBe("SwitchExample.vue source")

    await editor.setValue(SWITCH.replace(">Bloom on hover</span>", ">Edited in the page</span>"))
    expect(files()[0]).toBe("SwitchExample.vue, edited")
    await card.get("button.src-run").trigger("click")
    await settle()
    expect(card.find('ol[aria-label="Run problems"]').exists()).toBe(false)
    expect(card.text()).toContain("Running your files")
    expect(card.text()).toContain("Edited in the page")
    expect(card.text()).not.toContain("the docs demo")

    // An edited kit file: the example links to a kit evaluated from source,
    // the edit included.
    await card
      .findAll('[role="tab"]')
      .find((t) => t.text() === "DitherSwitch.vue")!
      .trigger("click")
    const kit = card.get("textarea")
    await kit.setValue((kit.element as HTMLTextAreaElement).value.replace("<button", '<button data-edited="yes"'))
    await card.get("button.src-run").trigger("click")
    await settle()
    expect(card.find('ol[aria-label="Run problems"]').exists()).toBe(false)
    expect(card.find('[data-edited="yes"]').exists()).toBe(true)
    expect(card.text()).toContain("Edited in the page")

    // The prompt names the section and its files.
    await card
      .findAll('[role="tab"]')
      .find((t) => t.text() === "prompt.md")!
      .trigger("click")
    const prompt = (card.get("textarea").element as HTMLTextAreaElement).value
    expect(prompt).toMatch(/^# Switch\n\nA toggle whose track is a dithered canvas\./)
    expect(prompt).toContain("- `dither-kit/tailwind/DitherSwitch.vue` — a kit file the example imports")

    // A broken example reports where, and the last good run stays up.
    await card
      .findAll('[role="tab"]')
      .find((t) => t.text().startsWith("SwitchExample"))!
      .trigger("click")
    await card.get("textarea").setValue(SWITCH.replace("ref(true)", "ref(true"))
    await card.get("button.src-run").trigger("click")
    await settle()
    expect(card.get('ol[aria-label="Run problems"]').text()).toMatch(/^SwitchExample\.vue 6:1/)
    expect(card.text()).toContain("Edited in the page")

    await card
      .findAll("button")
      .find((b) => b.text() === "Restore the demo")!
      .trigger("click")
    await nextTick()
    expect(card.text()).not.toContain("Running your files")
    expect(card.html()).toContain("the docs demo")
    card.unmount()
    section.remove()
    rs.unstubAllGlobals()
  })

  it("runs the example written as StyleX", async () => {
    rs.stubGlobal("IntersectionObserver", undefined)
    rs.stubGlobal("fetch", async (url: string) => {
      const m = /kit\/src\/vue\/(.+)$/.exec(String(url))
      const text = !m ? undefined : m[1] === "files.json" ? JSON.stringify(kitFiles) : read("dither-kit", m[1])
      return { ok: !!text, status: text ? 200 : 404, text: async () => text ?? "" }
    })
    setStyling("stylex")
    const section = document.createElement("section")
    section.id = "switch"
    section.innerHTML = "<h2>Switch</h2><p>A toggle.</p><div></div>"
    document.body.append(section)
    const card = mount(DemoCard, {
      props: { code: SWITCH },
      slots: { default: () => h("p", "the docs demo") },
      attachTo: section.lastElementChild as HTMLElement,
    })
    const settle = async () => {
      for (let i = 0; i < 12; i++) {
        await flushPromises()
        await new Promise((r) => setTimeout(r, 0))
      }
    }
    await card
      .findAll('[role="tab"]')
      .find((t) => t.text() === "Code")!
      .trigger("click")
    await settle()
    expect((card.get("textarea").element as HTMLTextAreaElement).value).toContain("const styles = stylex.create({")
    // The kit's own files are its StyleX layer, and the prompt installs that.
    const tab = (name: string) => card.findAll('[role="tab"]').find((t) => t.text().startsWith(name))!
    await tab("DitherSwitch.vue").trigger("click")
    await settle()
    const kitText = (card.get("textarea").element as HTMLTextAreaElement).value
    expect(kitText).toContain('import * as stylex from "@stylexjs/stylex"')
    expect(kitText).toContain("xstyle?: StyleProp")
    await tab("prompt.md").trigger("click")
    await settle()
    const prompt = (card.get("textarea").element as HTMLTextAreaElement).value
    expect(prompt).toContain("`dither-kit/stylex/DitherSwitch.vue`")
    expect(prompt).toContain("npm i d3-scale d3-shape @stylexjs/stylex")
    await card.get("button.src-run").trigger("click")
    await settle()
    expect(card.find('ol[aria-label="Run problems"]').exists()).toBe(false)
    expect(card.text()).toContain("Running your files")
    const label = card.get("label")
    expect(label.classes().every((c) => /^x\w+$/.test(c))).toBe(true)
    const css = [...document.head.querySelectorAll("style[data-run-stylex]")].map((s) => s.textContent).join("")
    for (const c of label.classes()) expect(css).toContain(`.${c}{`)
    expect(css).toContain("display:flex")
    // The switch itself is the StyleX layer's, styled by the same runtime.
    const toggle = card.get('[role="switch"]')
    expect(toggle.classes().length).toBeGreaterThan(0)
    for (const c of toggle.classes()) expect(css).toContain(`.${c}`)
    card.unmount()
    section.remove()
    setStyling("tailwind")
    rs.unstubAllGlobals()
  })
})
