// Node-side only (rstack.config.ts, tests): the utility vocabulary
// a docs snippet or a Studio export can carry, compiled by Tailwind's own
// compiler into the declarations each class stands for, so `restyle.ts` can
// write the same look in vanilla CSS, CSS Modules or StyleX. The theme is
// inlined (spacing, radii, breakpoints become values) while the kit's tokens
// stay `var(--foreground)`-style references — the contract an app themes
// through. The app never imports this module; it reads the result as the
// virtual module `virtual-dither-utilities`.
import { compile } from "@tailwindcss/node"
import { Scanner } from "@tailwindcss/oxide"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import type { RsbuildPlugin, Rspack } from "rstack/app"
import type { UtilityMap, UtilityRule } from "./restyle"

/** The folders whose class strings can end up in a snippet or an export. */
export const UTILITY_SOURCES = ["src/pages/docs", "src/entities"]

type Block = { prelude: string; decl: [string, string][]; children: Block[] }

/** A tiny nested-CSS reader for the compiler's unoptimized output: blocks
 * keep their prelude (a selector or an at-rule) and their declarations;
 * comments and at-statements are dropped. */
function parseCss(css: string): Block[] {
  const root: Block = { prelude: "", decl: [], children: [] }
  const stack = [root]
  let buf = ""
  let quote: string | null = null
  let depth = 0
  const flush = () => {
    const text = buf.trim()
    buf = ""
    if (!text || text.startsWith("@")) return
    const k = text.indexOf(":")
    if (k > 0) stack[stack.length - 1].decl.push([text.slice(0, k).trim(), text.slice(k + 1).trim()])
  }
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (quote) {
      buf += c
      if (c === "\\") buf += css[++i] ?? ""
      else if (c === quote) quote = null
      continue
    }
    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2)
      i = end < 0 ? css.length : end + 1
      continue
    }
    if (c === '"' || c === "'") quote = c
    else if (c === "(") depth++
    else if (c === ")") depth--
    else if (depth === 0 && c === "{") {
      const block: Block = { prelude: buf.trim(), decl: [], children: [] }
      stack[stack.length - 1].children.push(block)
      stack.push(block)
      buf = ""
      continue
    } else if (depth === 0 && (c === "}" || c === ";")) {
      flush()
      if (c === "}") stack.pop()
      continue
    }
    buf += c
  }
  return root.children
}

function flatten(block: Block, chain: string[], out: UtilityRule[]) {
  if (block.decl.length) out.push({ chain, decl: block.decl })
  for (const child of block.children) flatten(child, [...chain, child.prelude], out)
}

/** `.hover\:text-foreground:hover` → the candidate `hover:text-foreground`
 * and the selector's tail `:hover` (empty for a bare class); null for any
 * other selector. */
function candidateOf(prelude: string): { candidate: string; tail: string } | null {
  const m = prelude.match(/^\.((?:\\[\s\S]|[\w-])+)([^,]*)$/)
  return m ? { candidate: m[1].replace(/\\(.)/g, "$1"), tail: m[2].trim() } : null
}

/** The compiler's input: Tailwind's theme inlined, the kit's token mapping
 * and dark variant read from kit.css itself (one source of truth). */
function entryCss(root: string): string {
  const kit = readFileSync(resolve(root, "dither-kit/tailwind/kit.css"), "utf8")
  const theme = kit.match(/@theme inline \{[\s\S]*?\n\}/)?.[0]
  const dark = kit.match(/@custom-variant dark[^;]*;/)?.[0]
  if (!theme || !dark)
    throw new Error("utility-map: dither-kit/tailwind/kit.css lost its @theme inline block or its dark variant")
  return [
    `@import "tailwindcss/theme.css" theme(inline reference);`,
    `@import "tailwindcss/utilities.css" source(none);`,
    dark,
    theme,
  ].join("\n")
}

/** Scan `dirs` for class candidates and compile every valid one. */
export async function buildUtilityMap(root = process.cwd(), dirs = UTILITY_SOURCES): Promise<UtilityMap> {
  const compiler = await compile(entryCss(root), { base: resolve(root, "src"), onDependency() {} })
  const scanner = new Scanner({
    sources: dirs.map((d) => ({ base: resolve(root, d), pattern: "**/*", negated: false })),
  })
  const css = compiler.build(scanner.scan())
  const map: UtilityMap = { order: {}, rules: {}, props: {} }
  let index = 0
  // A variant reaches the output either nested in its class (`.x { &:hover
  // { @media … } }`) or wrapped around it (`@media … { .x:hover { … } }`, how
  // Tailwind 4.3.3+ writes `hover:`): both become ONE chain, the selector's
  // tail first, then the at-rules outside in, then whatever nests inside.
  const add = (block: Block, at: string[]) => {
    if (block.prelude.startsWith("@")) {
      for (const child of block.children) add(child, [...at, block.prelude])
      return
    }
    const hit = candidateOf(block.prelude)
    if (!hit) return
    const rules: UtilityRule[] = []
    flatten(block, [...(hit.tail ? [`&${hit.tail}`] : []), ...at], rules)
    if (!rules.length) return
    map.order[hit.candidate] ??= index++
    ;(map.rules[hit.candidate] ??= []).push(...rules)
  }
  for (const block of parseCss(css)) {
    const prop = block.prelude.match(/^@property\s+(--[\w-]+)$/)
    if (prop) {
      const initial = block.decl.find(([k]) => k === "initial-value")
      if (initial) map.props[prop[1]] = initial[1]
      continue
    }
    add(block, [])
  }
  return map
}

const ID = "virtual-dither-utilities"

/** Rsbuild: `import map from "virtual-dither-utilities"` — an Rspack virtual
 * module compiled once per build (shared by every environment), recompiled
 * in watch mode when a source under UTILITY_SOURCES changes. */
export function utilityMap(root = process.cwd()): RsbuildPlugin {
  const file = resolve(root, "src/shared/lib/dither-utilities.virtual.js")
  const dirs = UTILITY_SOURCES.map((d) => resolve(root, d))
  const source = async () => `export default ${JSON.stringify(await buildUtilityMap(root))}`
  let cache: Promise<string> | null = null
  return {
    name: "dither-utilities",
    setup(api) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) =>
        mergeRsbuildConfig(config, { resolve: { alias: { [ID]: file } } }),
      )
      api.modifyRspackConfig(async (_, { rspack, appendPlugins }) => {
        const virtual = new rspack.experiments.VirtualModulesPlugin({ [file]: await (cache ??= source()) })
        appendPlugins([
          virtual,
          {
            apply(compiler: Rspack.Compiler) {
              compiler.hooks.watchRun.tapPromise("dither-utilities", async (c) => {
                if (![...(c.modifiedFiles ?? [])].some((f) => dirs.some((d) => f.startsWith(d)))) return
                cache = source()
                virtual.writeModule(file, await cache)
              })
            },
          },
        ])
      })
    },
  }
}
