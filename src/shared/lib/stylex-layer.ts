// Node-side only (tests/stylex-layer.spec.ts): the kit's StyleX layer,
// written from its Tailwind layer. Every class string a Tailwind file sets
// (a template's `class` / `:class`, a `cn()` argument, a `class:` in `h()`,
// and the constants, records and computeds those reach) becomes a named
// style in one `stylex.create` per file, from the declarations Tailwind's
// compiler gives each class (`compileUtilities`, strict). Class names no
// utility stands for (a component's own CSS hooks) stay class names. A
// component that takes `class` also takes `xstyle`, StyleX styles merged
// after its own (Vue turns any object given as `class` into class names).
// The layer's `lib.ts` (its `cn`, `StyleProp`) is written by hand.
import ts from "typescript"
import { parse } from "vue/compiler-sfc"
import { baseName, camel, compileUtilities, Names, stylexText, type UtilityMap } from "./restyle"

export interface StylexLayer {
  /** The generated files, by name inside the layer. */
  files: Map<string, string>
  /** Per file, the class names kept as class names (no utility stands for them). */
  kept: Map<string, string[]>
  /** Per file, inputs that change nothing in the literal they are in (a
   * `ring-accent/30` whose ring sits in another literal). */
  inert: Map<string, string[]>
}

/** Files of the Tailwind layer the StyleX layer does not generate. */
export const HAND_WRITTEN = new Set(["lib.ts", "kit.css"])

const header = (name: string) =>
  name.endsWith(".vue")
    ? `<!-- Generated from ../tailwind/${name} by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->\n`
    : `// Generated from ../tailwind/${name} by src/shared/lib/stylex-layer.ts: edit that\n// file, then npx rs test -u tests/stylex-layer.spec.ts\n`

type Edit = { start: number; end: number; text: string }
type Site = { node: ts.StringLiteralLike; hint: string }

/** `SIZES` + `sm` → `sizesSm`; `cellBase` stays. */
const hintOf = (...parts: string[]) =>
  camel(parts.map((p) => (/^[A-Z0-9_]+$/.test(p) ? p.toLowerCase() : p)).join("-")).replace(/^[A-Z]/, (c) =>
    c.toLowerCase(),
  )

const unwrap = (n: ts.Expression): ts.Expression =>
  ts.isParenthesizedExpression(n) ||
  ts.isAsExpression(n) ||
  ts.isSatisfiesExpression(n) ||
  ts.isNonNullExpression(n) ||
  ts.isTypeAssertionExpression(n)
    ? unwrap(n.expression)
    : n

/** The return expressions of a function body, not of functions inside it. */
function returnsOf(body: ts.Node, out: ts.Expression[] = []): ts.Expression[] {
  ts.forEachChild(body, (n) => {
    if (ts.isFunctionLike(n)) return
    if (ts.isReturnStatement(n) && n.expression) out.push(n.expression)
    else returnsOf(n, out)
  })
  return out
}

/** The string literals in class position under `node`: the arms of a
 * ternary, the right of `&&`, both sides of `||` / `??`, array items, a
 * record's values, `cn()` and `computed()` arguments, a function's returns.
 * Identifiers met there (a constant, a record, a computed, a function) are
 * added to `holders`: their declarations hold classes too. */
function walk(node: ts.Expression, file: string, sites: Site[], holders: Set<string>, hint: string, records: boolean) {
  const n = unwrap(node)
  const go = (e: ts.Expression, h = hint) => walk(e, file, sites, holders, h, records)
  if (ts.isStringLiteralLike(n)) sites.push({ node: n, hint })
  else if (ts.isTemplateExpression(n))
    throw new Error(`${file}: a template literal holds classes; write them as an array`)
  else if (ts.isConditionalExpression(n)) {
    go(n.whenTrue, "")
    go(n.whenFalse, "")
  } else if (ts.isBinaryExpression(n)) {
    const op = n.operatorToken.kind
    if (op === ts.SyntaxKind.AmpersandAmpersandToken) go(n.right, "")
    else if (op === ts.SyntaxKind.BarBarToken || op === ts.SyntaxKind.QuestionQuestionToken) {
      go(n.left)
      go(n.right, "")
    } else if (op === ts.SyntaxKind.PlusToken) throw new Error(`${file}: classes joined with +; write them as an array`)
  } else if (ts.isArrayLiteralExpression(n)) {
    for (const e of n.elements) go(ts.isSpreadElement(e) ? e.expression : e)
  } else if (ts.isObjectLiteralExpression(n)) {
    for (const p of n.properties) {
      if (!records) {
        if (ts.isPropertyAssignment(p) && ts.isStringLiteralLike(p.name))
          throw new Error(`${file}: a class object with class-name keys; write the classes as \`cond && "..."\``)
        continue
      }
      if (ts.isPropertyAssignment(p)) go(p.initializer, hintOf(hint, p.name.getText().replace(/["']/g, "")))
    }
  } else if (ts.isCallExpression(n)) {
    const callee = n.expression
    if (ts.isIdentifier(callee) && (callee.text === "cn" || callee.text === "computed"))
      for (const a of n.arguments) go(a, callee.text === "cn" ? "" : hint)
    else if (ts.isIdentifier(callee)) holders.add(callee.text)
  } else if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) {
    if (ts.isBlock(n.body)) for (const r of returnsOf(n.body)) go(r)
    else go(n.body)
  } else if (ts.isIdentifier(n)) holders.add(n.text)
  else if (ts.isPropertyAccessExpression(n) && n.name.text === "value" && ts.isIdentifier(n.expression))
    holders.add(n.expression.text)
  else if (ts.isElementAccessExpression(n) && ts.isIdentifier(n.expression)) holders.add(n.expression.text)
}

/** One parsed script: its class sites from `cn()` calls, `class:` in `h()`,
 * and the declarations of every holder (to a fixpoint). */
class Script {
  sf: ts.SourceFile
  sites: Site[] = []
  edits: Edit[] = []
  private done = new Set<string>()
  constructor(
    readonly file: string,
    readonly text: string,
    readonly offset: number,
  ) {
    this.sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  }

  roots(holders: Set<string>) {
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "cn")
        for (const a of n.arguments) {
          if (a.getText() === "props.class") this.edit(a.getStart(), a.getStart(), "props.xstyle, ")
          walk(a, this.file, this.sites, holders, "", false)
        }
      else if (
        ts.isPropertyAssignment(n) &&
        n.name.getText() === "class" &&
        ts.isObjectLiteralExpression(n.parent) &&
        ts.isCallExpression(n.parent.parent) &&
        n.parent.parent.expression.getText() === "h"
      )
        walk(n.initializer, this.file, this.sites, holders, "", false)
      ts.forEachChild(n, visit)
    }
    visit(this.sf)
  }

  /** Walk the declarations of holders not walked yet; true when any was. */
  declarations(holders: Set<string>): boolean {
    let more = false
    const visit = (n: ts.Node) => {
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
        const name = n.name.text
        if (holders.has(name) && !this.done.has(name)) {
          this.done.add(name)
          more = true
          walk(n.initializer, this.file, this.sites, holders, hintOf(name), true)
          // A record typed as strings holds styles now.
          const t = n.type
          if (t && ts.isTypeReferenceNode(t) && t.typeName.getText() === "Record" && t.typeArguments?.length === 2) {
            const v = t.typeArguments[1]
            if (v.kind === ts.SyntaxKind.StringKeyword) this.edit(v.getStart(), v.getEnd(), "StyleProp")
          }
        }
      } else if (ts.isFunctionDeclaration(n) && n.name && n.body) {
        const name = n.name.text
        if (holders.has(name) && !this.done.has(name)) {
          this.done.add(name)
          more = true
          for (const r of returnsOf(n.body)) walk(r, this.file, this.sites, holders, hintOf(name), true)
        }
      }
      ts.forEachChild(n, visit)
    }
    visit(this.sf)
    return more
  }

  /** Each class site as StyleX (a literal reached twice, once). */
  convert(ctx: Context) {
    const seen = new Set<ts.Node>()
    for (const site of this.sites) {
      if (seen.has(site.node)) continue
      seen.add(site.node)
      const out = convert(site.node.text, site.hint, ctx, '"')
      if (out !== null) this.edit(site.node.getStart(), site.node.getEnd(), out)
    }
  }

  edit(start: number, end: number, text: string) {
    this.edits.push({ start: this.offset + start, end: this.offset + end, text })
  }

  /** The names this script imports from `./lib`, and where that import is. */
  libImport(): { names: string[]; start: number; end: number } | null {
    for (const s of this.sf.statements)
      if (ts.isImportDeclaration(s) && (s.moduleSpecifier as ts.StringLiteral).text === "./lib") {
        const named = s.importClause?.namedBindings
        const names = named && ts.isNamedImports(named) ? named.elements.map((e) => e.getText()) : []
        return { names, start: s.getStart(), end: s.getEnd() }
      }
    return null
  }

  /** Where a new import goes: after the last one (0 when none). */
  importsEnd(): number {
    let end = 0
    for (const s of this.sf.statements) if (ts.isImportDeclaration(s)) end = s.getEnd()
    return end
  }
}

interface Context {
  map: UtilityMap
  names: Names
  kept: Set<string>
  inert: Set<string>
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** A class literal as StyleX: `styles.name`, `[styles.name, "hook"]` when it
 * also holds class names no utility stands for, `null` for an empty one, or
 * null (left as written) when no utility is in it. */
function convert(text: string, hint: string, ctx: Context, quote: string): string | null {
  const tokens = text.split(/\s+/).filter(Boolean)
  if (!tokens.length) return "null"
  const compiled = compileUtilities(tokens, true, ctx.map)
  for (const t of compiled.rest) ctx.kept.add(t)
  if (!compiled.chains.length) return null
  // An input alone (`ring-accent/30`) writes nothing; it must change the literal it is in.
  for (const t of tokens)
    if (
      !compiled.rest.includes(t) &&
      !compileUtilities([t], true, ctx.map).chains.length &&
      same(
        compileUtilities(
          tokens.filter((x) => x !== t),
          true,
          ctx.map,
        ),
        compiled,
      )
    )
      ctx.inert.add(t)
  const first = tokens.find((t) => !compiled.rest.includes(t))!
  const ref = `styles.${ctx.names.claim(hint || camel(first).replace(/^[A-Z]/, (c) => c.toLowerCase()), compiled)}`
  return compiled.rest.length ? `[${ref}, ${quote}${compiled.rest.join(" ")}${quote}]` : ref
}

/** Apply the replacements that fall inside [start, end) of `text`. */
function splice(text: string, edits: Edit[], start = 0, end = text.length): string {
  let out = ""
  let at = start
  for (const e of [...edits].filter((e) => e.start >= start && e.end <= end).sort((a, b) => a.start - b.start)) {
    out += text.slice(at, e.start) + e.text
    at = e.end
  }
  return out + text.slice(at, end)
}

const CLASS_TYPE = /\bclass\?: string\b/g
const XSTYLE_TYPE = "; xstyle?: StyleProp"
const TAKES_CLASS = /\bclass\?: string\b/

/* ------------------------------ .vue files -------------------------------- */

type El = {
  type: number
  tag: string
  tagType: number
  props: {
    type: number
    name: string
    loc: { start: { offset: number }; end: { offset: number } }
    value?: { content: string }
    arg?: { content: string }
    exp?: { content: string; loc: { start: { offset: number } } }
  }[]
  children?: El[]
}

function sfc(
  name: string,
  text: string,
  ctx: Context,
  takesStyle: (tag: string, imports: Map<string, string>) => boolean,
): string {
  const { descriptor, errors } = parse(text, { filename: name })
  if (errors.length) throw new Error(`${name}: ${errors[0]}`)
  const setup = descriptor.scriptSetup
  if (!setup) throw new Error(`${name}: no <script setup>`)
  const scripts = [setup, descriptor.script]
    .filter((b) => !!b)
    .map((b) => new Script(name, b.content, b.loc.start.offset))
  const [own] = scripts
  const holders = new Set<string>()
  const edits: Edit[] = []

  // Components imported by the file, by tag (`./DitherCheckbox.vue`).
  const imports = new Map<string, string>()
  for (const s of own.sf.statements)
    if (ts.isImportDeclaration(s) && s.importClause?.name)
      imports.set(s.importClause.name.text.toLowerCase(), (s.moduleSpecifier as ts.StringLiteral).text)

  // The template: each element's class attribute and binding become one.
  let usesCn = false
  const visit = (el: El) => {
    if (el.type === 1) element(el)
    for (const c of el.children ?? []) visit(c)
  }
  const element = (el: El) => {
    const fixed = el.props.find((p) => p.type === 6 && p.name === "class")
    const bound = el.props.find((p) => p.type === 7 && p.name === "bind" && p.arg?.content === "class")
    const spread = el.props.some((p) => p.type === 7 && p.name === "bind" && !p.arg)
    const tokens = fixed?.value?.content.split(/\s+/).filter(Boolean) ?? []
    const fixedRef = fixed ? convert(fixed.value?.content ?? "", baseName(el.tag, tokens), ctx, "'") : null
    const ref = fixedRef?.match(/styles\.\w+/)?.[0] ?? null
    const hooks = fixedRef?.match(/'([^']*)'/)?.[1] ?? (fixed && !fixedRef ? fixed.value?.content : "") ?? ""
    let args: string[] | null = null
    let binding = bound
    if (bound?.exp) {
      const code = `(${bound.exp.content})`
      const sf = ts.createSourceFile("t.ts", code, ts.ScriptTarget.Latest, true)
      const root = unwrap((sf.statements[0] as ts.ExpressionStatement).expression)
      if (ts.isObjectLiteralExpression(root)) {
        // `{ shown }`: a component's own hooks as Vue's class object, which
        // stays as written beside the element's styles.
        walk(root, name, [], holders, "", false)
        binding = undefined
      } else {
        const sites: Site[] = []
        walk(root, name, sites, holders, "", false)
        const local: Edit[] = []
        for (const s of sites) {
          const unconditional = s.node === root || s.node.parent === root
          const out = convert(s.node.text, unconditional ? baseName(el.tag, s.node.text.split(/\s+/)) : "", ctx, "'")
          if (out !== null) local.push({ start: s.node.getStart(), end: s.node.getEnd(), text: out })
        }
        args =
          ts.isCallExpression(root) && root.expression.getText() === "cn"
            ? root.arguments.map((a) => splice(code, local, a.getStart(), a.getEnd()))
            : [splice(code, local, root.getStart(), root.getEnd())]
      }
    }
    if (!ref && !args) return
    const all = [...(ref ? [ref] : []), ...(hooks ? [`'${hooks}'`] : []), ...(args ?? [])].flatMap((a) =>
      a === "props.class" ? ["props.xstyle", a] : [a],
    )
    let attr: string
    if (el.tagType === 1 && takesStyle(el.tag, imports))
      attr = `:xstyle="${all.length === 1 ? all[0] : `[${all.join(", ")}]`}"`
    else if (!args && ref && !spread && el.tagType === 0)
      attr = `v-bind="stylex.attrs(${ref})"${hooks ? ` class="${hooks}"` : ""}`
    else {
      attr = `:class="cn(${all.join(", ")})"`
      usesCn = true
    }
    const parts = [fixed, binding].filter((p) => !!p).sort((a, b) => a.loc.start.offset - b.loc.start.offset)
    edits.push({ start: parts[0].loc.start.offset, end: parts[0].loc.end.offset, text: attr })
    if (parts[1]) edits.push({ start: parts[1].loc.start.offset, end: parts[1].loc.end.offset, text: "" })
  }
  if (descriptor.template?.ast) visit(descriptor.template.ast as unknown as El)

  // The scripts: cn() and h() roots, then every holder's declaration.
  for (const s of scripts) s.roots(holders)
  let more = true
  while (more) {
    more = false
    for (const s of scripts) if (s.declarations(holders)) more = true
  }
  for (const s of scripts) s.convert(ctx)

  // Beside `class`, the component takes StyleX styles as `xstyle`.
  let usesStyleProp = scripts.some((s) => s.edits.some((e) => e.text === "StyleProp"))
  for (const s of scripts)
    for (const m of s.text.matchAll(CLASS_TYPE)) {
      const end = m.index! + m[0].length
      s.edit(end, end, XSTYLE_TYPE)
      usesStyleProp = true
    }
  const libNames = new Set<string>()
  if (usesCn) libNames.add("cn")
  if (usesStyleProp) libNames.add("type StyleProp")
  const lib = own.libImport()
  if (lib) {
    const wanted = [...new Set([...lib.names, ...libNames])]
    if (wanted.length !== lib.names.length) own.edit(lib.start, lib.end, `import { ${wanted.join(", ")} } from "./lib"`)
  } else if (libNames.size) {
    const at = own.importsEnd()
    own.edit(at, at, `${at ? "\n" : ""}import { ${[...libNames].join(", ")} } from "./lib"\n`)
  }

  for (const s of scripts) edits.push(...s.edits)
  if (ctx.names.all.length) {
    // The styles, at module level in a plain <script> (StyleX compiles
    // `stylex.create` only there), which the template and setup both see.
    const create = stylexText(ctx.names.all, "")
    const plain = scripts[1]
    if (plain) {
      const at = plain.offset + plain.importsEnd()
      edits.push({
        start: at,
        end: at,
        text: `${at > plain.offset ? "\n" : ""}import * as stylex from "@stylexjs/stylex"\n`,
      })
      const end = plain.offset + plain.text.length
      edits.push({ start: end, end, text: `\n${create}\n` })
    } else {
      const at = text.lastIndexOf("<script", setup.loc.start.offset)
      edits.push({
        start: at,
        end: at,
        text: `<script lang="ts">\nimport * as stylex from "@stylexjs/stylex"\n\n${create}\n</script>\n\n`,
      })
    }
  }
  return dropUnusedCn(splice(text, edits))
}

/** A template that now hands components styles may no longer call `cn`. */
function dropUnusedCn(text: string): string {
  const m = text.match(/import \{([^}]*)\} from "\.\/lib"\n/)
  if (!m || !/\bcn\b/.test(m[1])) return text
  const rest = text.slice(0, m.index) + text.slice(m.index! + m[0].length)
  if (/\bcn\(/.test(rest)) return text
  const names = m[1]
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n && n !== "cn")
  return text.replace(m[0], names.length ? `import { ${names.join(", ")} } from "./lib"\n` : "")
}

/* ------------------------------ .ts modules ------------------------------- */

function module(name: string, text: string, ctx: Context, exported: Set<string>): string {
  const s = new Script(name, text, 0)
  const holders = new Set(exported)
  s.roots(holders)
  while (s.declarations(holders));
  s.convert(ctx)
  let usesStyleProp = false
  for (const m of text.matchAll(CLASS_TYPE)) {
    const end = m.index! + m[0].length
    s.edit(end, end, XSTYLE_TYPE)
    usesStyleProp = true
  }
  const runtime = "class: { type: String, default: undefined },"
  const at = text.indexOf(runtime)
  if (at >= 0) {
    const end = at + runtime.length
    s.edit(end, end, " xstyle: { type: [String, Object, Array] as PropType<StyleProp>, default: undefined },")
    usesStyleProp = true
  }
  const lib = s.libImport()
  if (usesStyleProp && lib)
    s.edit(lib.start, lib.end, `import { ${[...lib.names, "type StyleProp"].join(", ")} } from "./lib"`)
  if (!ctx.names.all.length) return splice(text, s.edits)
  const end = s.importsEnd()
  s.edit(
    end,
    end,
    `${end ? "\n" : ""}import * as stylex from "@stylexjs/stylex"\n\n${stylexText(ctx.names.all, "")}\n${end ? "" : "\n"}`,
  )
  return splice(text, s.edits)
}

/* ------------------------------ the layer --------------------------------- */

/** The StyleX layer for the Tailwind layer's files (`name` → text). */
export function stylexLayer(files: Map<string, string>, map: UtilityMap): StylexLayer {
  const out: StylexLayer = { files: new Map(), kept: new Map(), inert: new Map() }
  // Which components take `class` as a prop (they take `xstyle` too).
  const takes = new Set(
    [...files].filter(([n, t]) => n.endsWith(".vue") && TAKES_CLASS.test(t)).map(([n]) => n.toLowerCase()),
  )
  const takesStyle = (tag: string, imports: Map<string, string>) => {
    const from = imports.get(tag.replace(/-/g, "").toLowerCase())
    return !!from && from.startsWith("./") && takes.has(from.slice(2).toLowerCase())
  }
  // Constants other files use as classes (`CONTROL` from ./control).
  const exported = new Map<string, Set<string>>()
  for (const [n, t] of files) {
    if (!/\.(vue|ts)$/.test(n)) continue
    const code = n.endsWith(".vue")
      ? [parse(t).descriptor.scriptSetup?.content ?? "", parse(t).descriptor.template?.content ?? ""].join("\n")
      : t
    for (const m of code.matchAll(/import \{([^}]*)\} from "\.\/([\w-]+)"/g)) {
      const used = m[1].split(",").map((x) => x.trim())
      for (const u of used)
        if (/^[A-Z][A-Z0-9_]+$/.test(u))
          (exported.get(`${m[2]}.ts`) ?? exported.set(`${m[2]}.ts`, new Set()).get(`${m[2]}.ts`)!).add(u)
    }
  }
  for (const [n, t] of files) {
    if (HAND_WRITTEN.has(n) || !/\.(vue|ts)$/.test(n)) continue
    const ctx: Context = { map, names: new Names(), kept: new Set(), inert: new Set() }
    const body = n.endsWith(".vue") ? sfc(n, t, ctx, takesStyle) : module(n, t, ctx, exported.get(n) ?? new Set())
    out.files.set(n, header(n) + body)
    if (ctx.kept.size) out.kept.set(n, [...ctx.kept])
    if (ctx.inert.size) out.inert.set(n, [...ctx.inert])
  }
  return out
}
