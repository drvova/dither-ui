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
import { baseName, Names, stylexText, type UtilityMap } from "./restyle"
import {
  CLASS_TYPE,
  type Context,
  convert,
  type Edit,
  Script,
  type Site,
  splice,
  TAKES_CLASS,
  throwing,
  unwrap,
  walk,
  XSTYLE_TYPE,
} from "./stylex-core"

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
        walk(root, { sites: [], holders, refuse: throwing(name) }, "", false)
        binding = undefined
      } else {
        const sites: Site[] = []
        walk(root, { sites, holders, refuse: throwing(name) }, "", false)
        const local: Edit[] = []
        for (const s of sites) {
          const unconditional = s.node === root || s.node.parent === root
          const out = convert(s.text, unconditional ? baseName(el.tag, s.text.split(/\s+/)) : "", ctx, "'")
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
