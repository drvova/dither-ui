// The share card renderer as a page of the Solid site's build:
// `og/index.html`, the one canvas `window.og.files(id)` draws on. Its shell
// is `og-shell.html` beside this file and its script `@/pages/docs/og-page`
// (framework free); this is the small Vite build that makes the page,
// outside SolidStart (it has no app around it).
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { build } from "vite"
import { ALIASES } from "../aliases.ts"

const SHELL = fileURLToPath(new URL("./og-shell.html", import.meta.url))
const SCRIPT = fileURLToPath(new URL("../../src/pages/docs/og-page.ts", import.meta.url))

/** The shell with the build's files in its head: each stylesheet, then each
 * script as a module, addressed from the page's own folder. */
export function ogPage(shell: string, files: { scripts: string[]; styles: string[] }): string {
  if (!shell.includes("</head>")) throw new Error("og: the renderer's shell has no head to load its script from")
  if (!files.scripts.length) throw new Error("og: the renderer's build made no script")
  const tags = [
    ...files.styles.map((href) => `<link rel="stylesheet" crossorigin href="./${href}" />`),
    ...files.scripts.map((src) => `<script type="module" crossorigin src="./${src}"></script>`),
  ]
  return shell.replace("</head>", () => `${tags.map((t) => `  ${t}\n  `).join("")}</head>`)
}

/** Builds the renderer into `<out>/og/` (its script, its stylesheet and the
 * display face under `og/assets/`, every address relative so any base
 * serves it) and writes `og/index.html`. */
export async function buildOgPage(out: string): Promise<void> {
  const dir = join(out, "og")
  const built = await build({
    configFile: false,
    root: fileURLToPath(new URL("..", import.meta.url)),
    base: "./",
    publicDir: false,
    logLevel: "warn",
    resolve: { alias: ALIASES },
    build: { outDir: dir, emptyOutDir: false, assetsDir: "assets", rollupOptions: { input: SCRIPT } },
  })
  const output = (Array.isArray(built) ? built : [built]).flatMap((b) => ("output" in b ? b.output : []))
  const scripts = output.filter((f) => f.type === "chunk" && f.isEntry).map((f) => f.fileName)
  const styles = output.filter((f) => f.type === "asset" && f.fileName.endsWith(".css")).map((f) => f.fileName)
  await writeFile(join(dir, "index.html"), ogPage(await readFile(SHELL, "utf8"), { scripts, styles }))
}
