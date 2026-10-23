// The compiler half of Run: a Vue SFC, a TypeScript module or a stylesheet
// turned into something the page can evaluate — with Vue's own compiler-sfc
// (the browser build), TypeScript removed by cutting its type syntax out of
// the source (no transpiler: what remains is the file's own JavaScript), and
// ES imports/exports linked into a plain function body that receives its
// imports from the page. Pure: strings in, strings out; `run.ts` evaluates.
import {
  babelParse,
  compileScript,
  compileStyle,
  compileTemplate,
  invalidateTypeCache,
  MagicString,
  parse,
  walk,
} from "vue/compiler-sfc"

/** One problem, located in the file that has it. */
export interface Problem {
  file: string
  line?: number
  column?: number
  message: string
}

export class CompileError extends Error {
  constructor(readonly problems: Problem[]) {
    super(problems.map((p) => `${p.file}${p.line ? ` ${p.line}:${p.column ?? 1}` : ""} ${p.message}`).join("\n"))
  }
}

/** A file ready to evaluate: a function body over `__import`, `__pick`,
 * `__module` and `__meta` (see `evaluate`), plus the CSS it brings. */
export interface Compiled {
  file: string
  body: string
  css: string[]
}

/** Synchronous source lookup for the type references `defineProps<…>()`
 * follows into other files (compiler-sfc's `fs` option). */
export interface SourceFs {
  fileExists(file: string): boolean
  readFile(file: string): string | undefined
}

/** Throw one problem; `at` is babel's position (1-based line, 0-based column). */
const fail = (file: string, message: string, at?: { line: number; column: number }): never => {
  throw new CompileError([{ file, line: at?.line, column: at ? at.column + 1 : undefined, message }])
}

// TS nodes that wrap a runtime expression: only their type part goes.
const TS_EXPRESSIONS = new Set([
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSNonNullExpression",
  "TSTypeAssertion",
  "TSInstantiationExpression",
])
// TS with runtime semantics — rewriting it would be transpiling.
const TS_RUNTIME = new Set([
  "TSEnumDeclaration",
  "TSParameterProperty",
  "TSImportEqualsDeclaration",
  "TSExportAssignment",
])

type AnyNode = Record<string, any> & {
  type: string
  start: number
  end: number
  loc: { start: { line: number; column: number } }
}

/** A TypeScript or JavaScript ES module as a function body: types cut out,
 * imports hoisted into `const`s read through `__pick` (which throws for a
 * missing export, as ESM would), exports returned as live getters, and
 * `import.meta` read from `__meta`. */
export function link(code: string, file: string): string {
  let ast
  try {
    ast = babelParse(code, { sourceType: "module", plugins: ["typescript"] })
  } catch (e) {
    const err = e as { message: string; loc?: { line: number; column: number } }
    return fail(file, err.message.replace(/\s*\(\d+:\d+\)$/, ""), err.loc)
  }
  const s = new MagicString(code)
  const cuts: [number, number][] = []
  const cut = (a: number, b: number) => {
    if (b <= a || cuts.some(([x, y]) => x <= a && b <= y)) return
    cuts.push([a, b])
    s.remove(a, b)
  }
  const cutWord = (from: number, to: number, word: RegExp) => {
    const m = word.exec(code.slice(from, to))
    if (m) cut(from + m.index, from + m.index + m[0].length)
  }
  const imports: string[] = []
  const exported: string[] = []
  const stars: string[] = []
  const source = (spec: string) => {
    imports.push(`const __i${imports.length} = __import(${JSON.stringify(spec)})`)
    return `__i${imports.length - 1}`
  }
  const nameOf = (n: { type: string; name?: string; value?: string }) => n.name ?? n.value ?? ""

  walk(ast.program, {
    enter(this: { skip(): void }, n: AnyNode) {
      const t = n.type
      if (TS_RUNTIME.has(t) || (t === "TSModuleDeclaration" && !n.declare))
        return fail(file, `${t.slice(2)} needs a TypeScript transpiler; Run only strips types`, n.loc.start)
      if (t.startsWith("TS") && !TS_EXPRESSIONS.has(t)) {
        // Annotations, type parameters and arguments, interfaces, aliases,
        // declarations, overloads, index signatures: all type, all gone.
        cut(n.start, n.end)
        return this.skip()
      }
      // A `this` parameter is a type: it goes with its comma.
      const first = n.params?.[0]
      if (first?.type === "Identifier" && first.name === "this") cut(first.start, n.params[1]?.start ?? first.end)
      switch (t) {
        case "TSAsExpression":
        case "TSSatisfiesExpression":
          cutWord(n.expression.end, n.end, /\s*\b(as|satisfies)\b[\s\S]*$/)
          break
        case "TSNonNullExpression":
          cutWord(n.expression.end, n.end, /!(?=[^!]*$)/)
          break
        case "TSTypeAssertion":
          cut(n.start, n.typeAnnotation.end + 1)
          break
        case "MetaProperty":
          if (n.meta.name === "import") s.overwrite(n.start, n.end, "__meta")
          break
        case "Identifier":
          if (n.optional && code[n.start + n.name.length] === "?")
            cut(n.start + n.name.length, n.start + n.name.length + 1)
          break
        case "VariableDeclarator":
          if (n.definite) cutWord(n.id.start + nameOf(n.id).length, n.id.end, /^\s*!/)
          break
        case "VariableDeclaration":
        case "ClassDeclaration":
          if (n.declare) {
            cut(n.start, n.end)
            return this.skip()
          }
          if (t === "ClassDeclaration") {
            if (n.abstract) cutWord(n.start, n.id?.start ?? n.body.start, /\babstract\s+/)
            if (n.implements?.length)
              cut(code.lastIndexOf("implements", n.implements[0].start), n.implements[n.implements.length - 1].end)
          }
          break
        case "ClassProperty":
        case "ClassMethod":
        case "ClassPrivateProperty":
          if (n.declare) {
            cut(n.start, n.end)
            return this.skip()
          }
          for (const m of code
            .slice(n.start, n.key.start)
            .matchAll(/\b(public|private|protected|readonly|override)\s+/g))
            cut(n.start + m.index!, n.start + m.index! + m[0].length)
          if (n.optional || n.definite)
            cutWord(n.key.end, n.typeAnnotation?.start ?? n.value?.start ?? n.end, /^\s*[?!]/)
          break
        case "ImportDeclaration": {
          cut(n.start, n.end)
          if (n.importKind === "type") return this.skip()
          const specs = n.specifiers.filter((sp: { importKind?: string }) => sp.importKind !== "type")
          if (n.specifiers.length && !specs.length) return this.skip()
          const id = source(n.source.value)
          for (const sp of specs) {
            const local = sp.local.name
            if (sp.type === "ImportNamespaceSpecifier") imports.push(`const ${local} = ${id}`)
            else {
              const name = sp.type === "ImportDefaultSpecifier" ? "default" : nameOf(sp.imported)
              imports.push(`const ${local} = __pick(${id}, ${JSON.stringify(name)}, ${JSON.stringify(n.source.value)})`)
            }
          }
          return this.skip()
        }
        case "ExportDefaultDeclaration": {
          const d = n.declaration
          if ((d.type === "FunctionDeclaration" || d.type === "ClassDeclaration") && d.id) {
            cut(n.start, d.start)
            exported.push(`default: () => ${d.id.name}`)
          } else {
            s.overwrite(n.start, d.start, "const __default = ")
            exported.push("default: () => __default")
          }
          break
        }
        case "ExportNamedDeclaration": {
          const kind = n.declaration?.type ?? ""
          if (n.exportKind === "type" || n.declaration?.declare || (kind.startsWith("TS") && !TS_RUNTIME.has(kind))) {
            cut(n.start, n.end)
            return this.skip()
          }
          if (n.declaration) {
            cut(n.start, n.declaration.start)
            const d = n.declaration
            const names =
              d.type === "VariableDeclaration"
                ? d.declarations.map((v: { id: { type: string; name?: string } }) =>
                    v.id.type === "Identifier" ? v.id.name! : fail(file, "Run exports plain names only", n.loc.start),
                  )
                : [d.id.name]
            for (const name of names) exported.push(`${name}: () => ${name}`)
            break
          }
          cut(n.start, n.end)
          const from = n.source ? source(n.source.value) : ""
          for (const sp of n.specifiers) {
            if (sp.exportKind === "type") continue
            const local = nameOf(sp.local ?? sp.exported)
            const as = nameOf(sp.exported)
            exported.push(
              `${JSON.stringify(as)}: () => ${from ? `__pick(${from}, ${JSON.stringify(local)}, ${JSON.stringify(n.source.value)})` : local}`,
            )
          }
          return this.skip()
        }
        case "ExportAllDeclaration":
          cut(n.start, n.end)
          if (n.exportKind !== "type") stars.push(source(n.source.value))
          return this.skip()
      }
    },
  })

  const body = s.toString()
  try {
    babelParse(body, { sourceType: "module" })
  } catch (e) {
    const err = e as { message: string }
    return fail(file, `uses TypeScript Run can't strip (${err.message})`)
  }
  return `${imports.join("\n")}\n${body}\nreturn __module([${stars.join(", ")}], { ${exported.join(", ")} })`
}

/** Short stable hash (FNV-1a) — scope ids for compiled styles. */
export function hashId(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193)
  return (h >>> 0).toString(36)
}

/** CSS Modules the runner's way: each class the code reads off the module
 * (`$style.name`, `$style["name"]`) renamed in the CSS with the scope id. */
function cssModule(css: string, code: string, binding: string, id: string) {
  const used = new Set<string>()
  const key = binding.replace(/\$/g, "\\$")
  for (const m of code.matchAll(new RegExp(`${key}(?:\\.([A-Za-z_][\\w]*)|\\[["']([^"']+)["']\\])`, "g")))
    used.add(m[1] ?? m[2])
  const map: Record<string, string> = {}
  for (const name of used) {
    map[name] = `${name}_${id}`
    css = css.replace(new RegExp(`\\.${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`, "g"), `.${map[name]}`)
  }
  return { css, map }
}

/** A Vue SFC as a module body whose default export is the component. */
export function compileVue(file: string, source: string, o: { id: string; fs?: SourceFs }): Compiled {
  const { descriptor, errors } = parse(source, { filename: file, sourceMap: false })
  if (errors.length)
    throw new CompileError(
      errors.map((e) => {
        const loc = "loc" in e ? e.loc : undefined
        return { file, line: loc?.start.line, column: loc?.start.column, message: e.message }
      }),
    )
  const id = o.id
  const scoped = descriptor.styles.some((st) => st.scoped)
  const css: string[] = []
  const modules: string[] = []
  const code = [descriptor.script?.content, descriptor.scriptSetup?.content, descriptor.template?.content].join("\n")
  for (const st of descriptor.styles) {
    if (st.lang && st.lang !== "css")
      fail(file, `<style lang="${st.lang}"> needs its preprocessor; Run compiles plain CSS`, {
        line: st.loc.start.line,
        column: st.loc.start.column - 1,
      })
    if (st.module) {
      const binding = typeof st.module === "string" ? st.module : "$style"
      const out = cssModule(st.content, code, binding, id)
      css.push(out.css)
      modules.push(`${JSON.stringify(binding)}: ${JSON.stringify(out.map)}`)
      continue
    }
    const out = compileStyle({ source: st.content, filename: file, id: `data-v-${id}`, scoped: !!st.scoped })
    if (out.errors.length) throw new CompileError(out.errors.map((e) => ({ file, message: e.message })))
    css.push(out.code)
  }
  let js: string
  try {
    if (descriptor.scriptSetup || descriptor.script) {
      if (o.fs) invalidateTypeCache(file)
      const script = compileScript(descriptor, {
        id,
        inlineTemplate: !!descriptor.scriptSetup,
        genDefaultAs: "__sfc__",
        fs: o.fs,
      })
      js = script.content
      if (!descriptor.scriptSetup && descriptor.template) js += template(file, descriptor.template.content, id, scoped)
    } else {
      js = `const __sfc__ = {}\n${descriptor.template ? template(file, descriptor.template.content, id, scoped) : ""}`
    }
  } catch (e) {
    if (e instanceof CompileError) throw e
    const err = e as {
      message: string
      loc?: { start?: { line: number; column: number }; line?: number; column?: number }
    }
    const at = err.loc?.start ?? (err.loc?.line ? { line: err.loc.line, column: err.loc.column ?? 0 } : undefined)
    return fail(
      file,
      err.message
        .replace(/^\[@?vue\/compiler-sfc\]\s*/, "")
        .split("\n")[0]
        .replace(/\s*\(\d+:\d+\)$/, ""),
      at,
    )
  }
  if (scoped) js += `\n__sfc__.__scopeId = "data-v-${id}"`
  if (modules.length) js += `\n__sfc__.__cssModules = { ${modules.join(", ")} }`
  js += `\n__sfc__.__file = ${JSON.stringify(file)}\nexport default __sfc__`
  return { file, body: link(js, file), css }
}

function template(file: string, source: string, id: string, scoped: boolean) {
  const out = compileTemplate({ source, filename: file, id, scoped, compilerOptions: { mode: "module" } })
  if (out.errors.length)
    throw new CompileError(
      out.errors.map((e) =>
        typeof e === "string"
          ? { file, message: e }
          : { file, line: e.loc?.start.line, column: e.loc?.start.column, message: e.message },
      ),
    )
  return `\n${out.code}\n__sfc__.render = render`
}

/** A TypeScript or JavaScript module as a module body. */
export function compileModule(file: string, source: string): Compiled {
  return { file, body: link(source, file), css: [] }
}

/** A tokens stylesheet scoped to one element: `:root`/`html` rules apply to
 * the scope, `.dark` rules to the scope under `html.dark`, anything else
 * inside the scope — so an edited theme.css restyles one preview only. */
export function scopeTokens(css: string, scope: string): string {
  let out = ""
  let depth = 0
  let start = 0
  for (let i = 0; i < css.length; i++) {
    const ch = css[i]
    if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2)
      i = end < 0 ? css.length : end + 1
      continue
    }
    if (ch === "{") {
      // Comments in a prelude are dropped: the scoped copy is for the page.
      const head = css
        .slice(start, i)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .trim()
      out +=
        head.startsWith("@") || depth > 1
          ? `\n${head} `
          : `\n${head
              .split(",")
              .map((sel) => {
                const x = sel.trim()
                if (x === ":root" || x === "html") return scope
                if (x === ".dark" || x === "html.dark" || x === ":root.dark") return `.dark ${scope}`
                if (x.startsWith(".dark ")) return `.dark ${scope} ${x.slice(6)}`
                return `${scope} ${x}`
              })
              .join(", ")} `
      out += "{"
      depth++
      start = i + 1
    } else if (ch === "}") {
      out += css.slice(start, i + 1)
      depth = Math.max(0, depth - 1)
      start = i + 1
    } else if (ch === ";" && depth === 0) {
      out += css.slice(start, i + 1)
      start = i + 1
    }
  }
  return out + css.slice(start)
}

/** Evaluate a compiled body. `load` returns a module's exports for an import
 * specifier; `meta` stands in for `import.meta`. */
export function evaluate(
  compiled: Compiled,
  load: (spec: string) => Record<string, unknown>,
  meta: Record<string, unknown> = { env: {} },
): Record<string, unknown> {
  const pick = (mod: Record<string, unknown>, name: string, spec: string) => {
    if (!(name in mod)) throw new SyntaxError(`The module "${spec}" does not provide an export named "${name}"`)
    return mod[name]
  }
  const module = (stars: Record<string, unknown>[], own: Record<string, () => unknown>) => {
    const out: Record<string, unknown> = {}
    for (const star of stars)
      for (const k of Object.keys(star))
        if (k !== "default") Object.defineProperty(out, k, { get: () => star[k], enumerable: true })
    for (const [k, get] of Object.entries(own)) Object.defineProperty(out, k, { get, enumerable: true })
    return Object.freeze(out)
  }
  const fn = new Function(
    "__import",
    "__pick",
    "__module",
    "__meta",
    `${compiled.body}\n//# sourceURL=dither-run:///${compiled.file}`,
  )
  return fn(load, pick, module, meta)
}
