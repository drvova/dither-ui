// What the build serves the add command (`build/kit-add.ts`): every
// component the kit's index exports, each with a file set that holds every
// import of every file in it, in each styling system, and the script
// itself run against it end to end. The script's own behaviour (the guard,
// the dry run, diff) is `packages/add/tests/add.spec.ts`.
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "rstack/test"
import ts from "typescript"
import { ADD_FILE, ADD_MANIFEST, ADD_SITE, addCommand, isComponentName, kitNamesIn } from "@/shared/lib/add-command"
import { KIT_SRC } from "@/shared/lib/kit-sources"
import { llmsTxt } from "@/pages/docs/crawler-files"
import { SITE_URL } from "@/pages/docs/seo"
import { type AddManifest, addFileList } from "../build/kit-add"
import { kitFiles } from "../build/kit-sources"

const sha = (text: string) => createHash("sha256").update(text).digest("hex")
const scratch = mkdtempSync(join(tmpdir(), "kit-add-"))
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

/** The site as a built folder: the add command's files and the kit's sources. */
const SITE = join(scratch, "site")
let served: Record<string, string>
let manifest: AddManifest
beforeAll(async () => {
  served = await addFileList()
  for (const f of await kitFiles()) served[`${KIT_SRC}${f.file}`] ??= readFileSync(f.path, "utf8")
  for (const [path, text] of Object.entries(served)) {
    mkdirSync(dirname(join(SITE, path)), { recursive: true })
    writeFileSync(join(SITE, path), text)
  }
  manifest = JSON.parse(served[ADD_MANIFEST])
}, 60000)

const STYLINGS = ["tailwind", "css", "modules", "stylex"] as const

/** A component's whole set in a styling system, as the script takes it. */
const setOf = (name: string, styling: (typeof STYLINGS)[number]) => {
  const { layer, base } = manifest.stylings[styling]
  return new Set([...base, ...(manifest.components[name][layer] ?? [])])
}

describe("the manifest", () => {
  it("names every component the kit's index exports, in both layers", () => {
    const index = readFileSync("packages/dither-kit/src/solid/index.ts", "utf8")
    const source = ts.createSourceFile("index.ts", index, ts.ScriptTarget.Latest)
    const exported = source.statements.flatMap((s) =>
      ts.isExportDeclaration(s) && !s.isTypeOnly && s.exportClause && ts.isNamedExports(s.exportClause)
        ? s.exportClause.elements.filter((e) => !e.isTypeOnly).map((e) => e.name.text)
        : [],
    )
    const components = exported.filter(isComponentName)
    expect(components.length).toBeGreaterThan(250)
    expect(Object.keys(manifest.components).sort()).toEqual([...new Set(components)].sort())
    for (const name of components) {
      expect(manifest.components[name].solid, name).toBeDefined()
      expect(manifest.components[name].stylex, name).toBeDefined()
    }
  })

  it("serves every file it lists, as hashed", () => {
    for (const [path, f] of Object.entries(manifest.files)) expect(sha(served[f.src] ?? ""), path).toBe(f.hash)
    expect(served[ADD_FILE]).toBe(readFileSync("packages/add/src/dither-add.mjs", "utf8"))
  })

  it("gives every component a complete file set: each import of each file resolves inside it", () => {
    const holes: string[] = []
    for (const name of Object.keys(manifest.components))
      for (const styling of STYLINGS) {
        const set = setOf(name, styling)
        for (const file of set) {
          if (!manifest.files[file]) holes.push(`${name} (${styling}): ${file} is not served`)
          for (const dep of manifest.files[file]?.imports ?? [])
            if (!set.has(dep)) holes.push(`${name} (${styling}): ${file} imports ${dep}, not in the set`)
        }
      }
    expect(holes).toEqual([])
  })

  it("reads the import graph off the files themselves", () => {
    const world = manifest.components.DitherWorld.solid!
    // a worker by `new URL`, the model parsers by their imports, the chart roots' runtime
    expect(world).toContain("engine/world-worker.ts")
    expect(world).toContain("engine/models/gltf.ts")
    expect(manifest.components.AreaChart.solid).toContain("solid/runtime/plot-canvas.tsx")
    expect(manifest.files["solid/DitherButton.tsx"].imports).toContain("tailwind/control.ts")
    expect(manifest.files["engine/scales.ts"].packages).toContain("d3-scale")
    expect(manifest.files["tailwind/kit.css"].imports).toEqual(["engine/base.css", "engine/theme.css"])
  })

  it("keeps each styling system's own files", () => {
    const { tailwind, css, modules, stylex } = manifest.stylings
    expect(tailwind).toMatchObject({ layer: "solid", sheets: ["tailwind/kit.css"] })
    expect(tailwind.base).toEqual(expect.arrayContaining(["engine/api.ts", "engine/theme.css", "engine/base.css"]))
    for (const s of [css, modules]) {
      expect(s).toMatchObject({ layer: "solid", sheets: ["dither-kit.css"] })
      expect(s.base).not.toContain("tailwind/kit.css")
    }
    // the standalone stylesheet is compiled with the build, served where the docs link it
    expect(manifest.files["dither-kit.css"].src).toBe("kit/dither-kit.css")
    expect(served["kit/dither-kit.css"]).toContain(":where(.dither-kit")
    expect(stylex.layer).toBe("stylex")
    const button = setOf("DitherButton", "stylex")
    expect(button.has("stylex/DitherButton.tsx")).toBe(true)
    expect(button.has("solid/DitherButton.tsx")).toBe(false)
  })

  it("makes the twin's imports of the kit relative, so a copy holds both under one alias", () => {
    const twin = Object.entries(manifest.files).filter(([p]) => p.startsWith("stylex/"))
    expect(twin.length).toBeGreaterThan(250)
    for (const [path, f] of twin) expect(served[f.src], path).not.toMatch(/["']@dither-ui\//)
    expect(served[manifest.files["stylex/DitherButton.tsx"].src]).toContain('from "../engine/pixel"')
    // the components' stylesheets and the Solid layer's runtime are the kit's own
    expect(served[manifest.files["stylex/DitherMenu.tsx"].src]).toContain('"../solid/DitherMenu.css"')
    expect(manifest.components.DitherMenu.stylex).toContain("solid/DitherMenu.css")
  })

  it("names the file of each index statement, the engine's API first", () => {
    for (const layer of ["solid", "stylex"] as const) {
      const { statements } = manifest.index[layer]
      expect(statements[0]).toEqual({ file: "engine/api.ts", text: 'export * from "../engine/api"' })
      for (const s of statements) expect(manifest.files[s.file], s.text).toBeDefined()
    }
  })
})

describe("the script against the build", () => {
  /** A button, a chart and a 3D world: three families. */
  const NAMES = ["DitherButton", "AreaChart", "Area", "XAxis", "DitherWorld"]

  for (const styling of STYLINGS)
    it(`adds a button, a chart and a world in ${styling}, every relative import resolving`, () => {
      const cwd = join(scratch, `app-${styling}`)
      mkdirSync(cwd, { recursive: true })
      writeFileSync(join(cwd, "package.json"), "{}")
      const run = spawnSync(
        process.execPath,
        [join(process.cwd(), "packages/add/src/dither-add.mjs"), "add", ...NAMES, "--styling", styling, "--from", SITE],
        { cwd, encoding: "utf8" },
      )
      expect(run.status, run.stderr).toBe(0)
      const layer = manifest.stylings[styling].layer
      const root = join(cwd, "src/dither-kit")
      const lock = JSON.parse(readFileSync(join(root, ".dither-add.json"), "utf8")) as { files: Record<string, string> }
      const written = new Set(Object.keys(lock.files))
      const missing: string[] = []
      for (const file of written) {
        if (!/\.tsx?$/.test(file)) continue
        const text = readFileSync(join(root, file), "utf8")
        for (const { fileName } of ts.preProcessFile(text, true, true).importedFiles) {
          if (!fileName.startsWith(".")) continue
          const at = join(dirname(file), fileName)
          if (![at, `${at}.ts`, `${at}.tsx`, `${at}/index.ts`].some((f) => written.has(f)))
            missing.push(`${file}: ${fileName}`)
        }
      }
      expect(missing).toEqual([])
      const index = readFileSync(join(root, `${layer}/index.ts`), "utf8")
      for (const name of NAMES) expect(index).toMatch(new RegExp(`\\b${name}\\b`))
      expect(run.stdout).toContain(`Point @dither-kit at src/dither-kit/${layer}`)
    })
})

describe("the line that runs it", () => {
  it("pipes the site's script into Node, naming the styling system and another site only when they differ", () => {
    expect(addCommand(["DitherButton"])).toBe(
      `curl -fsSL ${ADD_SITE}${ADD_FILE} | node --input-type=module - add DitherButton`,
    )
    expect(addCommand(["AreaChart", "Area"], { styling: "stylex", site: "http://localhost:3000/" })).toBe(
      "curl -fsSL http://localhost:3000/add/dither-add.mjs | node --input-type=module - add AreaChart Area --styling stylex --from http://localhost:3000/",
    )
  })

  it("defaults to the site the docs are, as the script does, and reads the manifest the build writes", () => {
    expect(ADD_SITE).toBe(`${SITE_URL}/`)
    const script = readFileSync("packages/add/src/dither-add.mjs", "utf8")
    expect(script).toContain(`const SITE = "${ADD_SITE}"`)
    expect(script).toContain(`const MANIFEST = "${ADD_MANIFEST}"`)
  })

  it("is in llms.txt and the agent skill, for coding agents", () => {
    expect(llmsTxt()).toContain(addCommand(["DitherButton", "AreaChart", "Area"]))
    expect(llmsTxt()).toContain(`${SITE_URL}/${ADD_FILE}`)
    expect(readFileSync("packages/site/public/agent/SKILL.md", "utf8")).toContain(
      addCommand(["DitherButton", "AreaChart", "Area"]),
    )
  })

  it("names the kit components a snippet imports and renders, not Solid's or its own", () => {
    const code = `import { DitherButton, type ButtonVariant, useDitherMatrix } from "@dither-kit"
import { For } from "solid-js"
function Row() { return <DitherBadge /> }
<For each={rows}>{() => <Row><AreaChart data={rows}><Area dataKey="a" /></AreaChart></Row>}</For>`
    expect(kitNamesIn(code)).toEqual(["DitherButton", "DitherBadge", "AreaChart", "Area"])
    expect(["XAxis", "DitherButton"].every(isComponentName)).toBe(true)
    expect(["BAYER8", "STAGE", "useDitherMatrix", "toast"].some(isComponentName)).toBe(false)
  })
})
