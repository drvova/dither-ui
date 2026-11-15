// What the add command (`@dither-ui/add`, served at `ADD_FILE`) reads: a
// manifest of every file a reader's copy of the kit can hold and each
// component's whole file set, in each styling system, beside the files
// themselves. All of it derived: the kit's sources as the source panel
// serves them (`kitFiles`), the StyleX twin with its imports of the kit
// made relative (a copy holds both in one folder, so the reader sets one
// alias), the kit's two stylesheets, and the import graph read off every
// file; the components are what the kit's index exports. An import that
// resolves to no file of the copy fails the build. Served in dev, emitted
// with the browser's assets in a build.
import { createHash } from "node:crypto"
import { readdir, readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import ts from "typescript"
import type { Plugin } from "vite"
import { buildKitCss } from "@dither-ui/tasks/kit-css"
import { ADD_FILE, ADD_FILES, ADD_MANIFEST, isComponentName } from "../src/shared/lib/add-command.ts"
import { KIT_SRC } from "../src/shared/lib/kit-sources.ts"
import { kitFiles } from "./kit-sources.ts"

const require = createRequire(import.meta.url)
/** The script as its own package exports it, served as written. */
const SCRIPT = require.resolve("@dither-ui/add/dither-add.mjs")
/** The Tailwind layer's stylesheet entry, which the source panel does not serve. */
const KIT_CSS = require.resolve("@dither-ui/kit/tailwind/kit.css")
/** The StyleX twin's source folder. */
const TWIN = dirname(require.resolve("@dither-ui/kit-stylex"))

/** The two layers a copy's components come in, each with its index. */
type AddLayer = "solid" | "stylex"
type AddStyling = "tailwind" | "css" | "modules" | "stylex"

export interface AddManifest {
  /** A hash over every file's: what changes when any file does. */
  version: string
  /** Each styling system: its layer, the files every add brings (the
   * engine's API and the stylesheets) and the stylesheets to load. */
  stylings: Record<AddStyling, { layer: AddLayer; base: string[]; sheets: string[] }>
  /** Every file a copy can hold, by its path in the copy: where the site
   * serves it, its sha256, the copy's files it imports and the packages. */
  files: Record<string, { src: string; hash: string; imports: string[]; packages: string[] }>
  /** Each layer's index in a copy (`solid/index.ts`, `stylex/index.ts`):
   * the kit index's statements, each with the file it exports from. */
  index: Record<AddLayer, { path: string; statements: { file: string; text: string }[] }>
  /** Each component by its export name: its file set in each layer that
   * has it (its own file and everything it imports, sorted), less the
   * engine's API every styling's `base` brings. */
  components: Record<string, Partial<Record<AddLayer, string[]>>>
}

const sha = (text: string) => createHash("sha256").update(text).digest("hex")

/** `@dither-ui/kit/<layer>/<file>.ts` in a twin file `depth` folders under
 * `stylex/`, as the copy's relative path. */
function relativeKit(text: string, depth: number): string {
  const up = "../".repeat(depth + 1)
  return text.replace(/(["'])@dither-ui\/kit\/((?:engine|solid|tailwind)\/[^"']+?)(?:\.tsx?)?\1/g, `$1${up}$2$1`)
}

/** A relative import made in `from` as the copy's file it names. */
function resolveIn(spec: string, from: string, files: ReadonlySet<string>): string | undefined {
  const parts = from.split("/").slice(0, -1)
  for (const seg of spec.split("/")) {
    if (seg === "..") parts.pop()
    else if (seg !== ".") parts.push(seg)
  }
  const p = parts.join("/")
  return [p, `${p}.ts`, `${p}.tsx`, `${p}/index.ts`].find((f) => files.has(f))
}

/** What a file imports, as written: every import and export of a module,
 * a dynamic import, a worker's `new URL(…, import.meta.url)`, a
 * stylesheet's `@import`. */
function specifiers(path: string, text: string): string[] {
  if (path.endsWith(".css")) return [...text.matchAll(/@import\s+["']([^"']+)["']/g)].map((m) => m[1])
  return [
    ...ts.preProcessFile(text, true, true).importedFiles.map((f) => f.fileName),
    ...[...text.matchAll(/new URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url/g)].map((m) => m[1]),
  ]
}

/** A bare specifier's package: `solid-js/web` is `solid-js`. */
const packageOf = (spec: string) =>
  spec
    .split("/")
    .slice(0, spec.startsWith("@") ? 2 : 1)
    .join("/")

/** An index's statements: each `export … from "./x"` with the file it names. */
function statementsOf(text: string, at: string, files: ReadonlySet<string>) {
  const source = ts.createSourceFile(at, text, ts.ScriptTarget.Latest, true)
  const out: { file: string; text: string; names: string[] }[] = []
  for (const node of source.statements) {
    if (!ts.isExportDeclaration(node) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) continue
    const file = resolveIn(node.moduleSpecifier.text, at, files)
    if (!file) throw new Error(`${at}: ${node.moduleSpecifier.text} is no file of the copy`)
    const names =
      !node.isTypeOnly && node.exportClause && ts.isNamedExports(node.exportClause)
        ? node.exportClause.elements.filter((e) => !e.isTypeOnly).map((e) => e.name.text)
        : []
    out.push({ file, text: node.getText(source), names })
  }
  return out
}

/** Every file a copy can hold, by its path in the copy: where it is
 * served from and its text. */
async function copyFiles(): Promise<Map<string, { src: string; text: string }>> {
  const out = new Map<string, { src: string; text: string }>()
  for (const f of await kitFiles())
    out.set(f.file, { src: `${KIT_SRC}${f.file}`, text: await readFile(f.path, "utf8") })
  out.set("tailwind/kit.css", { src: `${ADD_FILES}tailwind/kit.css`, text: await readFile(KIT_CSS, "utf8") })
  out.set("dither-kit.css", { src: "kit/dither-kit.css", text: await buildKitCss() })
  const twin = (await readdir(TWIN, { recursive: true })).map((f) => f.split("\\").join("/"))
  for (const f of twin.filter((f) => /\.tsx?$/.test(f))) {
    const text = relativeKit(await readFile(join(TWIN, f), "utf8"), f.split("/").length - 1)
    if (/["']@dither-ui\//.test(text))
      throw new Error(`stylex/${f} imports a package of the workspace the copy cannot hold`)
    out.set(`stylex/${f}`, { src: `${ADD_FILES}stylex/${f}`, text })
  }
  return out
}

/** The manifest and every file the site serves for the add command that
 * nothing else serves, by its path in the build. */
export async function addFileList(): Promise<Record<string, string>> {
  const copy = await copyFiles()
  const paths = new Set(copy.keys())
  const INDEX: Record<AddLayer, string> = { solid: "solid/index.ts", stylex: "stylex/index.ts" }
  const indexes = new Set(Object.values(INDEX))

  const files: AddManifest["files"] = {}
  for (const [path, { src, text }] of [...copy].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (indexes.has(path)) continue
    const imports = new Set<string>()
    const packages = new Set<string>()
    for (const spec of specifiers(path, text)) {
      if (!spec.startsWith(".")) {
        packages.add(packageOf(spec))
        continue
      }
      const file = resolveIn(spec, path, paths)
      if (!file || indexes.has(file)) throw new Error(`${path}: ${spec} is no file a copy holds`)
      imports.add(file)
    }
    files[path] = { src, hash: sha(text), imports: [...imports].sort(), packages: [...packages].sort() }
  }

  const closure = (...start: string[]) => {
    const seen = new Set<string>()
    const todo = [...start]
    while (todo.length) {
      const f = todo.pop()!
      if (seen.has(f)) continue
      seen.add(f)
      todo.push(...files[f].imports)
    }
    return [...seen].sort()
  }

  const api = closure("engine/api.ts")
  const index = {} as AddManifest["index"]
  const components: AddManifest["components"] = {}
  for (const layer of ["solid", "stylex"] as const) {
    const statements = statementsOf(copy.get(INDEX[layer])!.text, INDEX[layer], paths)
    index[layer] = { path: INDEX[layer], statements: statements.map(({ file, text }) => ({ file, text })) }
    for (const s of statements)
      for (const name of s.names)
        if (isComponentName(name) && s.file.startsWith(`${layer}/`))
          (components[name] ??= {})[layer] = closure(s.file).filter((f) => !api.includes(f))
  }

  const theme = closure("engine/theme.css", "engine/base.css")
  const stylings: AddManifest["stylings"] = {
    tailwind: { layer: "solid", base: [...api, ...closure("tailwind/kit.css")], sheets: ["tailwind/kit.css"] },
    css: { layer: "solid", base: [...api, "dither-kit.css"], sheets: ["dither-kit.css"] },
    modules: { layer: "solid", base: [...api, "dither-kit.css"], sheets: ["dither-kit.css"] },
    stylex: { layer: "stylex", base: [...api, ...theme], sheets: ["engine/theme.css", "engine/base.css"] },
  }
  const version = sha(
    Object.entries(files)
      .map(([p, f]) => `${p} ${f.hash}`)
      .join("\n"),
  ).slice(0, 16)
  const manifest: AddManifest = { version, stylings, files, index, components }

  const out: Record<string, string> = {
    [ADD_MANIFEST]: JSON.stringify(manifest),
    [ADD_FILE]: await readFile(SCRIPT, "utf8"),
  }
  for (const f of copy.values()) if (f.src.startsWith(ADD_FILES) || f.src === "kit/dither-kit.css") out[f.src] = f.text
  return out
}

const TYPES: Record<string, string> = {
  json: "application/json",
  mjs: "text/javascript",
  css: "text/css; charset=utf-8",
}

export function kitAdd(): Plugin {
  let base = "/"
  return {
    name: "kit-add",
    // ahead of the app's own handler, which answers every address in dev
    enforce: "pre",
    configResolved(config) {
      base = config.base
    },
    configureServer(server) {
      // One list for every request of a run (the script asks for each file
      // at once), made again once a file the dev server watches changes.
      let list: Promise<Record<string, string>> | null = null
      server.watcher.on("change", () => (list = null))
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? "").split("?")[0]
        const path = url.startsWith(base) ? url.slice(base.length) : ""
        if (!path.startsWith("add/") && path !== "kit/dither-kit.css") return next()
        const body = (await (list ??= addFileList()))[path]
        if (body === undefined) return next()
        res.setHeader("Content-Type", TYPES[path.split(".").pop()!] ?? "text/plain; charset=utf-8")
        res.end(body)
      })
    },
    async generateBundle() {
      if (this.environment.name !== "client") return
      for (const [fileName, source] of Object.entries(await addFileList()))
        this.emitFile({ type: "asset", fileName, source })
    },
  }
}
