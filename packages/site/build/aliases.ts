// Where the app's imports land, for the build and the specs alike (the
// workspace root's `tsconfig.json` `paths` says the same to the type
// checker: change both together).
import { fileURLToPath } from "node:url"

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/** The app's own source, and the kit as a reader's copy names it. Every
 * other package is imported by its name, through the workspace; only the
 * docs' examples (`src/pages/docs/<pack>/examples/`), the files a reader
 * copies, import `@dither-kit`, which here is the kit's own package. */
export const ALIASES = [
  { find: /^@\//, replacement: at("../src/") },
  { find: /^@dither-kit$/, replacement: "@dither-ui/kit" },
]
