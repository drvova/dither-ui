// What the docs' Run needs from the build: its compiler, Solid's own Babel
// preset, is written for Node. Its import helper reaches for Node's
// `assert` (Vite leaves an empty module in a browser's place, and the
// preset's first import then throws), and Babel's types read a flag off
// `process.env`, which a browser does not have. The helper gets the few
// lines of `assert` it uses and the flag its value, in the build and in the
// dev server's dependency bundles alike. Nothing else is touched.
import type { Plugin } from "vite"

const ID = "\0run-compiler:assert"
const ASSERT = `function assert(ok, message) {
  if (!ok) throw new Error(message || "Assertion failed")
}
assert.fail = (message) => {
  throw new Error(message || "Failed")
}
module.exports = assert
`
/** Babel 7's switch for Babel 8's stricter node types: off, as it is unset in Node. */
const FLAG = /\bprocess\.env\.BABEL_(?:TYPES_)?8_BREAKING\b/g
const inside = (id: string | undefined, pkg: string) => !!id?.replace(/\\/g, "/").includes(`/node_modules/${pkg}/`)

const resolver = {
  name: "run-compiler",
  resolveId: (id: string, importer?: string) =>
    id === "assert" && inside(importer, "@babel/helper-module-imports") ? ID : null,
  load: (id: string) => (id === ID ? ASSERT : null),
  transform: {
    filter: { id: /[\\/]node_modules[\\/]@babel[\\/]types[\\/]/ },
    handler: (code: string) => (code.includes("process.env.BABEL_") ? code.replace(FLAG, "false") : null),
  },
}

export function runCompiler(): Plugin {
  return {
    ...resolver,
    // before Vite's own resolver, which is the one that leaves the empty module
    enforce: "pre",
    config: () => ({ optimizeDeps: { rolldownOptions: { plugins: [resolver] } } }),
  }
}
