// Compile the kit's standalone stylesheet: the kit's `tailwind/kit.css` (the
// tokens, the scoped base, Tailwind's utilities restricted to the kit's own
// sources) → kit/dither-kit.css in the site's build, for apps that style
// with anything but Tailwind. The same compiler and scanner the build's
// Tailwind plugin runs, with no app around: the kit folders are the only
// sources, so the file holds exactly the classes the components use. The
// site's post-build calls `buildKitCss`; `npm run build:css` at the
// workspace root writes the file alone, into the site's build.
import { compile, optimize } from "@tailwindcss/node"
import { Scanner } from "@tailwindcss/oxide"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

/** The stylesheet's entry, found as the kit's package exports it. */
const ENTRY = createRequire(import.meta.url).resolve("dither-kit/tailwind/kit.css")

/** The compiled stylesheet, minified unless asked otherwise. */
export async function buildKitCss({ minify = true } = {}) {
  const base = dirname(ENTRY)
  const compiler = await compile(readFileSync(ENTRY, "utf8"), { base, shouldRewriteUrls: true, onDependency() {} })
  const roots =
    compiler.root === "none"
      ? []
      : compiler.root === null
        ? [{ base, pattern: "**/*", negated: false }]
        : [{ ...compiler.root, negated: false }]
  const scanner = new Scanner({ sources: [...roots, ...compiler.sources] })
  const css = compiler.build(scanner.scan())
  return optimize(css, { minify }).code
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error("usage: node kit-css.mjs <out.css>")
  const out = resolve(process.argv[2])
  const css = await buildKitCss()
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, css)
  console.log(`kit css: ${(css.length / 1024).toFixed(1)} kB → ${out}`)
}
