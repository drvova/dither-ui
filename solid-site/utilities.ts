// `virtual-dither-utilities` for Vite: the map from each Tailwind class the
// site writes to its declarations, which the styling rewriter reads
// (`@/shared/lib/restyle-rewrite`). Built once per run by the builder the
// root's specs use too (`../src/shared/lib/utility-map.ts`).
import { fileURLToPath } from "node:url"
import type { Plugin } from "vite"
import { buildUtilityMap } from "../src/shared/lib/utility-map.ts"

const ID = "virtual-dither-utilities"
const ROOT = fileURLToPath(new URL("..", import.meta.url))

export function utilityMap(): Plugin {
  let source: Promise<string> | null = null
  return {
    name: "dither-utilities",
    resolveId: (id) => (id === ID ? `\0${ID}` : null),
    load: (id) =>
      id === `\0${ID}`
        ? (source ??= buildUtilityMap(ROOT).then((map) => `export default ${JSON.stringify(map)}`))
        : null,
  }
}
