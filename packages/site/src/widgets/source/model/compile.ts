// The compiler half of Run: a Solid `.tsx` file or a TypeScript module turned
// into something the page can evaluate, with Solid's own compiler (Babel's
// browser build and `babel-preset-solid`, fetched the first time a reader
// runs: `compiler()`), its types removed and its imports and exports linked
// into a plain function body that receives its imports from the page. Pure
// but for that fetch: strings in, strings out; `run.ts` evaluates.

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

/** A file ready to evaluate: a function body over `require`, `exports`,
 * `module` and `__meta` (see `evaluate`), and each name it imports by the
 * module it asks for it (a missing one is an error, as it is in a module). */
export interface Compiled {
  file: string
  body: string
  imports: { spec: string; names: string[] }[]
}

/** A file's source in, the same file ready to evaluate out. */
export type Compile = (file: string, source: string) => Compiled

let loading: Promise<Compile> | null = null

/** Solid's compiler, fetched once. */
export function compiler(): Promise<Compile> {
  loading ??= Promise.all([import("@babel/standalone"), import("babel-preset-solid")]).then(([babel, preset]) => {
    const solid = preset.default
    return (file, source) => {
      const imports: Compiled["imports"] = []
      let code: string | null | undefined
      try {
        code = babel.transform(source, {
          filename: file,
          babelrc: false,
          configFile: false,
          sourceType: "module",
          // Solid's JSX for a browser, mounted by the page (never hydrated)
          presets: [
            [solid, { generate: "dom", hydratable: false }],
            ["typescript", { isTSX: /\.tsx$/.test(file), allExtensions: true, allowDeclareFields: true }],
          ],
          plugins: [
            {
              visitor: {
                // `import.meta` has no place in a function body: it is read from `__meta`
                MetaProperty(path) {
                  if (path.node.meta?.name === "import") path.replaceWith(babel.packages.types.identifier("__meta"))
                },
                // the names a file imports, type-only ones aside (the preset drops those)
                ImportDeclaration(path) {
                  if (path.node.importKind === "type") return
                  const names = (path.node.specifiers ?? [])
                    .filter((s) => s.importKind !== "type")
                    .map((s) =>
                      s.type === "ImportDefaultSpecifier"
                        ? "default"
                        : s.type === "ImportSpecifier"
                          ? (s.imported?.name ?? s.imported?.value ?? "")
                          : "",
                    )
                    .filter(Boolean)
                  imports.push({ spec: path.node.source!.value, names })
                },
              },
            },
            // every module a file is given is an ES module's exports: no CommonJS guessing
            ["transform-modules-commonjs", { importInterop: "none" }],
          ],
        }).code
      } catch (e) {
        const err = e as { message: string; loc?: { line: number; column: number } }
        // Babel leads with the file and trails with the place and a frame of the code
        const message = err.message
          .split("\n")[0]
          .replace(/^.*?: /, "")
          .replace(/\s*\(\d+:\d+\)$/, "")
        throw new CompileError([
          { file, line: err.loc?.line, column: err.loc ? err.loc.column + 1 : undefined, message },
        ])
      }
      return { file, body: code ?? "", imports }
    }
  })
  loading.catch(() => (loading = null))
  return loading
}

/** Short stable hash (FNV-1a): scope ids for compiled styles. */
export function hashId(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193)
  return (h >>> 0).toString(36)
}

/** A stylesheet's selectors (each rule's prelude, at-rules aside) rewritten
 * by `each`; declarations and comments stay as written. */
function selectors(css: string, each: (selector: string) => string): string {
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
      // Comments in a prelude are dropped: the rewritten copy is for the page.
      const head = css
        .slice(start, i)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .trim()
      out += head.startsWith("@") || depth > 1 ? `\n${head} ` : `\n${head.split(",").map(each).join(", ")} `
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

/** A tokens stylesheet scoped to one element: `:root`/`html` rules apply to
 * the scope, `.dark` rules to the scope under `html.dark`, anything else
 * inside the scope — so an edited theme.css restyles one preview only, and
 * an example's own stylesheet styles its own preview only. */
export function scopeTokens(css: string, scope: string): string {
  return selectors(css, (sel) => {
    const x = sel.trim()
    if (x === ":root" || x === "html") return scope
    if (x === ".dark" || x === "html.dark" || x === ":root.dark") return `.dark ${scope}`
    if (x.startsWith(".dark ")) return `.dark ${scope} ${x.slice(6)}`
    return `${scope} ${x}`
  })
}

/** CSS Modules the runner's way: every class a selector names renamed with
 * the scope id, and the map from the names the file reads (`styles.name`)
 * to the ones in the sheet. */
export function cssModule(css: string, id: string): { css: string; map: Record<string, string> } {
  const map: Record<string, string> = {}
  const out = selectors(css, (sel) =>
    sel.trim().replace(/\.(-?[A-Za-z_][\w-]*)/g, (_, name: string) => `.${(map[name] = `${name}_${id}`)}`),
  )
  return { css: out, map }
}

/** Modules still being evaluated: one of them read through an import cycle
 * has not made all its exports yet. */
const PENDING = new WeakSet<object>()

/** Evaluate a compiled body. `load` returns a module's exports for an import
 * specifier; `meta` stands in for `import.meta`; `exports` is the object the
 * file fills (given by the caller when a cycle may read it half made). */
export function evaluate(
  compiled: Compiled,
  load: (spec: string) => Record<string, unknown>,
  meta: Record<string, unknown> = { env: {} },
  exports: Record<string, unknown> = {},
): Record<string, unknown> {
  const wanted = new Map(compiled.imports.map((i) => [i.spec, i.names]))
  const require = (spec: string) => {
    const mod = load(spec)
    for (const name of wanted.get(spec) ?? [])
      if (!(name in mod) && !PENDING.has(mod))
        throw new SyntaxError(`The module "${spec}" does not provide an export named "${name}"`)
    return mod
  }
  const module = { exports }
  PENDING.add(exports)
  try {
    new Function(
      "require",
      "exports",
      "module",
      "__meta",
      `${compiled.body}\n//# sourceURL=dither-run:///${compiled.file}`,
    )(require, exports, module, meta)
  } finally {
    PENDING.delete(exports)
  }
  return module.exports
}
