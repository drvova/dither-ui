// The docs' examples as one catalogue (`build/catalog.ts`): each example's
// `meta` is held to its component's props by the type checker (a setting
// the component lacks, or a value its prop does not take, fails), every
// setting the build resolves is a prop the kit declares, and the text a
// reader copies is the example with nothing of its meta left in it.
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import ts from "typescript"
import { readCatalog, stripMeta } from "../build/catalog.ts"
import { eachKitProp } from "../build/props.ts"

const ROOT = join(import.meta.dirname, "../../..")
const DOCS = join(import.meta.dirname, "../src/pages/docs")
const EXAMPLES = readdirSync(DOCS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => {
    try {
      return readdirSync(join(DOCS, d.name, "examples"))
        .filter((f) => /^[a-z][\w-]*\.tsx$/.test(f))
        .map((f) => join(DOCS, d.name, "examples", f))
    } catch {
      return []
    }
  })
const { entries, sources } = readCatalog()

/** Each file's errors under the repository's own compiler options. */
function typeErrors(files: ReadonlyMap<string, string>): Map<string, string[]> {
  const config = ts.getParsedCommandLineOfConfigFile(
    join(ROOT, "tsconfig.json"),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (d) => {
        throw new Error(ts.flattenDiagnosticMessageText(d.messageText, "\n"))
      },
    },
  )!
  const options = { ...config.options, noEmit: true }
  const host = ts.createCompilerHost(options)
  const getSourceFile = host.getSourceFile
  host.getSourceFile = (name, lang, ...rest) =>
    files.has(name) ? ts.createSourceFile(name, files.get(name)!, lang, true) : getSourceFile(name, lang, ...rest)
  const fileExists = host.fileExists
  host.fileExists = (name) => files.has(name) || fileExists(name)
  const program = ts.createProgram([...files.keys()], options, host)
  const out = new Map<string, string[]>()
  for (const name of files.keys()) {
    const found = ts
      .getPreEmitDiagnostics(program, program.getSourceFile(name))
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "))
    if (found.length) out.set(name, found)
  }
  return out
}

describe("the docs' examples catalogue", () => {
  it("reads every example, and a Studio row from each meta that gives one", () => {
    expect(Object.keys(sources).length).toBe(EXAMPLES.length)
    expect(entries.filter((e) => e.studio).length).toBeGreaterThan(60)
  })

  it("resolves only settings that are props of the kit's component", () => {
    const kit = eachKitProp((p) => p.name)
    const wrong = entries.flatMap((e) =>
      (e.studio?.props ?? []).filter((s) => !kit.get(e.component)?.includes(s.key)).map((s) => `${e.id}: ${s.key}`),
    )
    expect(wrong).toEqual([])
  })

  it("type-checks every meta against its component's props, and fails one that names what the props lack", () => {
    const knob = readFileSync(
      EXAMPLES.find((f) => f.endsWith("/forms/examples/knob.tsx"))!,
      "utf8",
    )
    const files = new Map(EXAMPLES.map((f) => [f, readFileSync(f, "utf8")]))
    const lacks = join(DOCS, "forms/examples/lacks.tsx")
    const takes = join(DOCS, "forms/examples/takes.tsx")
    files.set(lacks, knob.replace("disabled: {},", "disabled: {}, glow: {},"))
    files.set(takes, knob.replace("disabled: {},", 'disabled: { demo: "no" },'))
    const errors = typeErrors(files)
    const wrong = (file: string, says: string) => (errors.get(file) ?? []).some((e) => e.includes(says))
    expect(wrong(lacks, "'glow' does not exist")).toBe(true)
    expect(wrong(takes, "Type '{ demo: string; }' is not assignable")).toBe(true)
    errors.delete(lacks)
    errors.delete(takes)
    expect([...errors]).toEqual([])
  }, 120_000)

  it("gives a reader the example without its meta, the rest byte for byte", () => {
    for (const file of EXAMPLES) {
      const text = readFileSync(file, "utf8")
      const shown = stripMeta(text)
      expect(shown).not.toMatch(/\bdefineExample\b|\bmeta\b|@\/shared/)
      expect(stripMeta(shown)).toBe(shown)
      // what is left is the module as written, in order: only whole statements went
      let at = 0
      for (const line of shown.split("\n")) {
        const next = text.indexOf(line, at)
        expect(next).toBeGreaterThanOrEqual(at)
        at = next + line.length
      }
    }
    const plain = 'import { DitherKnob } from "@dither-kit"\n\nexport default () => <DitherKnob />\n'
    expect(stripMeta(plain)).toBe(plain)
  })
})
