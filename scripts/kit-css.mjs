// Compile the kit's standalone stylesheet: dither-kit/kit.css (the tokens,
// the scoped base, Tailwind's utilities restricted to the kit's own sources)
// → dist/kit/dither-kit.css, for apps that style with anything but Tailwind.
// The same compiler and scanner @tailwindcss/vite runs, with no app around:
// the kit folders are the only sources, so the file holds exactly the
// classes the components use. Runs in `npm run build` (and build:css).
import { compile, optimize } from "@tailwindcss/node"
import { Scanner } from "@tailwindcss/oxide"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ENTRY = fileURLToPath(new URL("../dither-kit/kit.css", import.meta.url))

/** The compiled stylesheet, minified unless asked otherwise. */
export async function buildKitCss({ minify = true } = {}) {
  const base = dirname(ENTRY)
  const compiler = await compile(readFileSync(ENTRY, "utf8"), { base, shouldRewriteUrls: true, onDependency() {} })
  const roots = compiler.root === "none" ? [] : compiler.root === null ? [{ base, pattern: "**/*", negated: false }] : [{ ...compiler.root, negated: false }]
  const scanner = new Scanner({ sources: [...roots, ...compiler.sources] })
  const css = compiler.build(scanner.scan())
  return optimize(css, { minify }).code
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = resolve(process.argv[2] ?? fileURLToPath(new URL("../dist/kit/dither-kit.css", import.meta.url)))
  const css = await buildKitCss()
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, css)
  console.log(`kit css: ${(css.length / 1024).toFixed(1)} kB → ${out}`)
}
