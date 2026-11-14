// The Studio's component registry, held to the Solid kit: every prop a row
// binds (its `PropSpec` keys, after its `mapProps`, a field's label left to
// its DitherField) is a prop its component really takes, by the type
// checker (`docs-api.ts`); every value a setting hands its prop as it
// stands (its default, an edit, each option of a select) is one the prop's
// type takes, so a kind or an option the kit's type has left fails here;
// and the code the Studio exports for a frame of each row type-checks
// against the kit as a reader's project would.
import { join } from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"
import { FACTS } from "#dither-facts"
import { createArtboard } from "@/entities/artboard"
import { createComponent } from "@/entities/widget/model/factory"
import {
  boundProps,
  COMPONENT_REGISTRY,
  type ComponentEntry,
  defaultComponentProps,
  demoToast,
  type PropSpec,
} from "@/entities/widget/model/registry"
import { frameCode } from "../../src/entities/artboard/code"
import { readKit, SITE } from "./docs-api"

const { props: kit, accepts } = readKit()

describe("the component registry", () => {
  it("names a component of the kit in every row", () => {
    expect(COMPONENT_REGISTRY.filter((e) => !kit.has(e.is)).map((e) => e.is)).toEqual([])
  })

  it("binds only props its component takes", () => {
    // what its row hands the component once mapped, which the code export writes
    const wrong = COMPONENT_REGISTRY.flatMap((e) =>
      Object.keys(boundProps(e.is, defaultComponentProps(e)))
        .filter((key) => !kit.get(e.is)?.has(key))
        .map((key) => `${e.is}.${key}`),
    )
    expect(wrong).toEqual([])
  })

  it("gives each prop it binds as it stands only values the prop's type takes", () => {
    const wrong = COMPONENT_REGISTRY.flatMap((e) => {
      const def = defaultComponentProps(e)
      return e.props.flatMap((spec) => {
        const values = spec.kind === "select" ? spec.options : [spec.def, edited(spec)]
        return values
          .filter((v) => {
            // a value the mapping reshapes is the mapping's to fit, held by the export's type check below
            const bound = boundProps(e.is, { ...def, [spec.key]: v })
            return JSON.stringify(bound[spec.key]) === JSON.stringify(v) && accepts(e.is, spec.key, v) === false
          })
          .map((v) => `${e.is}.${spec.key} (${spec.kind}) = ${JSON.stringify(v)}`)
      })
    })
    expect(wrong).toEqual([])
  })

  it("lets every setting it leaves unbound reach the component through its mapping, or its demo", () => {
    // a list the mapping reads into the prop it makes (a bracket's teams
    // into `rounds`), the toaster's `toast()` call
    const lost = COMPONENT_REGISTRY.flatMap((e) => {
      const def = defaultComponentProps(e)
      const bound = boundProps(e.is, def)
      return e.props
        .filter((spec) => !(spec.key in bound) && !(e.field && spec.key === "label"))
        .filter((spec) => {
          const changed = { ...def, [spec.key]: edited(spec) }
          const reads = (f: (p: Record<string, unknown>) => unknown) =>
            JSON.stringify(f(changed)) !== JSON.stringify(f(def))
          return !reads((p) => boundProps(e.is, p)) && !(e.demo === "toaster" && reads(demoToast))
        })
        .map((spec) => `${e.is}.${spec.key}`)
    })
    expect(lost).toEqual([])
  })

  it("counts the kit the build counts", () => {
    // the build counts the index's `Dither*` exports; the checker, the
    // components among them
    expect([...kit.keys()].filter((n) => n.startsWith("Dither")).length).toBe(FACTS.components)
  })
})

/** A value each kind of setting may take that is not its default. */
function edited(spec: PropSpec): string | number | boolean | string[] {
  switch (spec.kind) {
    case "text":
      return spec.key === "label" ? "Edited label" : `${spec.def} edited`
    case "url":
      return "https://example.com/edited"
    case "boolean":
      return !spec.def
    case "number": {
      const step = spec.step ?? 1
      const up = spec.def + step
      return spec.max != null && up > spec.max ? spec.def - step : up
    }
    case "select":
      return spec.options.find((o) => o !== spec.def) ?? spec.def
    case "color":
      return spec.def === "green" ? "orange" : "green"
    case "list":
      return [...spec.def.slice(1), spec.def[0] ?? "Edited"]
  }
}

/** The file the Studio exports for a frame of the row's component, with
 * every setting at its default or every one edited. */
function exported(entry: ComponentEntry, edit: boolean): string {
  const a = createArtboard("button")
  a.name = entry.label
  const widget = createComponent(entry)
  if (edit) for (const spec of entry.props) widget.props[spec.key] = edited(spec)
  a.widget = widget
  return frameCode(a, "tailwind").code
}

/** Every file's errors under the repository's own compiler options, with
 * `@dither-kit` the kit's Solid layer, as a reader aliases it. */
function typeErrors(files: Map<string, string>): Map<string, string[]> {
  const config = ts.getParsedCommandLineOfConfigFile(
    join(SITE, "../../tsconfig.json"),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (d) => {
        throw new Error(ts.flattenDiagnosticMessageText(d.messageText, "\n"))
      },
    },
  )!
  const options: ts.CompilerOptions = {
    ...config.options,
    noEmit: true,
    paths: { ...config.options.paths, "@dither-kit": [join(SITE, "../dither-kit/src/solid/index.ts")] },
  }
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

describe("the code a frame of each row exports", () => {
  it("type-checks against the kit, as it comes and edited", () => {
    const dir = join(SITE, "tests/site/frames/")
    const files = new Map<string, string>()
    for (const entry of COMPONENT_REGISTRY)
      for (const edit of [false, true])
        files.set(`${dir}${entry.is}${edit ? ".edited" : ""}.tsx`, exported(entry, edit))
    const errors = [...typeErrors(files)].map(([name, found]) => `${name.slice(dir.length)}: ${found.join(" | ")}`)
    expect(errors).toEqual([])
  }, 120_000)
})
