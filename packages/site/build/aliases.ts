// Where the app's imports land, for the build and the specs alike (the
// workspace root's `tsconfig.json` `paths` says the same to the type
// checker: change both together).
import { fileURLToPath } from "node:url"

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/** The app's one alias: its own source. Every other package is imported
 * by its name, through the workspace. */
export const ALIASES = [{ find: /^@\//, replacement: at("../src/") }]
