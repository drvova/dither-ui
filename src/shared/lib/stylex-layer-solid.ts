// Node-side only (tests/stylex-layer-solid.spec.ts): the Solid kit's StyleX
// layer (`dither-kit/solid-stylex/`), written from its Tailwind-classed
// layer (`dither-kit/solid/`) on the class-to-StyleX core
// (`stylex-core.ts`). Every class string a Solid file sets (a JSX `class`,
// a `classList`, a `cn()` argument, a template literal of classes, and the
// constants, records, memos and functions those reach) becomes a named style
// in one `stylex.create` per file, at module level. An element's own style
// is spread (`{...stylex.props(styles.x)}`), a merged one goes through the
// layer's `cn`; a component that takes `class` takes `xstyle` too, and kit
// components hand each other styles through it. Stylesheets and the runtime
// stay the Solid layer's (imported from `../solid/`), save a runtime file
// that writes classes. What it cannot carry it refuses, by file and line:
// a refused file is not written.
import ts from "typescript"
import { baseName, Names, stylexText, type UtilityMap } from "./restyle-rewrite"
import {
  CLASS_TYPE,
  type Context,
  convert,
  type Refuse,
  returnsOf,
  Script,
  splice,
  unwrap,
  walk,
  XSTYLE_TYPE,
} from "./stylex-core"

/** What the generator could not carry: the file is left out of the layer. */
export type Refusal = { file: string; line: number; kind: string; message: string }

export interface SolidStylexLayer {
  /** The generated files, by name inside the layer. */
  files: Map<string, string>
  /** Per file, the class names kept as class names (no utility stands for them). */
  kept: Map<string, string[]>
  /** Per file, inputs that change nothing in the literal they are in. */
  inert: Map<string, string[]>
  /** Every construct refused, with its place. */
  refused: Refusal[]
  /** Per file, the components (not the kit's own) handed a class string. */
  passed: Map<string, string[]>
  /** Per file, what stood in class position that the walk does not read
   * (a prop's value, a call's result): class names a consumer gives. */
  opaque: Map<string, string[]>
}

/** Files of the layer written by hand. */
export const HAND_WRITTEN = new Set(["lib.ts"])

/** The Tailwind layer's class constants, generated into the layer beside
 * the components (`CONTROL`, `CONTROL_BUTTON`, `POPOVER`). */
export const CONTROL_FILE = "control.ts"

const BY = "src/shared/lib/stylex-layer-solid.ts"
const header = (source: string) =>
  `// Generated from ${source} by ${BY}: edit that\n// file, then npx rs test -u tests/stylex-layer-solid.spec.ts\n`

const LIB_MARK = "/*@dither-lib*/"
const RUNTIME = "runtime/"
const isCode = (name: string) => /\.tsx?$/.test(name)

/** What the layer knows about its files before it writes one. */
interface Env {
  map: UtilityMap
  /** Component files that take `class` (and so `xstyle`), without extension. */
  takes: Set<string>
  /** Runtime files the layer writes itself (they write classes). */
  runtime: Set<string>
  /** Files of the Solid layer, by name. */
  files: Map<string, string>
}

/** Where a file's import lands once the file stands in the StyleX layer. */
function importTarget(spec: string, name: string, env: Env): string | null {
  const deep = name.startsWith(RUNTIME)
  const up = deep ? "../" : "./"
  if (spec === `${deep ? "../../" : "../"}tailwind/lib`) return `${up}lib`
  if (spec === `${deep ? "../../" : "../"}tailwind/control`) return `${up}control`
  if (/(^|\/)tailwind\//.test(spec)) return null
  const local = deep ? spec.match(/^\.\/([\w-]+)$/) : spec.match(/^\.\/runtime\/([\w-]+)$/)
  if (local) {
    const file = [`${RUNTIME}${local[1]}.tsx`, `${RUNTIME}${local[1]}.ts`].find((f) => env.files.has(f))
    if (file && !env.runtime.has(file)) return `${deep ? "../../" : "../"}solid/runtime/${local[1]}`
    return spec
  }
  if (!deep && /^\.\/[\w-]+\.css$/.test(spec)) return `../solid/${spec.slice(2)}`
  return spec
}

/** Utilities spelled as the CSS keyword they set: alone, a value. */
const CSS_WORDS = new Set(["ease-in", "ease-out", "ease-in-out"])

/** `[a, b].filter(Boolean).join(" ")`: the array, a class list by hand. */
function joined(n: ts.Expression): ts.ArrayLiteralExpression | null {
  if (!ts.isCallExpression(n) || !ts.isPropertyAccessExpression(n.expression) || n.expression.name.text !== "join")
    return null
  const filter = n.expression.expression
  if (!ts.isCallExpression(filter) || !ts.isPropertyAccessExpression(filter.expression)) return null
  if (filter.expression.name.text !== "filter" || filter.arguments[0]?.getText() !== "Boolean") return null
  const list = filter.expression.expression
  return ts.isArrayLiteralExpression(list) ? list : null
}

const kindOf = (name: string) => (name.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)

const isCn = (n: ts.Node): n is ts.CallExpression => ts.isCallExpression(n) && n.expression.getText() === "cn"

const lineOf = (node: ts.Node) => {
  const sf = node.getSourceFile()
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
}

/** A literal that reads as Tailwind classes: every word a utility, and
 * either several of them or one no plain value is spelled like. */
function readsAsClasses(text: string, map: UtilityMap): boolean {
  const tokens = text.split(/\s+/).filter(Boolean)
  if (tokens.length === 1 && CSS_WORDS.has(tokens[0])) return false
  if (!tokens.length || tokens.length > 60) return false
  const shaped = tokens.filter((t) => !!map.rules[t] && /[-:[]/.test(t)).length
  if (tokens.every((t) => !!map.rules[t])) return tokens.length > 1 || shaped > 0
  return shaped > 1
}

function solidFile(
  name: string,
  text: string,
  source: string,
  ctx: Context,
  env: Env,
  exported: Set<string>,
  out: SolidStylexLayer,
) {
  const refused: Refusal[] = []
  const refuse: Refuse = (node, kind, message) => refused.push({ file: source, line: lineOf(node), kind, message })
  const s = new Script(name, text, 0, refuse, kindOf(name))
  const holders = new Set(exported)
  const passed = new Set<string>()
  const handled = new Set<ts.Node>()
  const opaque = new Set<string>()
  const walking = Object.assign(s.walking, {
    holders,
    other: (n: ts.Expression) => {
      const k = n.kind
      const empty =
        k === ts.SyntaxKind.NullKeyword ||
        k === ts.SyntaxKind.FalseKeyword ||
        k === ts.SyntaxKind.TrueKeyword ||
        ts.isNumericLiteral(n) ||
        n.getText() === "undefined"
      if (!empty && n.getText() !== "props.class") opaque.add(n.getText())
    },
  })
  // What hands back a `cn()` string: merged once, it cannot merge again.
  const merged = new Set<string>()
  const returnsCn = (n: ts.Expression): boolean => {
    const e = unwrap(n)
    if (isCn(e)) return true
    if (ts.isCallExpression(e) && e.expression.getText() === "createMemo" && e.arguments[0])
      return returnsCn(e.arguments[0])
    if (ts.isArrowFunction(e) || ts.isFunctionExpression(e))
      return ts.isBlock(e.body) ? returnsOf(e.body).some(returnsCn) : returnsCn(e.body)
    return false
  }
  /** The holders and `cn()` calls in class position under `n`. */
  const reach = (n: ts.Expression) => {
    const found = { holders: new Set<string>(), calls: [] as ts.Expression[] }
    walk(
      n,
      {
        sites: [],
        holders: found.holders,
        refuse: () => {},
        enter: (e) => void (isCn(e) && found.calls.push(e)),
      },
      "",
      false,
    )
    return found
  }
  const twice = (n: ts.Expression, where: string) => {
    const found = reach(n)
    for (const c of found.calls)
      refuse(c, "cn() fed into a class list", `a \`cn()\` string ${where}: it would merge twice; write a list`)
    for (const h of found.holders)
      if (merged.has(h))
        refuse(n, "cn() fed into a class list", `${h}, a \`cn()\` string, ${where}: it would merge twice; write a list`)
  }
  let libImport: ts.ImportDeclaration | null = null

  // Imports: the layer's own lib and constants, the Solid layer's runtime
  // and stylesheets, the components beside this one.
  const components = new Map<string, string>()
  const specifier = (spec: ts.Expression, owner: ts.Node) => {
    if (!ts.isStringLiteral(spec)) return
    const to = importTarget(spec.text, name, env)
    if (to === null) return refuse(owner, "tailwind import", `imports ${spec.text}, a Tailwind-layer module`)
    if (/\/lib$/.test(to) && to !== spec.text && ts.isImportDeclaration(owner)) libImport = owner
    else if (to !== spec.text) s.edit(spec.getStart(), spec.getEnd(), JSON.stringify(to))
  }
  for (const st of s.sf.statements) {
    if (ts.isImportDeclaration(st)) {
      specifier(st.moduleSpecifier, st)
      const from = (st.moduleSpecifier as ts.StringLiteral).text
      const clause = st.importClause
      if (clause?.name && /^\.\/[\w-]+$/.test(from)) components.set(clause.name.text, `${from.slice(2)}.tsx`)
      const named = clause?.namedBindings
      // A chart module's exports are its root, under names.
      if (named && ts.isNamedImports(named) && env.files.has(`${from.slice(2)}.ts`) && /^\.\/[\w-]+$/.test(from))
        for (const e of named.elements)
          if (/^[A-Z]/.test(e.name.text)) components.set(e.name.text, `${from.slice(2)}.ts`)
    } else if (ts.isExportDeclaration(st) && st.moduleSpecifier) specifier(st.moduleSpecifier, st)
  }
  const takesStyle = (tag: string) => {
    const file = components.get(tag)
    return !!file && env.takes.has(file)
  }

  // JSX: each element's `class` and `classList` become one attribute.
  let usesCn = false
  const element = (el: ts.JsxOpeningLikeElement) => {
    const tag = el.tagName.getText()
    const attrs = el.attributes.properties
    const named = (n: string) => attrs.find((a): a is ts.JsxAttribute => ts.isJsxAttribute(a) && a.name.getText() === n)
    const cls = named("class")
    const list = named("classList")
    if (named("className")) refuse(el, "className", "`className` on an element; Solid's is `class`")
    if (!cls && !list) return
    const intrinsic = /^[a-z]/.test(tag) && !tag.includes(".")
    const styled = !intrinsic && takesStyle(tag)
    const spread = attrs.some(ts.isJsxSpreadAttribute)

    // `classList={{ "rotate-90": open() }}`: each entry a condition and its classes.
    const extra: string[] = []
    if (list) {
      const obj = list.initializer && ts.isJsxExpression(list.initializer) && list.initializer.expression
      if (!obj || !ts.isObjectLiteralExpression(obj))
        return refuse(list, "classList", "a `classList` that is not an object literal")
      for (const p of obj.properties) {
        if (ts.isShorthandPropertyAssignment(p)) {
          ctx.kept.add(p.name.text)
          extra.push(`${p.name.text} && ${JSON.stringify(p.name.text)}`)
        } else if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteralLike(p.name))) {
          handled.add(p.name)
          const style = convert(p.name.text, "", ctx, '"') ?? JSON.stringify(p.name.text)
          const cond = unwrap(p.initializer)
          const plain = ts.isIdentifier(cond) || ts.isCallExpression(cond) || ts.isPropertyAccessExpression(cond)
          extra.push(`${plain ? cond.getText() : `(${p.initializer.getText()})`} && ${style}`)
        } else return refuse(p, "classList", "a `classList` entry with a computed name")
      }
    }
    const one = (all: string[]) => (all.length === 1 ? all[0] : `[${all.join(", ")}]`)
    const write = (attr: ts.JsxAttribute, all: string[]) => {
      if (styled) return s.edit(attr.getStart(), attr.getEnd(), `xstyle={${one(all)}}`)
      if (!intrinsic) passed.add(tag)
      if (intrinsic && !spread && all.length === 1 && /^styles\.\w+$/.test(all[0]))
        return s.edit(attr.getStart(), attr.getEnd(), `{...stylex.props(${all[0]})}`)
      usesCn = true
      s.edit(attr.getStart(), attr.getEnd(), `class={cn(${all.join(", ")})}`)
    }
    if (list && cls) s.edit(list.getStart(), list.getEnd(), "")
    if (!cls) return write(list!, extra)

    const init = cls.initializer
    if (!init) return refuse(cls, "class", "`class` without a value")
    if (ts.isStringLiteral(init)) {
      handled.add(init)
      const tokens = init.text.split(/\s+/).filter(Boolean)
      const style = convert(init.text, baseName(tag, tokens), ctx, '"')
      const ref = style?.match(/styles\.\w+/)?.[0]
      const hooks = style?.match(/"([^"]*)"/)?.[1] ?? (style === null ? tokens.join(" ") : "")
      // Only a component's own hooks (or nothing): the attribute stays as written.
      if (!ref && !extra.length && !styled) return
      return write(cls, [...(ref ? [ref] : []), ...(hooks ? [JSON.stringify(hooks)] : []), ...extra])
    }
    if (!ts.isJsxExpression(init) || !init.expression) return refuse(cls, "class", "`class` without a value")
    const whole = unwrap(init.expression)
    const array = joined(whole)
    const root = array ?? whole
    const from = s.sites.length
    walk(root, walking, "", false)
    if (array) {
      s.edit(array.getEnd(), whole.getEnd(), "")
      twice(array, "in a class list")
    }
    // What stands on the element whatever happens is named for the element.
    for (const site of s.sites.slice(from))
      if (!site.wrap && (site.node === root || site.node.parent === root))
        site.hint = baseName(tag, site.text.split(/\s+/))
    const called = isCn(root) && root === init.expression
    const tail = extra.length ? `, ${extra.join(", ")}` : ""
    const lone = root.getText() === "props.class" ? "props.xstyle, " : ""
    const [start, end] = [init.expression.getStart(), init.expression.getEnd()]
    if (styled) {
      s.edit(cls.name.getStart(), cls.name.getEnd(), "xstyle")
      if (!called) twice(root, "handed to a component")
      if (called) {
        s.edit(root.getStart(), root.arguments.pos, "[")
        s.edit(root.getEnd() - 1, root.getEnd(), `${tail}]`)
      } else if (lone || tail) {
        s.edit(start, start, `[${lone}`)
        s.edit(end, end, `${tail}]`)
      }
      return
    }
    if (!intrinsic) passed.add(tag)
    if (called) {
      if (tail) s.edit(root.getEnd() - 1, root.getEnd() - 1, tail)
      return
    }
    // A memo's `cn()` string is the class as it stands.
    const holder = ts.isCallExpression(root) ? root.expression : root
    if (!tail && ts.isIdentifier(holder) && merged.has(holder.text)) return
    usesCn = true
    s.edit(start, start, `cn(${lone}`)
    s.edit(end, end, `${tail})`)
  }
  const mergers = (n: ts.Node) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer && returnsCn(n.initializer))
      merged.add(n.name.text)
    else if (ts.isFunctionDeclaration(n) && n.name && n.body && returnsOf(n.body).some(returnsCn))
      merged.add(n.name.text)
    ts.forEachChild(n, mergers)
  }
  mergers(s.sf)
  const visit = (n: ts.Node) => {
    if (isCn(n)) for (const a of n.arguments) twice(a, "fed into another `cn()`")
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) element(n)
    else if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && n.arguments[0])
      specifier(n.arguments[0], n)
    else if (ts.isArrayLiteralExpression(n) && n.elements.length && n.elements.every(ts.isStringLiteral)) {
      // What `splitProps` keeps from the element: `xstyle` beside `class`.
      const at = n.elements.find((e) => (e as ts.StringLiteral).text === "class")
      if (at) s.edit(at.getEnd(), at.getEnd(), ', "xstyle"')
    }
    ts.forEachChild(n, visit)
  }
  visit(s.sf)

  // `cn()` everywhere, then every holder's declaration.
  s.roots(holders)
  while (s.declarations(holders));

  // Every holder is one the generator read: declared here with its value,
  // or a class constant of the layer; a parameter's is the caller's.
  const declared = new Map<string, "value" | "bare" | "parameter" | "import">()
  const declare = (n: ts.Node) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)) {
      if (n.initializer || declared.get(n.name.text) !== "value")
        declared.set(n.name.text, n.initializer ? "value" : "bare")
    } else if (ts.isFunctionDeclaration(n) && n.name) declared.set(n.name.text, "value")
    else if ((ts.isParameter(n) || ts.isBindingElement(n)) && ts.isIdentifier(n.name)) {
      if (!declared.has(n.name.text)) declared.set(n.name.text, "parameter")
    } else if (ts.isImportSpecifier(n)) {
      // A package's export holds no class; a kit file's does only as a constant.
      const from = (n.parent.parent.parent.moduleSpecifier as ts.StringLiteral).text
      declared.set(n.name.text, from.startsWith(".") && !/^[A-Z][A-Z0-9_]+$/.test(n.name.text) ? "import" : "value")
    }
    ts.forEachChild(n, declare)
  }
  declare(s.sf)
  for (const h of holders) {
    const how = declared.get(h)
    if (how === "value" || h === "undefined" || exported.has(h)) continue
    if (how === "parameter") opaque.add(h)
    else
      refuse(
        s.sf,
        "class holder out of reach",
        `${h} stands in class position but ${how === "import" ? "is imported" : how === "bare" ? "is assigned later" : "is not declared in the file"}`,
      )
  }

  // `props.class` reaches an element only through `cn()` or an attribute.
  const classRefs = (n: ts.Node) => {
    if (ts.isPropertyAccessExpression(n) && n.name.text === "class" && n.expression.getText() !== "styles") {
      const p = n.parent
      const inCn = isCn(p) && p.arguments.includes(n)
      const lone = ts.isJsxExpression(p) && ts.isJsxAttribute(p.parent) && p.parent.name.getText() === "class"
      const listed =
        ts.isArrayLiteralExpression(p) &&
        ts.isPropertyAccessExpression(p.parent) &&
        !!joined(p.parent.parent.parent.parent as ts.Expression)
      if (listed && n.getText() === "props.class") s.edit(n.getStart(), n.getStart(), "props.xstyle, ")
      if (n.getText() !== "props.class" || !(inCn || lone || listed))
        refuse(
          n,
          "class prop outside cn()",
          `${n.getText()} read outside \`cn()\`: its \`xstyle\` twin cannot follow it`,
        )
    }
    ts.forEachChild(n, classRefs)
  }
  classRefs(s.sf)

  s.convert(ctx)

  // Beside `class`, the component takes StyleX styles as `xstyle`.
  for (const m of text.matchAll(CLASS_TYPE)) {
    const end = m.index! + m[0].length
    s.edit(end, end, XSTYLE_TYPE)
  }

  // A literal that still reads as classes was in a place the walk does not
  // know: refused, never left as Tailwind in a StyleX file.
  const converted = new Set([...handled, ...s.sites.map((site) => site.node)])
  const left = (n: ts.Node) => {
    if (ts.isTypeNode(n) || ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return
    const literal = ts.isStringLiteralLike(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)
    if (literal && !converted.has(n) && readsAsClasses(n.text, env.map) && !valuePosition(n))
      refuse(
        n,
        "classes out of class position",
        `"${n.text.trim().slice(0, 60)}" reads as classes where the generator finds none`,
      )
    ts.forEachChild(n, left)
  }
  left(s.sf)

  out.refused.push(...refused)
  if (refused.length) return
  if (passed.size) out.passed.set(name, [...passed])
  if (opaque.size) out.opaque.set(name, [...opaque])

  const lib = libImport as ts.ImportDeclaration | null
  const end = s.importsEnd()
  if (lib) s.edit(lib.getStart(), lib.getEnd(), LIB_MARK)
  else s.edit(end, end, `${end ? "\n" : ""}${LIB_MARK}`)
  if (ctx.names.all.length)
    s.edit(
      end,
      end,
      `${end ? "\n" : ""}import * as stylex from "@stylexjs/stylex"\n\n${stylexText(ctx.names.all)}\n${end ? "" : "\n"}`,
    )
  const named = lib?.importClause?.namedBindings
  const had = named && ts.isNamedImports(named) ? named.elements.map((e) => e.getText()) : []
  const body = splice(text, s.edits)
  const rest = body.replace(LIB_MARK, "")
  const names = [
    ...had.filter((n) => n !== "cn" && n !== "type StyleProp"),
    ...(usesCn || /\bcn\(/.test(rest) ? ["cn"] : []),
    ...(/\bStyleProp\b/.test(rest) ? ["type StyleProp"] : []),
  ].sort((a, b) => a.replace(/^type /, "").localeCompare(b.replace(/^type /, "")))
  const libPath = name.startsWith(RUNTIME) ? "../lib" : "./lib"
  const line = names.length ? `import { ${names.join(", ")} } from "${libPath}"` : ""
  out.files.set(
    name,
    header(source) +
      body.replace(
        lib ? LIB_MARK : `${end ? "\n" : ""}${LIB_MARK}`,
        lib ? line : line && `${end ? "\n" : ""}${line}\n`,
      ),
  )
  if (ctx.kept.size) out.kept.set(name, [...ctx.kept])
  if (ctx.inert.size) out.inert.set(name, [...ctx.inert])
}

/** A string that is a value, not a class: compared, a property's name, an
 * attribute's own other than `class`, anything a `style` holds. */
function valuePosition(n: ts.Node): boolean {
  const p = n.parent
  if (ts.isBinaryExpression(p)) {
    const op = p.operatorToken.kind
    return op === ts.SyntaxKind.EqualsEqualsEqualsToken || op === ts.SyntaxKind.ExclamationEqualsEqualsToken
  }
  if (ts.isCaseClause(p)) return true
  // a property's name, and anything a `style` holds
  if (ts.isPropertyAssignment(p) && p.name === n) return true
  if (ts.isJsxAttribute(p)) return !/class/i.test(p.name.getText())
  for (let a: ts.Node | undefined = p; a; a = a.parent) if (ts.isJsxAttribute(a)) return a.name.getText() === "style"
  return false
}

/** The StyleX layer for the Solid layer's files (`name` → text, a runtime
 * file as `runtime/<name>`), and the Tailwind layer's `control.ts`. */
export function solidStylexLayer(files: Map<string, string>, control: string, map: UtilityMap): SolidStylexLayer {
  const out: SolidStylexLayer = {
    files: new Map(),
    kept: new Map(),
    inert: new Map(),
    refused: [],
    passed: new Map(),
    opaque: new Map(),
  }
  const code = [...files].filter(([n]) => isCode(n))
  const takes = new Set(
    code.filter(([n, t]) => n.endsWith(".tsx") && new RegExp(CLASS_TYPE.source).test(t)).map(([n]) => n),
  )
  const imports = (t: string) => [...t.matchAll(/from "\.\/([\w-]+)"/g)].map((m) => m[1])
  // A chart module (`area-chart.ts`) takes what the root it builds on takes.
  for (const [n, t] of code)
    if (n.endsWith(".ts") && !n.startsWith(RUNTIME) && imports(t).some((i) => takes.has(`${i}.tsx`))) takes.add(n)

  // The runtime files the layer writes: one that writes classes, and any
  // that imports one (a module is one instance, never two).
  const writes = (text: string, name: string) => {
    const visit = (n: ts.Node): boolean =>
      (ts.isJsxAttribute(n) && /^class(List)?$/.test(n.name.getText())) || isCn(n) || !!ts.forEachChild(n, visit)
    return visit(ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, kindOf(name)))
  }
  const runtime = new Set(code.filter(([n, t]) => n.startsWith(RUNTIME) && writes(t, n)).map(([n]) => n))
  for (let more = true; more;) {
    more = false
    for (const [n, t] of code)
      if (
        n.startsWith(RUNTIME) &&
        !runtime.has(n) &&
        imports(t).some((i) => runtime.has(`${RUNTIME}${i}.tsx`) || runtime.has(`${RUNTIME}${i}.ts`))
      ) {
        runtime.add(n)
        more = true
      }
  }
  const env: Env = { map, takes, runtime, files }

  // Constants other files use as classes (`CONTROL` from the Tailwind
  // layer's control, a record a component exports).
  const exported = new Map<string, Set<string>>()
  for (const [, t] of code)
    for (const m of t.matchAll(/import \{([^}]*)\} from "(?:\.\/|\.\.\/tailwind\/)([\w-]+)"/g))
      for (const u of m[1].split(",").map((x) => x.trim()))
        if (/^[A-Z][A-Z0-9_]+$/.test(u)) {
          const key = m[0].includes("tailwind/") ? CONTROL_FILE : m[2]
          ;(exported.get(key) ?? exported.set(key, new Set()).get(key)!).add(u)
        }

  const each = (name: string, text: string, source: string, holders: Set<string>) =>
    solidFile(name, text, source, { map, names: new Names(), kept: new Set(), inert: new Set() }, env, holders, out)
  each(CONTROL_FILE, control, "../tailwind/control.ts", exported.get(CONTROL_FILE) ?? new Set())
  for (const [n, t] of code) {
    if (n.startsWith(RUNTIME) && !runtime.has(n)) continue
    const up = n.startsWith(RUNTIME) ? "../../solid/" : "../solid/"
    each(n, t, `${up}${n}`, exported.get(n.replace(/\.tsx?$/, "")) ?? new Set())
  }
  return out
}
