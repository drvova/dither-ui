// The figures the site states, counted once from their sources: the kit's
// public components (the `Dither*` exports of its Solid index) and the docs'
// sections and families (`GROUPS`). Every module takes them as `#dither-facts`
// (this package's `imports`): under Node (the configs, the post-build, the
// framework-free specs) that is this module, counting as it loads; in a
// Vite build or dev server `siteFacts()` answers it with the counts inlined,
// so a page carries three numbers, never the docs table or the kit's index.
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import type { Plugin } from "vite"
import { GROUPS } from "../src/pages/docs/groups.ts"

/** The kit's Solid index, wherever the workspace keeps it. */
const KIT_INDEX = createRequire(import.meta.url).resolve("@dither-ui/kit/solid/index.ts")

/** The kit's public components: each `Dither*` its Solid index exports. */
const components = [...readFileSync(KIT_INDEX, "utf8").matchAll(/\bdefault as (Dither\w+)/g)].length

/** Every docs family in sidebar order with its section count. */
const families = GROUPS.map((g) => ({ title: g.title, count: g.items.length }))

export const FACTS: {
  /** The kit's public `Dither*` components. */
  readonly components: number
  /** The docs' sections, one page each. */
  readonly sections: number
  readonly families: readonly { readonly title: string; readonly count: number }[]
} = { components, sections: families.reduce((n, f) => n + f.count, 0), families }

const ID = "#dither-facts"

/** `#dither-facts` for Vite: the counts as literals, ahead of the package's
 * `imports`, which would bundle this module's file reads. */
export function siteFacts(): Plugin {
  return {
    name: "dither-facts",
    enforce: "pre",
    resolveId: (id) => (id === ID ? `\0${ID}` : null),
    load: (id) => (id === `\0${ID}` ? `export const FACTS = ${JSON.stringify(FACTS)}` : null),
  }
}
