// The docs' examples as one catalogue: each example module
// (`src/pages/docs/<pack>/examples/<id>.tsx`) read by the TypeScript
// compiler, its `meta` (`defineExample`, `@/shared/lib/example`) as data,
// resolved against the kit's props types (`eachKitProp`, `props.ts`: a
// setting's kind from its prop's type, a select's options from its union
// of literals, its value from the meta's `demo`, else what the example hands
// the prop, else the kit's default; a `story` setting, which no prop takes,
// as the meta says it) into the Studio row it makes. Served
// as `virtual-dither-catalog` (the entries, which the Studio's registry
// reads) and `virtual-dither-catalog/sources` (each example's text, which
// the code export reads), so neither loads with a page that does not ask.
// The text a reader copies is the module without its `meta` and that
// import (`stripMeta`): this plugin serves every example's `?raw` so.
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { RsbuildPlugin, Rspack } from "rstack/app"
import ts from "typescript"
import type { Plugin, ViteDevServer } from "vite"
import type { CatalogEntry, PropSpec } from "../src/shared/lib/example.ts"
import { eachKitProp, kitDefault, type KitProp } from "./props.ts"

const DOCS = join(import.meta.dirname, "../src/pages/docs")
/** An example module's path: what a reader copies. */
const EXAMPLE = /\/pages\/docs\/([\w-]+)\/examples\/([\w-]+)\.tsx$/
/** The module the meta's helper comes from, stripped with the meta. */
const META_MODULE = "@/shared/lib/example"

const ID = "virtual-dither-catalog"
const SOURCES_ID = `${ID}/sources`

/** Every example module, by the folders the docs keep them in. */
function exampleFiles(): string[] {
  return readdirSync(DOCS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => {
      const dir = join(DOCS, d.name, "examples")
      try {
        return readdirSync(dir)
          .filter((f) => f.endsWith(".tsx"))
          .map((f) => join(dir, f))
      } catch {
        return []
      }
    })
    .filter((f) => EXAMPLE.test(f))
    .sort()
}

const parse = (file: string, text: string) =>
  ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

const isMeta = (s: ts.Statement): s is ts.VariableStatement =>
  ts.isVariableStatement(s) &&
  !!s.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
  s.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && d.name.text === "meta")
const isMetaImport = (s: ts.Statement) =>
  ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier) && s.moduleSpecifier.text === META_MODULE

/** The example as a reader copies it: the module without its `meta` and
 * the import of its helper, each removed with the space before it, so the
 * rest stands byte for byte as written. */
export function stripMeta(text: string, file = "example.tsx"): string {
  const cuts = parse(file, text)
    .statements.filter((s) => isMeta(s) || isMetaImport(s))
    .map((s) => [s.getFullStart(), s.getEnd()] as const)
  let out = text
  for (const [from, to] of cuts.reverse()) out = out.slice(0, from) + out.slice(to)
  return out
}

/** A literal as its value, or `undefined` for anything that is not one
 * (an identifier, a call). */
function literal(node: ts.Expression): unknown {
  while (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node))
    node = node.expression
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  )
    return -Number(node.operand.text)
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false
  if (node.kind === ts.SyntaxKind.NullKeyword) return null
  if (ts.isArrayLiteralExpression(node)) {
    const items = node.elements.map(literal)
    return items.includes(undefined) ? undefined : items
  }
  if (ts.isObjectLiteralExpression(node)) {
    const out: Record<string, unknown> = {}
    for (const p of node.properties) {
      if (!ts.isPropertyAssignment(p) || !(ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) return undefined
      const v = literal(p.initializer)
      if (v === undefined) return undefined
      out[p.name.text] = v
    }
    return out
  }
  return undefined
}

/** A setting as the meta writes it. */
type Control = {
  kind?: PropSpec["kind"]
  min?: number
  max?: number
  step?: number
  options?: string[]
  demo?: unknown
}

type Meta = {
  component: string
  title: string
  studio?: {
    group: NonNullable<CatalogEntry["studio"]>["group"]
    frame: { w: number; h: number }
    controls: Record<string, Control>
    story?: Record<string, Control>
    slot?: string
    model?: { demo?: unknown; prop?: string; event?: string }
    field?: true
  }
  states?: Record<string, unknown>[]
}

/** The `meta` an example exports, as data: its component by name, every
 * other value a literal (the build reads it, nothing runs it). */
function readMeta(file: string, source: ts.SourceFile): Meta | null {
  const statement = source.statements.find(isMeta)
  if (!statement) return null
  const init = statement.declarationList.declarations[0].initializer
  const fail = (why: string): never => {
    throw new Error(`${file}: meta ${why}`)
  }
  if (
    !init ||
    !ts.isCallExpression(init) ||
    !ts.isIdentifier(init.expression) ||
    init.expression.text !== "defineExample"
  )
    return fail("is not defineExample({ … })")
  const arg = init.arguments[0]
  if (!arg || !ts.isObjectLiteralExpression(arg)) return fail("is not an object")
  const component = arg.properties.find(
    (p): p is ts.PropertyAssignment =>
      ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === "component",
  )
  // a generic component is named with its type argument (`DitherCardStack<string>`)
  const named =
    component && ts.isExpressionWithTypeArguments(component.initializer)
      ? component.initializer.expression
      : component?.initializer
  if (!named || !ts.isIdentifier(named)) return fail("names no component")
  const rest = ts.factory.updateObjectLiteralExpression(
    arg,
    arg.properties.filter((p) => p !== component),
  )
  const data = literal(rest)
  if (data === undefined) return fail("holds a value that is not a literal")
  return { ...(data as Omit<Meta, "component">), component: named.text }
}

/** What the example hands its component: the props it gives as literals,
 * the values it binds through a signal, its children's text, and whether
 * the example is the component alone, every prop a literal or a binding. */
type Handed = {
  attrs: Map<string, unknown>
  /** A prop bound to a signal, with the signal's first value. */
  bound: Map<string, unknown>
  /** The listeners it hands a signal's setter. */
  setters: Set<string>
  children: string | undefined
  alone: boolean
}

function readHanded(source: ts.SourceFile, component: string): Handed | null {
  const fn = source.statements.find(
    (s): s is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(s) && !!s.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword),
  )
  if (!fn?.body) return null
  const signals = new Map<string, unknown>()
  const setters = new Set<string>()
  let others = false
  for (const s of fn.body.statements) {
    const decl = ts.isVariableStatement(s) ? s.declarationList.declarations[0] : undefined
    if (
      decl &&
      ts.isArrayBindingPattern(decl.name) &&
      decl.initializer &&
      ts.isCallExpression(decl.initializer) &&
      ts.isIdentifier(decl.initializer.expression) &&
      decl.initializer.expression.text === "createSignal"
    ) {
      const [get, set] = decl.name.elements
      if (get && ts.isBindingElement(get) && ts.isIdentifier(get.name))
        signals.set(get.name.text, decl.initializer.arguments[0] ? literal(decl.initializer.arguments[0]) : undefined)
      if (set && ts.isBindingElement(set) && ts.isIdentifier(set.name)) setters.add(set.name.text)
    } else if (!ts.isReturnStatement(s)) others = true
  }
  let found: ts.JsxElement | ts.JsxSelfClosingElement | undefined
  const visit = (n: ts.Node): void => {
    if (found) return
    const opening = ts.isJsxElement(n) ? n.openingElement : ts.isJsxSelfClosingElement(n) ? n : undefined
    if (opening && opening.tagName.getText() === component) found = n as ts.JsxElement | ts.JsxSelfClosingElement
    else ts.forEachChild(n, visit)
  }
  visit(fn.body)
  if (!found) return null
  const opening = ts.isJsxElement(found) ? found.openingElement : found
  const out: Handed = { attrs: new Map(), bound: new Map(), setters: new Set(), children: undefined, alone: !others }
  for (const a of opening.attributes.properties) {
    if (!ts.isJsxAttribute(a) || !ts.isIdentifier(a.name)) {
      out.alone = false
      continue
    }
    const name = a.name.text
    const init = a.initializer
    if (!init) out.attrs.set(name, true)
    else if (ts.isStringLiteral(init)) out.attrs.set(name, init.text)
    else if (ts.isJsxExpression(init) && init.expression) {
      const e = init.expression
      const value = literal(e)
      if (value !== undefined) out.attrs.set(name, value)
      else if (ts.isCallExpression(e) && ts.isIdentifier(e.expression) && signals.has(e.expression.text))
        out.bound.set(name, signals.get(e.expression.text))
      else if (ts.isIdentifier(e) && setters.has(e.text)) out.setters.add(name)
      else out.alone = false
    } else out.alone = false
  }
  if (ts.isJsxElement(found)) {
    const kids = found.children.filter((k) => !(ts.isJsxText(k) && k.containsOnlyTriviaWhiteSpaces))
    if (kids.every(ts.isJsxText))
      out.children = kids
        .map((k) => k.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    else out.alone = false
  }
  const ret = fn.body.statements.find(ts.isReturnStatement)?.expression
  let root = ret
  while (root && ts.isParenthesizedExpression(root)) root = root.expression
  if (root !== found) out.alone = false
  return out
}

/** A setting's kind and options, read off its prop's type: `PixelColor`
 * a colour, a union of string literals a select of them, a string text,
 * a list of strings a list. */
function kindOf({ decl, symbol, checker }: KitProp): { kind: PropSpec["kind"]; options?: string[] } | null {
  if (
    (ts.isPropertySignature(decl) || ts.isPropertyDeclaration(decl)) &&
    decl.type &&
    /\bPixelColor\b/.test(decl.type.getText())
  )
    return { kind: "color" }
  const type = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(symbol, decl))
  const parts = type.isUnion() ? type.types : [type]
  if (parts.every((t) => t.flags & ts.TypeFlags.BooleanLiteral) || type.flags & ts.TypeFlags.Boolean)
    return { kind: "boolean" }
  if (parts.length === 1 && type.flags & ts.TypeFlags.Number) return { kind: "number" }
  if (parts.length === 1 && type.flags & ts.TypeFlags.String) return { kind: "text" }
  if (parts.every((t) => t.isStringLiteral()))
    return { kind: "select", options: parts.map((t) => (t as ts.StringLiteralType).value) }
  const item =
    parts.length === 1 && checker.isArrayType(type) ? checker.getIndexTypeOfType(type, ts.IndexKind.Number) : undefined
  if (item && item.flags & ts.TypeFlags.String) return { kind: "list" }
  return null
}

/** A default as written (`"blue"`, `4`, `false`), as its value. */
function written(text: string): unknown {
  try {
    return JSON.parse(text.replace(/^'(.*)'$/, '"$1"'))
  } catch {
    return undefined
  }
}

type PropInfo = { kind: ReturnType<typeof kindOf>; def: unknown }

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** The entry an example makes, its Studio row resolved. */
function entryOf(
  id: string,
  file: string,
  meta: Meta,
  handed: Handed | null,
  kit: Map<string, Map<string, PropInfo>>,
): CatalogEntry {
  const props = kit.get(meta.component)
  const fail = (why: string): never => {
    throw new Error(`${file}: ${why}`)
  }
  if (!props) fail(`the kit exports no component ${meta.component}`)
  const studio = meta.studio
  if (!studio) return { id, component: meta.component, title: meta.title, studio: null, states: meta.states ?? [] }
  const attrs = handed?.attrs ?? new Map<string, unknown>()
  let faithful = !!handed?.alone
  const spec = (key: string, kind: PropSpec["kind"], c: Control, def: unknown, options?: string[]): PropSpec => {
    if (kind === "number") return { key, kind, def: def as number, min: c.min, max: c.max, step: c.step }
    if (kind === "select") return { key, kind, def: def as string, options: c.options ?? options ?? [] }
    return { key, kind, def } as PropSpec
  }
  // a setting no prop takes is read by the row's code: a new frame is not the example
  const story = Object.entries(studio.story ?? {}).map(([key, c]): PropSpec => {
    if (props!.has(key)) fail(`studio.story.${key} is a prop of ${meta.component}: give it in controls`)
    if (!c.kind || !("demo" in c)) fail(`studio.story.${key}: give its kind and its demo`)
    faithful = false
    return spec(key, c.kind!, c, c.demo)
  })
  const specs = Object.entries(studio.controls).map(([key, c]): PropSpec => {
    const info = props!.get(key) ?? fail(`studio.controls.${key} is not a prop of ${meta.component}`)
    const kind = c.kind ?? info.kind?.kind ?? fail(`studio.controls.${key}: its type says no kind; give one`)
    const handedValue = attrs.get(key)
    const def = "demo" in c ? c.demo : handedValue !== undefined ? handedValue : info.def
    if (def === undefined) fail(`studio.controls.${key}: no value on a new frame; give a demo`)
    if (!same(def, handedValue !== undefined ? handedValue : info.def)) faithful = false
    return spec(key, kind, c, def, info.kind?.options)
  })
  const modelProp = studio.model?.prop ?? "modelValue"
  const modelDef = studio.model && "demo" in studio.model ? studio.model.demo : handed?.bound.get(modelProp)
  if (!same(modelDef, handed?.bound.get(modelProp))) faithful = false
  const model =
    modelDef === undefined
      ? undefined
      : {
          def: modelDef,
          ...(studio.model?.prop ? { prop: studio.model.prop } : {}),
          ...(studio.model?.event ? { event: studio.model.event } : {}),
        }
  const slotText = studio.slot ?? (handed?.children || undefined)
  if (slotText !== (handed?.children || undefined)) faithful = false
  // a prop the example hands that no setting carries is one a new frame lacks
  const carried = new Set([...Object.keys(studio.controls), modelProp])
  if ([...attrs.keys(), ...(handed?.bound.keys() ?? [])].some((k) => !carried.has(k))) faithful = false
  return {
    id,
    component: meta.component,
    title: meta.title,
    studio: {
      group: studio.group,
      frame: studio.frame,
      props: specs,
      ...(story.length ? { story } : {}),
      ...(slotText !== undefined ? { slotText } : {}),
      ...(model ? { model } : {}),
      ...(studio.field ? { field: true as const } : {}),
      faithful,
    },
    states: meta.states ?? [],
  }
}

/** Every example with a `meta`, and every example's text as a reader copies it. */
export function readCatalog(): { entries: CatalogEntry[]; sources: Record<string, string> } {
  const kit = new Map(
    [...eachKitProp((p) => [p.name, { kind: kindOf(p), def: written(kitDefault(p)) }] as const)].map(
      ([name, rows]) => [name, new Map(rows)] as const,
    ),
  )
  const entries: CatalogEntry[] = []
  const sources: Record<string, string> = {}
  for (const file of exampleFiles()) {
    const [, pack, name] = EXAMPLE.exec(file)!
    const id = `${pack}/${name}`
    const text = readFileSync(file, "utf8")
    sources[id] = stripMeta(text, file)
    const source = parse(file, text)
    const meta = readMeta(file, source)
    if (meta) entries.push(entryOf(id, file, meta, readHanded(source, meta.component), kit))
  }
  return { entries, sources }
}

const modules = (c: ReturnType<typeof readCatalog>) => ({
  [ID]: `export const CATALOG = ${JSON.stringify(c.entries)}`,
  [SOURCES_ID]: `export default ${JSON.stringify(c.sources)}`,
})

/** The catalogue for Vite (the build, dev, the component specs), and every
 * example's `?raw` as a reader copies it. Read once a process, again when
 * an example or a kit file changes under the dev server. */
export function exampleCatalog(): Plugin {
  let read: Record<string, string> | undefined
  let server: ViteDevServer | undefined
  const kitDir = dirname(dirname(import.meta.resolve("@dither-ui/kit/solid/index.ts").replace(/^file:\/\//, "")))
  return {
    name: "dither-catalog",
    enforce: "pre",
    configureServer(dev) {
      server = dev
      dev.watcher.on("change", (file) => {
        if (!EXAMPLE.test(file) && !file.startsWith(kitDir)) return
        read = undefined
        for (const id of [ID, SOURCES_ID]) {
          const mod = dev.moduleGraph.getModuleById(`\0${id}`)
          if (mod) dev.moduleGraph.invalidateModule(mod)
        }
      })
    },
    resolveId: (id) => (id === ID || id === SOURCES_ID ? `\0${id}` : null),
    load(id) {
      if (id === `\0${ID}` || id === `\0${SOURCES_ID}`) {
        try {
          read ??= modules(readCatalog())
        } catch (e) {
          server?.config.logger.error(String(e))
          throw e
        }
        return read[id.slice(1)]
      }
      const [file, query] = id.split("?")
      if (query !== "raw" || !EXAMPLE.test(file)) return null
      this.addWatchFile(file)
      return `export default ${JSON.stringify(stripMeta(readFileSync(file, "utf8"), file))}`
    },
  }
}

/** The catalogue for Rsbuild (the workspace's `rs test`): the same modules,
 * read once a run. */
export function exampleCatalogRsbuild(): RsbuildPlugin {
  const dir = join(import.meta.dirname, ".catalog")
  const files = { [ID]: join(dir, "catalog.js"), [SOURCES_ID]: join(dir, "sources.js") }
  return {
    name: "dither-catalog",
    setup(api) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) =>
        mergeRsbuildConfig(config, {
          resolve: { alias: { [`${ID}$`]: files[ID], [`${SOURCES_ID}$`]: files[SOURCES_ID] } },
        }),
      )
      api.modifyRspackConfig((_, { rspack, appendPlugins }) => {
        const read = modules(readCatalog())
        appendPlugins([
          new rspack.experiments.VirtualModulesPlugin({ [files[ID]]: read[ID], [files[SOURCES_ID]]: read[SOURCES_ID] }),
        ] as Rspack.RspackPluginInstance[])
      })
    },
  }
}
