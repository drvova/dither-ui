/**
 * The kit's sources import each other without an extension, as a bundler
 * reads them. Node strips their types itself but resolves no bare
 * `./pixel`, so this hook gives a relative import it cannot find its `.ts`.
 *
 * Use: node --import ./benches/resolve-ts.mts benches/node-bench.mts
 */
import { registerHooks } from "node:module"

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (error) {
      const missing = (error as NodeJS.ErrnoException).code === "ERR_MODULE_NOT_FOUND"
      if (!missing || !specifier.startsWith(".")) throw error
      return nextResolve(`${specifier}.ts`, context)
    }
  },
})
