// `virtual-dither-utilities` for Vite: the map from each Tailwind class the
// site writes to its declarations, which the styling rewriter reads
// (`restyle`). Built once per run by the builder the specs use too
// (`restyle/utility-map`), from the folders `utility-sources.ts` names.
import type { Plugin } from "vite"
import { buildUtilityMap } from "restyle/utility-map"
import { UTILITY_SOURCES } from "./utility-sources.ts"

const ID = "virtual-dither-utilities"

export function utilityMap(): Plugin {
  let source: Promise<string> | null = null
  return {
    name: "dither-utilities",
    resolveId: (id) => (id === ID ? `\0${ID}` : null),
    load: (id) =>
      id === `\0${ID}`
        ? (source ??= buildUtilityMap(UTILITY_SOURCES).then((map) => `export default ${JSON.stringify(map)}`))
        : null,
  }
}
