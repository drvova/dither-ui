// What the docs specs read out of a docs source: its API tables (the
// `PropRow` rows handed to `PropsTable`), held to the Solid kit
// (`docs-api.spec.ts`).
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import ts from "typescript"

export const SITE = join(__dirname, "../..")
export const DOCS = join(SITE, "src/pages/docs")

export type Row = { prop: string; type: string; default: string }
/** One `<PropsTable rows={…} />`: the file, the expression it is handed and the rows that makes. */
export type Table = { file: string; key: string; rows: Row[] }

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sources(path) : path.endsWith(".tsx") ? [path] : []
  })

/** Every table the docs print, in the order the files hand them over. */
export function docsTables(): Table[] {
  const tables: Table[] = []
  for (const path of sources(DOCS)) {
    const text = readFileSync(path, "utf8")
    if (!text.includes("<PropsTable")) continue
    const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const consts = new Map<string, ts.Expression>()
    const declared = (node: ts.Node): void => {
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.name))
        consts.set(node.name.text, node.initializer)
      ts.forEachChild(node, declared)
    }
    declared(source)
    // the rows are literals: strings in objects in arrays, spread or picked by key
    const value = (node: ts.Expression): unknown => {
      if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node))
        return value(node.expression)
      if (ts.isStringLiteralLike(node)) return node.text
      if (ts.isArrayLiteralExpression(node))
        return node.elements.flatMap((el) =>
          ts.isSpreadElement(el) ? (value(el.expression) as unknown[]) : [value(el)],
        )
      if (ts.isObjectLiteralExpression(node)) {
        const object: Record<string, unknown> = {}
        for (const p of node.properties) {
          if (!ts.isPropertyAssignment(p)) throw new Error(`${path}: ${p.getText()} is not a plain property`)
          object[ts.isStringLiteral(p.name) || ts.isIdentifier(p.name) ? p.name.text : p.name.getText()] = value(
            p.initializer,
          )
        }
        return object
      }
      if (ts.isIdentifier(node) && consts.has(node.text)) return value(consts.get(node.text)!)
      if (ts.isPropertyAccessExpression(node))
        return (value(node.expression) as Record<string, unknown>)[node.name.text]
      if (ts.isElementAccessExpression(node))
        return (value(node.expression) as Record<string, unknown>)[value(node.argumentExpression) as string]
      throw new Error(`${path}: a table is not a literal at ${node.getText().slice(0, 60)}`)
    }
    const used = (node: ts.Node): void => {
      if (ts.isJsxSelfClosingElement(node) && node.tagName.getText() === "PropsTable") {
        const rows = node.attributes.properties.find(
          (a): a is ts.JsxAttribute => ts.isJsxAttribute(a) && a.name.getText() === "rows",
        )
        const handed =
          rows?.initializer && ts.isJsxExpression(rows.initializer) ? rows.initializer.expression : undefined
        if (!handed) throw new Error(`${path}: a PropsTable without rows`)
        tables.push({
          file: relative(DOCS, path),
          // `API.popover`, `API["heat-trail"]` → the key; a bare `API` stays
          key: handed.getText().replace(/^\w+(?:\.|\[")|"\]$/g, ""),
          rows: value(handed) as Row[],
        })
      }
      ts.forEachChild(node, used)
    }
    used(source)
  }
  return tables
}

/** The props each of the kit's components takes: the properties of its
 * function's own parameter (its exported `<Name>Props`), by the checker. */
export function kitProps(): Map<string, Set<string>> {
  const config = ts.getParsedCommandLineOfConfigFile(
    join(SITE, "tsconfig.json"),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (d) => {
        throw new Error(ts.flattenDiagnosticMessageText(d.messageText, "\n"))
      },
    },
  )!
  const entry = join(SITE, "../dither-kit/solid/index.ts")
  const program = ts.createProgram([entry], { ...config.options, noEmit: true })
  const checker = program.getTypeChecker()
  const props = new Map<string, Set<string>>()
  for (const exported of checker.getExportsOfModule(checker.getSymbolAtLocation(program.getSourceFile(entry)!)!)) {
    if (!/^[A-Z]/.test(exported.name)) continue
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
    if (!(symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Variable))) continue
    const [call] = checker.getTypeOfSymbol(symbol).getCallSignatures()
    if (!call) continue
    const names = new Set<string>()
    if (call.parameters[0]) {
      const type = checker.getTypeOfSymbol(call.parameters[0])
      // a union of shapes takes what any of them does
      for (const shape of type.isUnion() ? type.types : [type])
        for (const p of checker.getPropertiesOfType(checker.getApparentType(shape))) names.add(p.name)
    }
    props.set(exported.name, names)
  }
  return props
}
