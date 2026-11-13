// The workspace, held by construction: `packages/` is a set of packages
// whose dependencies point one way. Each has its own manifest, an AGENTS.md
// that owns it and a `src/`; each is named under the workspace's scope and
// taken from its folder, so no name here is one the registry can answer
// with a stranger's package; each imports another only by its name, only
// what that package's `exports` declare, only if its own manifest declares
// the dependency, and only down the order below. A module that needs
// something above it is in the wrong package.
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { builtinModules } from "node:module"
import { dirname, join, relative, resolve } from "node:path"
import { describe, expect, it } from "rstack/test"
import ts from "typescript"

const ROOT = join(import.meta.dirname, "..")
const PACKAGES = join(ROOT, "packages")

/** The scope every package here is named under. The bare names (`tasks`,
 * `site`, `bridge`, `dither-kit`) are other people's on the registry. */
const SCOPE = "@dither-ui/"

/** Every package by its name: its folder in `packages/`. */
const FOLDER: Record<string, string> = {
  "@dither-ui/kit": "dither-kit",
  "@dither-ui/restyle": "restyle",
  "@dither-ui/kit-stylex": "dither-kit-stylex",
  "@dither-ui/tasks": "tasks",
  "@dither-ui/bridge": "bridge",
  "@dither-ui/discord": "discord",
  "@dither-ui/site": "site",
}

/** Every package, and the packages it may depend on. The kit depends on
 * none; the bridge and the Discord service stand alone; the StyleX twin
 * takes the rewriter for the spec that generates it, never in its source. */
const MAY_USE: Record<string, readonly string[]> = {
  "@dither-ui/kit": [],
  "@dither-ui/restyle": ["@dither-ui/kit"],
  "@dither-ui/kit-stylex": ["@dither-ui/kit", "@dither-ui/restyle"],
  "@dither-ui/tasks": ["@dither-ui/kit"],
  "@dither-ui/bridge": [],
  "@dither-ui/discord": [],
  "@dither-ui/site": [
    "@dither-ui/kit",
    "@dither-ui/kit-stylex",
    "@dither-ui/restyle",
    "@dither-ui/tasks",
    "@dither-ui/bridge",
  ],
}
const NAMES = Object.keys(MAY_USE)
const dirOf = (name: string) => join(PACKAGES, FOLDER[name])

/** The one package a reader installs or copies: every other is private. */
const PUBLIC = "@dither-ui/kit"

/** Modules a build supplies rather than a package (`restyle`'s utility map). */
const VIRTUAL = new Set(["virtual-dither-utilities"])

/** The site's alias for its own `src/`: no other package has one. */
const OWN_SOURCE = { package: "@dither-ui/site", prefix: "@/" }

type Manifest = {
  name: string
  private?: boolean
  type?: string
  exports?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}
const manifest = (dir: string) => JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as Manifest
const MANIFESTS = Object.fromEntries(NAMES.map((n) => [n, manifest(dirOf(n))]))
const WORKSPACE = manifest(ROOT)

const SKIP = new Set(["node_modules", "public"])
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    SKIP.has(e.name) || e.name.startsWith(".")
      ? []
      : e.isDirectory()
        ? walk(join(dir, e.name))
        : /\.(tsx?|mts|mjs)$/.test(e.name)
          ? [join(dir, e.name)]
          : [],
  )

/** What a module imports, as its parser reads it (an `import` inside a
 * snippet's string is text), with what a spec mocks by name and the files
 * a module finds through another package's exports to read as text. */
const importsOf = (text: string) => [
  ...ts.preProcessFile(text, true, true).importedFiles.map((f) => f.fileName),
  ...[...text.matchAll(/\bvi\.(?:mock|doMock|importActual)\(\s*"([^"]+)"/g)].map((m) => m[1]),
  ...[...text.matchAll(/\bcreateRequire\(import\.meta\.url\)\.resolve\(\s*"([^"]+)"/g)].map((m) => m[1]),
]

/** Every import of every package: where it is written and what it names. */
const IMPORTS = NAMES.flatMap((pkg) =>
  walk(dirOf(pkg)).flatMap((file) =>
    importsOf(readFileSync(file, "utf8")).map((spec) => ({ pkg, file, spec, at: relative(ROOT, file) })),
  ),
)

/** The package a bare specifier names (`a/b` → `a`, `@a/b/c` → `@a/b`). */
const packageOf = (spec: string) =>
  spec
    .split("/")
    .slice(0, spec.startsWith("@") ? 2 : 1)
    .join("/")
const isBare = (spec: string) => !spec.startsWith(".") && !spec.startsWith("/") && !spec.startsWith("\0")

/** The file a package's `exports` gives a subpath, if it declares one: an
 * exact key, else the pattern with the longest prefix. */
function exported(pkg: string, subpath: string): string | null {
  const table = MANIFESTS[pkg].exports ?? {}
  if (table[subpath]) return join(dirOf(pkg), table[subpath])
  const patterns = Object.keys(table)
    .filter((k) => k.includes("*") && subpath.startsWith(k.split("*")[0]) && subpath.endsWith(k.split("*")[1]))
    .sort((a, b) => b.indexOf("*") - a.indexOf("*"))
  if (!patterns.length) return null
  const [before, after] = patterns[0].split("*")
  const star = subpath.slice(before.length, subpath.length - after.length)
  return join(dirOf(pkg), table[patterns[0]].replace("*", star))
}

/** Whether a file is the package's source: what ships, as against its
 * specs, benches and build tooling, which may use its devDependencies. */
const isSource = (pkg: string, file: string) => file.startsWith(join(dirOf(pkg), "src") + "/")

describe("the workspace", () => {
  it("is exactly the packages the order names", () => {
    const folders = readdirSync(PACKAGES, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
    expect(folders.sort()).toEqual(Object.values(FOLDER).sort())
    expect(Object.keys(FOLDER).sort()).toEqual([...NAMES].sort())
    expect(WORKSPACE.private).toBe(true)
    expect((WORKSPACE as unknown as { workspaces: string[] }).workspaces).toEqual(["packages/*"])
  })

  it("gives every package its manifest, its source, its one entry and a doc that owns it", () => {
    for (const name of NAMES) {
      const dir = dirOf(name)
      const pkg = MANIFESTS[name]
      expect(pkg.name, name).toBe(name)
      expect(pkg.type, name).toBe("module")
      expect(pkg.private === true, `${name} is private unless it is the kit`).toBe(name !== PUBLIC)
      expect(existsSync(join(dir, "src")), `${name}/src`).toBe(true)
      expect(existsSync(join(dir, "AGENTS.md")), `${name}/AGENTS.md`).toBe(true)
      for (const [subpath, target] of Object.entries(pkg.exports ?? {}))
        if (!target.includes("*")) expect(existsSync(join(dir, target)), `${name} exports ${subpath}`).toBe(true)
    }
  })

  it("names every package under its scope, and takes each from its folder, never from the registry", () => {
    for (const name of NAMES) {
      const pkg = MANIFESTS[name]
      expect(pkg.name.startsWith(SCOPE) && pkg.name.length > SCOPE.length, `${pkg.name} is named under ${SCOPE}`).toBe(
        true,
      )
      for (const deps of [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies])
        for (const [dep, range] of Object.entries(deps ?? {}))
          if (dep in FOLDER) expect(range, `${name} takes ${dep}`).toBe(`file:../${FOLDER[dep]}`)
    }
    // The lockfile agrees: each is a link to its folder, with no registry address.
    const lock = JSON.parse(readFileSync(join(ROOT, "package-lock.json"), "utf8")) as {
      packages: Record<string, { name?: string; resolved?: string; link?: boolean }>
    }
    for (const name of NAMES) {
      expect(lock.packages[`node_modules/${name}`], name).toEqual({ resolved: `packages/${FOLDER[name]}`, link: true })
      expect(lock.packages[`packages/${FOLDER[name]}`]?.name, name).toBe(name)
    }
    // and no unscoped name of ours is left for the registry to answer
    const bare = new Set(NAMES.flatMap((n) => [n.slice(SCOPE.length), FOLDER[n]]))
    expect(Object.keys(lock.packages).filter((k) => bare.has(k.replace(/^.*node_modules\//, "")))).toEqual([])
    const every = [WORKSPACE, ...Object.values(MANIFESTS)].flatMap((m) =>
      [m.dependencies, m.devDependencies, m.peerDependencies].flatMap((d) => Object.keys(d ?? {})),
    )
    expect(every.filter((n) => bare.has(n))).toEqual([])
  })

  it("orders its packages one way: no package depends on one that reaches it", () => {
    const reaches = (from: string, seen = new Set<string>()): Set<string> => {
      for (const next of MAY_USE[from]) if (!seen.has(next)) reaches(next, seen.add(next))
      return seen
    }
    for (const name of NAMES) expect([...reaches(name)], name).not.toContain(name)
  })

  it("declares in each manifest only the packages its place in the order allows", () => {
    for (const name of NAMES) {
      const pkg = MANIFESTS[name]
      const declared = [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies].flatMap((d) =>
        Object.keys(d ?? {}).filter((n) => NAMES.includes(n)),
      )
      expect(
        declared.filter((n) => !MAY_USE[name].includes(n)),
        name,
      ).toEqual([])
    }
  })
})

describe("an import between packages", () => {
  it("is read from every package, and from each that may use another", () => {
    expect(IMPORTS.length).toBeGreaterThan(5000)
    for (const name of NAMES)
      expect(
        IMPORTS.some((i) => i.pkg === name && (!MAY_USE[name].length || NAMES.includes(packageOf(i.spec)))),
        name,
      ).toBe(true)
  })

  it("never leaves its package by a relative path", () => {
    const out = IMPORTS.filter(
      (i) => i.spec.startsWith(".") && relative(dirOf(i.pkg), resolve(dirname(i.file), i.spec)).startsWith(".."),
    )
    expect(out.map((i) => `${i.at}: ${i.spec}`)).toEqual([])
  })

  it("names its package, with no alias but the site's own source", () => {
    const aliased = IMPORTS.filter(
      (i) =>
        /^(@dither-kit|~)(\/|$)/.test(i.spec) || (i.spec.startsWith(OWN_SOURCE.prefix) && i.pkg !== OWN_SOURCE.package),
    )
    expect(aliased.map((i) => `${i.at}: ${i.spec}`)).toEqual([])
  })

  it("goes down the order, to a package the importer's manifest declares", () => {
    const wrong: string[] = []
    for (const i of IMPORTS) {
      const to = packageOf(i.spec)
      if (!isBare(i.spec) || !NAMES.includes(to) || to === i.pkg) continue
      const pkg = MANIFESTS[i.pkg]
      const shipped = { ...pkg.dependencies, ...pkg.peerDependencies }
      const declared = isSource(i.pkg, i.file) ? shipped : { ...shipped, ...pkg.devDependencies }
      if (!MAY_USE[i.pkg].includes(to)) wrong.push(`${i.at}: ${i.spec} goes against the order`)
      else if (!(to in declared)) wrong.push(`${i.at}: ${i.spec} is not declared by ${i.pkg}`)
    }
    expect(wrong).toEqual([])
  })

  it("reaches only what the other package exports, and the file is there", () => {
    const past: string[] = []
    for (const i of IMPORTS) {
      const to = packageOf(i.spec)
      if (!isBare(i.spec) || !NAMES.includes(to) || to === i.pkg) continue
      const file = exported(to, `.${i.spec.slice(to.length).split("?")[0]}`)
      if (!file) past.push(`${i.at}: ${i.spec} is not an export of ${to}`)
      else if (!existsSync(file)) past.push(`${i.at}: ${i.spec} names no file`)
    }
    expect(past).toEqual([])
  })

  it("names an outside package only where the importer's manifest, or the workspace's, declares it", () => {
    const tools = { ...WORKSPACE.dependencies, ...WORKSPACE.devDependencies }
    const undeclared = new Set<string>()
    for (const i of IMPORTS) {
      const to = packageOf(i.spec)
      if (!isBare(i.spec) || NAMES.includes(to) || VIRTUAL.has(i.spec)) continue
      if (i.spec.startsWith("node:") || builtinModules.includes(to)) continue
      if (i.pkg === OWN_SOURCE.package && i.spec.startsWith(OWN_SOURCE.prefix)) continue
      const pkg = MANIFESTS[i.pkg]
      const declared = { ...pkg.dependencies, ...pkg.peerDependencies, ...pkg.devDependencies, ...tools }
      if (!(to in declared)) undeclared.add(`${i.pkg}: ${to}`)
    }
    expect([...undeclared].sort()).toEqual([])
  })
})

// The kit and the site were Vue's before they were Solid's.
describe("no Vue", () => {
  it("is imported by any package, anywhere", () => {
    const offenders = IMPORTS.filter(
      (i) =>
        /^(vue|@vue\/.*|vue\/.*|vue-.*|@vitejs\/plugin-vue.*|@rsbuild\/plugin-vue)$/.test(i.spec) ||
        i.spec.endsWith(".vue"),
    )
    expect(new Set(IMPORTS.map((i) => i.file)).size).toBeGreaterThan(900)
    expect(offenders.map((i) => `${i.at} imports ${i.spec}`)).toEqual([])
  })

  it("is a dependency of no package here", () => {
    for (const [name, pkg] of [["the workspace", WORKSPACE] as const, ...Object.entries(MANIFESTS)]) {
      const named = [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies].flatMap((d) =>
        Object.keys(d ?? {}).filter((n) => /^(vue|@vue\/.*|vue-.*|.*plugin-vue.*)$/.test(n)),
      )
      expect({ name, named }).toEqual({ name, named: [] })
    }
  })
})
