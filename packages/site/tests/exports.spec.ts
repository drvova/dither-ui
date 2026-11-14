// No export without an importer: every name a module of the site, the
// styling rewriter or the tasks exports is imported somewhere in the
// workspace (a spec counts), or the module is one a framework or a build
// reads by its place, listed below. An export nobody takes is a surface
// nobody holds to: it drifts. Read with TypeScript's own parser; an
// `import()` is read off the text, so one inside a snippet's string can
// only keep a name, never lose one.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { describe, expect, it } from "rstack/test"
import ts from "typescript"

const ROOT = join(import.meta.dirname, "../../..")
const PACKAGES = join(ROOT, "packages")
const SITE_SRC = join(PACKAGES, "site/src")

/** The trees whose exports are held: the kit's are its public API (its
 * StyleX twin generated from it), and the bridge's and the Discord
 * service's are run, not imported. */
const HELD = ["site/src", "restyle/src", "tasks/src"].map((p) => join(PACKAGES, p))

/** Modules read by their place rather than by an import: SolidStart's file
 * routes (`default`, `route`), the entries and the shell. */
const READ_BY_PLACE = [/^site\/src\/routes\//, /^site\/src\/entry-(client|server)\.tsx$/, /^site\/src\/app\.tsx$/]

/** Every package by its name: its folder in `packages/`. */
const FOLDER: Record<string, string> = Object.fromEntries(
  readdirSync(PACKAGES)
    .filter((d) => existsSync(join(PACKAGES, d, "package.json")))
    .map((d) => [JSON.parse(readFileSync(join(PACKAGES, d, "package.json"), "utf8")).name as string, d]),
)

const SKIP = new Set(["node_modules", "public", ".output", "dist"])
const CODE = /\.(tsx?|mts|mjs|js)$/
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? SKIP.has(e.name) || e.name.startsWith(".")
        ? []
        : walk(join(dir, e.name))
      : CODE.test(e.name) && !/\.d\.m?ts$/.test(e.name)
        ? [join(dir, e.name)]
        : [],
  )
/** Every module that may import one: each package's whole folder and the
 * workspace's own specs and configs. */
const FILES = [
  ...walk(PACKAGES),
  ...walk(join(ROOT, "tests")),
  ...readdirSync(ROOT)
    .filter((f) => CODE.test(f))
    .map((f) => join(ROOT, f)),
]

const EXTENSIONS = ["", ".ts", ".tsx", ".mts", ".mjs", ".js", "/index.ts", "/index.tsx"]
const fileAt = (base: string): string | null => {
  for (const ext of EXTENSIONS) {
    const f = base + ext
    if (existsSync(f) && statSync(f).isFile()) return f
  }
  return null
}

/** The workspace file an import names, or null for anything else. */
function target(from: string, written: string): string | null {
  const spec = written.split("?")[0]
  if (spec.startsWith(".")) return fileAt(resolve(dirname(from), spec))
  if (spec.startsWith("@/")) return fileAt(join(SITE_SRC, spec.slice(2)))
  const name = Object.keys(FOLDER).find((n) => spec === n || spec.startsWith(`${n}/`))
  if (!name) return null
  const dir = join(PACKAGES, FOLDER[name])
  const sub = `.${spec.slice(name.length)}`
  const exports = (JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).exports ?? {}) as Record<string, string>
  if (exports[sub]) return fileAt(join(dir, exports[sub]))
  const star = Object.keys(exports).find((k) => k.endsWith("*") && sub.startsWith(k.slice(0, -1)))
  return star ? fileAt(join(dir, exports[star].replace("*", sub.slice(star.length - 1)))) : null
}

/** What a module says of its exports: the names it declares, the names it
 * passes on from another (`export { a } from`, or an imported binding
 * exported), and the modules it passes on whole (`export *`). */
type Module = {
  own: Set<string>
  forwards: Map<string, { to: string; name: string }>
  stars: string[]
}
const ALL = "*"
const MODULES = new Map<string, Module>()
/** Each module's names some other module takes; `*` takes them all. */
const TAKEN = new Map<string, Set<string>>()
const take = (file: string, name: string) => {
  const names = TAKEN.get(file) ?? new Set()
  TAKEN.set(file, names.add(name))
}

const exported = (n: ts.Node) =>
  ts.canHaveModifiers(n) && (ts.getModifiers(n) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
const isDefault = (n: ts.Node) =>
  ts.canHaveModifiers(n) && (ts.getModifiers(n) ?? []).some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
const bindingNames = (b: ts.BindingName): string[] =>
  ts.isIdentifier(b) ? [b.text] : b.elements.flatMap((e) => (ts.isOmittedExpression(e) ? [] : bindingNames(e.name)))

for (const file of FILES) {
  const text = readFileSync(file, "utf8")
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
  const mod: Module = { own: new Set(), forwards: new Map(), stars: [] }
  const imported = new Map<string, { to: string; name: string }>()
  for (const s of source.statements) {
    if (ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier)) {
      const to = target(file, s.moduleSpecifier.text)
      const clause = s.importClause
      if (!to || !clause) continue
      if (clause.name) {
        take(to, "default")
        imported.set(clause.name.text, { to, name: "default" })
      }
      const bound = clause.namedBindings
      if (bound && ts.isNamespaceImport(bound)) take(to, ALL)
      else if (bound)
        for (const e of bound.elements) {
          const name = (e.propertyName ?? e.name).text
          take(to, name)
          imported.set(e.name.text, { to, name })
        }
    } else if (ts.isExportDeclaration(s)) {
      const to =
        s.moduleSpecifier && ts.isStringLiteral(s.moduleSpecifier) ? target(file, s.moduleSpecifier.text) : null
      if (s.moduleSpecifier && !to) continue
      const clause = s.exportClause
      if (!clause) to && mod.stars.push(to)
      else if (ts.isNamespaceExport(clause)) {
        mod.own.add(clause.name.text)
        if (to) take(to, ALL)
      } else
        for (const e of clause.elements) {
          const local = (e.propertyName ?? e.name).text
          const from = to ? { to, name: local } : imported.get(local)
          if (from) mod.forwards.set(e.name.text, from)
          else mod.own.add(e.name.text)
        }
    } else if (ts.isExportAssignment(s)) mod.own.add("default")
    else if (exported(s)) {
      if (isDefault(s)) mod.own.add("default")
      else if (ts.isVariableStatement(s))
        for (const d of s.declarationList.declarations) for (const n of bindingNames(d.name)) mod.own.add(n)
      else {
        const name = (s as ts.DeclarationStatement).name
        if (name && ts.isIdentifier(name)) mod.own.add(name.text)
      }
    }
  }
  // `import("x")`, in code or a type: its one named member, else all of it
  // (a promise's `then` reads whatever it likes).
  for (const m of text.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)(?:\.(?!then\b)(\w+))?/g)) {
    const to = target(file, m[1])
    if (to) take(to, m[2] ?? ALL)
  }
  MODULES.set(file, mod)
}

/** Every name some module takes, followed through the modules that pass
 * names on, as `file#name`. */
const USED = new Set<string>()
function use(file: string, name: string) {
  const key = `${file}#${name}`
  if (USED.has(key)) return
  USED.add(key)
  const mod = MODULES.get(file)
  if (!mod) return
  if (name === ALL) {
    for (const own of mod.own) USED.add(`${file}#${own}`)
    for (const [as, f] of mod.forwards) {
      USED.add(`${file}#${as}`)
      use(f.to, f.name)
    }
    for (const s of mod.stars) use(s, ALL)
    return
  }
  const f = mod.forwards.get(name)
  if (f) return use(f.to, f.name)
  if (!mod.own.has(name)) for (const s of mod.stars) use(s, name)
}
for (const [file, names] of TAKEN) for (const name of names) use(file, name)

const held = (file: string) =>
  HELD.some((h) => !relative(h, file).startsWith("..")) && !READ_BY_PLACE.some((r) => r.test(relative(PACKAGES, file)))

describe("exports", () => {
  it("reads the workspace's modules and what they take", () => {
    expect(FILES.length).toBeGreaterThan(500)
    expect(USED.size).toBeGreaterThan(1000)
  })

  it("exports nothing no module imports", () => {
    const unused = [...MODULES]
      .filter(([file]) => held(file))
      .flatMap(([file, mod]) =>
        [...mod.own, ...mod.forwards.keys()]
          .filter((name) => !USED.has(`${file}#${name}`))
          .map((name) => `${relative(PACKAGES, file)}: ${name}`),
      )
    expect(unused).toEqual([])
  })
})
