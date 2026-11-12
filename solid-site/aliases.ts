// Where the app's imports land, for the build and the specs alike
// (`tsconfig.json`'s `paths` says the same to the type checker: change both
// together).
import { fileURLToPath } from "node:url"

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/** The kit's Solid layer, any kit file, and the site's framework-free modules. */
export const ALIASES = [
  { find: /^@dither-kit$/, replacement: at("../dither-kit/solid/index.ts") },
  { find: /^@dither-kit\//, replacement: at("../dither-kit/") },
  { find: /^@\//, replacement: at("../src/") },
]

/** One Solid for the app and the kit beside it (the kit's files sit outside
 * this package, and a second copy would split reactivity and context). */
export const ONE_SOLID = ["solid-js", "solid-js/web", "solid-js/store"]
