// The class-to-StyleX core under the kit's layer generator
// (`stylex-layer-solid.ts`), framework-free: where
// a class string stands in a TypeScript expression (`walk`), a parsed script
// and its holders (`Script`), and a class literal as a named StyleX style
// (`convert`), from the declarations Tailwind's compiler gives each class
// (`compileUtilities`, strict).
import ts from "typescript"
import { camel, compileUtilities, type Names, type UtilityMap } from "./index"

export type Edit = { start: number; end: number; text: string }
/** A class literal: the node it replaces, its classes, the name it would
 * like, and (a piece of a template literal) how its style is written back. */
export type Site = { node: ts.Node; text: string; hint: string; wrap?: (out: string | null) => string }

/** What a generator cannot carry, found at `node`. */
export type Refuse = (node: ts.Node, kind: string, message: string) => void

/** One walk's ends: where its class literals and holders go. */
export interface Walk {
  sites: Site[]
  holders: Set<string>
  refuse: Refuse
  /** Told each expression met in class position. */
  enter?: (n: ts.Expression) => void
  /** Told an expression in class position the walk cannot read. */
  other?: (n: ts.Expression) => void
}

/** `SIZES` + `sm` → `sizesSm`; `cellBase` stays. */
export const hintOf = (...parts: string[]) =>
  camel(parts.map((p) => (/^[A-Z0-9_]+$/.test(p) ? p.toLowerCase() : p)).join("-")).replace(/^[A-Z]/, (c) =>
    c.toLowerCase(),
  )

export const unwrap = (n: ts.Expression): ts.Expression =>
  ts.isParenthesizedExpression(n) ||
  ts.isAsExpression(n) ||
  ts.isSatisfiesExpression(n) ||
  ts.isNonNullExpression(n) ||
  ts.isTypeAssertionExpression(n)
    ? unwrap(n.expression)
    : n

/** The return expressions of a function body, not of functions inside it. */
export function returnsOf(body: ts.Node, out: ts.Expression[] = []): ts.Expression[] {
  ts.forEachChild(body, (n) => {
    if (ts.isFunctionLike(n)) return
    if (ts.isReturnStatement(n) && n.expression) out.push(n.expression)
    else returnsOf(n, out)
  })
  return out
}

/** The calls whose arguments are in class position: `cn`, and a memo's
 * (`createMemo`), which hands on what it returns. */
const MEMOS = new Set(["createMemo"])

/** A template literal whose classes and expressions are apart, as the list
 * it is (any other is refused): each run of classes one item,
 * each expression one. The pieces replace the literal's own punctuation, so
 * what the expressions hold is rewritten in place. */
function template(n: ts.TemplateExpression, w: Walk): boolean {
  const pieces = [n.head, ...n.templateSpans.map((s) => s.literal)]
  const apart = pieces.every((p, i) => {
    const t = p.text
    const last = i === pieces.length - 1
    if (i > 0 && !last) return /^\s/.test(t) && /\s$/.test(t)
    return !t || (i === 0 ? /\s$/.test(t) : /^\s/.test(t))
  })
  if (!apart) return false
  pieces.forEach((p, i) => {
    const last = i === pieces.length - 1
    w.sites.push({
      node: p,
      text: p.text,
      hint: "",
      wrap: (out) => {
        const item = out === "null" ? "" : (out ?? JSON.stringify(p.text.trim()))
        if (i === 0) return `[${item ? `${item}, ` : ""}`
        return last ? `${item ? `, ${item}` : ""}]` : `, ${item ? `${item}, ` : ""}`
      },
    })
  })
  return true
}

/** The string literals in class position under `node`: the arms of a
 * ternary, the right of `&&`, both sides of `||` / `??`, array items, a
 * record's values, `cn()` and `createMemo()` arguments, a function's returns.
 * Identifiers met there (a constant, a record, a memo, a function) are
 * added to `holders`: their declarations hold classes too. */
export function walk(node: ts.Expression, w: Walk, hint: string, records: boolean) {
  const n = unwrap(node)
  const go = (e: ts.Expression, h = hint) => walk(e, w, h, records)
  w.enter?.(n)
  if (ts.isStringLiteralLike(n)) w.sites.push({ node: n, text: n.text, hint })
  else if (ts.isTemplateExpression(n)) {
    if (template(n, w)) for (const s of n.templateSpans) go(s.expression, "")
    else w.refuse(n, "template literal", "a template literal holds classes; write them as an array")
  } else if (ts.isConditionalExpression(n)) {
    go(n.whenTrue, "")
    go(n.whenFalse, "")
  } else if (ts.isBinaryExpression(n)) {
    const op = n.operatorToken.kind
    if (op === ts.SyntaxKind.AmpersandAmpersandToken) go(n.right, "")
    else if (op === ts.SyntaxKind.BarBarToken || op === ts.SyntaxKind.QuestionQuestionToken) {
      go(n.left)
      go(n.right, "")
    } else if (op === ts.SyntaxKind.PlusToken)
      w.refuse(n, "classes joined with +", "classes joined with +; write them as an array")
  } else if (ts.isArrayLiteralExpression(n)) {
    for (const e of n.elements) go(ts.isSpreadElement(e) ? e.expression : e)
  } else if (ts.isObjectLiteralExpression(n)) {
    for (const p of n.properties) {
      if (!records) {
        if (ts.isPropertyAssignment(p) && ts.isStringLiteralLike(p.name))
          w.refuse(p, "class object", 'a class object with class-name keys; write the classes as `cond && "..."`')
        continue
      }
      if (ts.isPropertyAssignment(p)) go(p.initializer, hintOf(hint, p.name.getText().replace(/["']/g, "")))
    }
  } else if (ts.isCallExpression(n)) {
    const callee = n.expression
    if (ts.isIdentifier(callee) && (callee.text === "cn" || MEMOS.has(callee.text)))
      for (const a of n.arguments) go(a, callee.text === "cn" ? "" : hint)
    else if (ts.isIdentifier(callee)) w.holders.add(callee.text)
  } else if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) {
    if (ts.isBlock(n.body)) for (const r of returnsOf(n.body)) go(r)
    else go(n.body)
  } else if (ts.isIdentifier(n)) w.holders.add(n.text)
  else if (ts.isElementAccessExpression(n) && ts.isIdentifier(n.expression)) w.holders.add(n.expression.text)
  else if (ts.isElementAccessExpression(n)) {
    // `SPACE[size][axis]`: the record at the root.
    let root: ts.Expression = n
    while (ts.isElementAccessExpression(root)) root = root.expression
    if (ts.isIdentifier(root)) w.holders.add(root.text)
    else w.other?.(n)
  } else w.other?.(n)
}

/** One parsed script: its class sites from `cn()` calls
 * and the declarations of every holder (to a fixpoint). */
export class Script {
  sf: ts.SourceFile
  sites: Site[] = []
  edits: Edit[] = []
  private done = new Set<string>()
  readonly walking: Walk
  constructor(
    readonly file: string,
    readonly text: string,
    readonly offset: number,
    refuse: Refuse,
    kind: ts.ScriptKind,
  ) {
    this.sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind)
    this.walking = { sites: this.sites, holders: new Set(), refuse }
  }

  private walk(node: ts.Expression, holders: Set<string>, hint: string, records: boolean) {
    walk(node, { ...this.walking, holders }, hint, records)
  }

  roots(holders: Set<string>) {
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "cn")
        for (const a of n.arguments) {
          if (a.getText() === "props.class") this.edit(a.getStart(), a.getStart(), "props.xstyle, ")
          this.walk(a, holders, "", false)
        }
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
          this.walk(n.initializer, holders, hintOf(name), true)
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
          for (const r of returnsOf(n.body)) this.walk(r, holders, hintOf(name), true)
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
      const out = convert(site.text, site.hint, ctx, '"')
      const text = site.wrap ? site.wrap(out) : out
      if (text !== null) this.edit(site.node.getStart(), site.node.getEnd(), text)
    }
  }

  edit(start: number, end: number, text: string) {
    this.edits.push({ start: this.offset + start, end: this.offset + end, text })
  }

  /** Where a new import goes: after the last one (0 when none). */
  importsEnd(): number {
    let end = 0
    for (const s of this.sf.statements) if (ts.isImportDeclaration(s)) end = s.getEnd()
    return end
  }
}

export interface Context {
  map: UtilityMap
  names: Names
  kept: Set<string>
  inert: Set<string>
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** A class literal as StyleX: `styles.name`, `[styles.name, "hook"]` when it
 * also holds class names no utility stands for, `null` for an empty one, or
 * null (left as written) when no utility is in it. */
export function convert(text: string, hint: string, ctx: Context, quote: string): string | null {
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
export function splice(text: string, edits: Edit[], start = 0, end = text.length): string {
  let out = ""
  let at = start
  for (const e of [...edits].filter((e) => e.start >= start && e.end <= end).sort((a, b) => a.start - b.start)) {
    out += text.slice(at, e.start) + e.text
    at = e.end
  }
  return out + text.slice(at, end)
}

export const CLASS_TYPE = /\bclass\?: string\b/g
export const XSTYLE_TYPE = "; xstyle?: StyleProp"
