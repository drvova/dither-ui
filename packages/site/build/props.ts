// What each of the kit's components takes, read off its own props type by
// the TypeScript compiler: one row a prop, in the order the type declares
// them, for the docs' API tables (`kitTable`, `pages/docs/PropsTable.tsx`).
// A row's type is the prop's `@docs` tag, the type as a reader reads it,
// or else its declared type (a kit alias of a union of literals spelled
// out); its default is its `@default` tag, or else what the component
// hands `mergeProps` for it. Only what the kit declares is a
// row (a `<button>`'s every attribute is the platform's), `children`
// included where the kit types it. A docs pack imports a component's rows
// as `virtual:dither-props/<Component>`, so each table loads with its
// pack, never with the landing.
import { createRequire } from "node:module"
import { dirname } from "node:path"
import ts from "typescript"
import type { Plugin, ViteDevServer } from "vite"
import type { KitProps, PropRow } from "../src/pages/docs/PropsTable.tsx"

/** The kit's Solid index, and the source folder whose declarations are the kit's. */
const KIT_INDEX = createRequire(import.meta.url).resolve("@dither-ui/kit/solid/index.ts")
const KIT_SRC = `${dirname(dirname(KIT_INDEX))}/`

/** What the kit is compiled with: the repository's settings, as far as a
 * props type reads them. */
const OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.Preserve,
  jsxImportSource: "solid-js",
  allowImportingTsExtensions: true,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  types: [],
}

const flat = (text: string) => text.replace(/\s+/g, " ").trim()

/** A tag's words on one line (a long one wraps in the source), an `@` in
 * them escaped as TSDoc does (`\@container`). */
function tag(decl: ts.Node, name: string): string | undefined {
  const found = ts.getJSDocTags(decl).find((t) => t.tagName.text === name)
  if (!found) return undefined
  const words = typeof found.comment === "string" ? found.comment : (ts.getTextOfJSDocComment(found.comment) ?? "")
  return flat(words).replace(/\\@/g, "@")
}

/** A declared type as written, a kit alias of a union of literals (`DitherRenderMode`)
 * spelled out as its members. */
function written(node: ts.TypeNode, checker: ts.TypeChecker): string {
  if (ts.isTypeReferenceNode(node) && !node.typeArguments) {
    const symbol = checker.getSymbolAtLocation(node.typeName)
    const target = symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
    const alias = target?.declarations?.find(ts.isTypeAliasDeclaration)
    if (
      alias &&
      alias.getSourceFile().fileName.startsWith(KIT_SRC) &&
      ts.isUnionTypeNode(alias.type) &&
      alias.type.types.every(ts.isLiteralTypeNode)
    )
      return alias.type.types.map((t) => t.getText()).join(" | ")
  }
  return flat(node.getText()).replace(/^\| /, "")
}

/** The defaults a component merges under its props: the literal its body
 * hands `mergeProps` first, each value as written (`"live" as
 * DitherRenderMode` reads `"live"`). */
function mergedDefaults(component: ts.Symbol): Map<string, string> {
  const out = new Map<string, string>()
  const visit = (node: ts.Node): void => {
    if (out.size) return
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "mergeProps" &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      for (const p of node.arguments[0].properties) {
        if (!ts.isPropertyAssignment(p) || !(ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) continue
        let value = p.initializer
        while (ts.isAsExpression(value) || ts.isSatisfiesExpression(value)) value = value.expression
        out.set(p.name.text, flat(value.getText()))
      }
      return
    }
    ts.forEachChild(node, visit)
  }
  const decl = component.valueDeclaration
  if (decl && decl.getSourceFile().fileName.startsWith(KIT_SRC)) visit(decl)
  return out
}

/** A prop's row, from the first of its declarations the kit makes. */
function row(
  name: string,
  decl: ts.Declaration,
  symbol: ts.Symbol,
  merged: ReadonlyMap<string, string>,
  checker: ts.TypeChecker,
): PropRow {
  const declared =
    (ts.isPropertySignature(decl) || ts.isPropertyDeclaration(decl)) && decl.type
      ? written(decl.type, checker)
      : checker.typeToString(checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(symbol, decl)))
  return { prop: name, type: tag(decl, "docs") ?? declared, default: tag(decl, "default") ?? merged.get(name) ?? "" }
}

/** Every component the kit's Solid index exports, with its props' rows.
 * `sources` stands in for files on disk (a spec's edit of a kit file). */
export function kitPropRows(sources: ReadonlyMap<string, string> = new Map()): Map<string, KitProps> {
  const host = ts.createCompilerHost(OPTIONS, true)
  const read = host.getSourceFile
  host.getSourceFile = (file, lang, ...rest) =>
    sources.has(file) ? ts.createSourceFile(file, sources.get(file)!, lang, true) : read(file, lang, ...rest)
  const program = ts.createProgram([KIT_INDEX], OPTIONS, host)
  const checker = program.getTypeChecker()
  const index = checker.getSymbolAtLocation(program.getSourceFile(KIT_INDEX)!)!
  const out = new Map<string, KitProps>()
  for (const exported of checker.getExportsOfModule(index)) {
    if (!/^[A-Z]/.test(exported.name)) continue
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
    if (!(symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Variable))) continue
    const [call] = checker.getTypeOfSymbol(symbol).getCallSignatures()
    if (!call) continue
    const rows = new Map<string, PropRow>()
    const merged = mergedDefaults(symbol)
    const param = call.parameters[0] && checker.getTypeOfSymbol(call.parameters[0])
    // a union of shapes takes what any of them does, in the order they say it
    for (const shape of !param ? [] : param.isUnion() ? param.types : [param])
      for (const prop of checker.getPropertiesOfType(checker.getApparentType(shape))) {
        const decl = prop.declarations?.find((d) => d.getSourceFile().fileName.startsWith(KIT_SRC))
        if (decl && !rows.has(prop.name)) rows.set(prop.name, row(prop.name, decl, prop, merged, checker))
      }
    out.set(exported.name, { of: exported.name, rows: [...rows.values()] })
  }
  return out
}

const ID = "virtual:dither-props/"

/** `virtual:dither-props/<Component>` for Vite: that component's rows as
 * a literal. A name the kit does not export fails the build. Read once a
 * process, again when a kit file changes under the dev server. */
export function kitProps(): Plugin {
  let rows: Map<string, KitProps> | undefined
  let server: ViteDevServer | undefined
  return {
    name: "dither-props",
    enforce: "pre",
    configureServer(dev) {
      server = dev
      dev.watcher.on("change", (file) => {
        if (!file.startsWith(KIT_SRC)) return
        rows = undefined
        for (const mod of dev.moduleGraph.idToModuleMap.values())
          if (mod.id?.startsWith(`\0${ID}`)) dev.moduleGraph.invalidateModule(mod)
      })
    },
    resolveId: (id) => (id.startsWith(ID) ? `\0${id}` : null),
    load(id) {
      if (!id.startsWith(`\0${ID}`)) return null
      const name = id.slice(ID.length + 1)
      rows ??= kitPropRows()
      const found = rows.get(name)
      if (!found) {
        const message = `${ID}${name}: the kit exports no component ${name}`
        if (server) server.config.logger.error(message)
        throw new Error(message)
      }
      return `export default ${JSON.stringify(found)}`
    },
  }
}
