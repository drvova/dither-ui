// What a docs preview is made of, as files: the example as a complete file
// (a fragment completed by `asSfc`, then translated by the page into a Solid
// `.tsx` module), the stylesheet it imports on CSS or CSS Modules, the
// kit's own source for every kit export the example imports, the kit's
// tokens, and a prompt that hands the lot to a coding agent. Pure: the panel
// fetches the kit sources and renders these. What does not read a kit file
// (a snippet's kind, its completion) is `@/widgets/source/model/files`,
// re-exported; what reads the kit's files is written here, since they are
// `.tsx`.
export { asSfc, snippetKind } from "@/widgets/source/model/files"
import type { snippetKind } from "@/widgets/source/model/files"

export type Lang = "tsx" | "ts" | "css" | "md" | "sh"

export interface SourceFile {
  /** Its path in the download: the example and prompt at the root, the
   * kit's files under the kit's folder. */
  path: string
  /** The tab label. */
  name: string
  lang: Lang
  role: "example" | "styles" | "kit" | "tokens" | "prompt"
  /** Where the kit's copy is served, relative to the site's base. */
  src?: string
  /** Generated content (the example, its stylesheet, the prompt). */
  text?: string
}

/** The kit's folder in a reader's project (and in the download). */
export const KIT_FOLDER = "dither-kit"
/** The kit's public index, inside the folder the build serves it from: the
 * components live in `solid/`, over the `engine/`. */
export const KIT_ENTRY = "solid/index.ts"
const PACKAGE = "@dither-kit"

/** A relative kit import (`./pixel`, `../engine/pixel`, `./DitherButton`) made in the kit file `from` (the kit's root
 * when omitted) as the kit file it names, if the kit has it. */
export function resolveKitFile(spec: string, files: readonly string[], from = ""): string | undefined {
  const parts = from.split("/").slice(0, -1)
  for (const seg of spec.split("/")) {
    if (seg === "..") parts.pop()
    else if (seg !== ".") parts.push(seg)
  }
  const p = parts.join("/")
  return [p, `${p}.ts`, `${p}.tsx`, `${p}/index.ts`].find((f) => files.includes(f))
}

/** A kit index (`export { default as X, y } from "./file"`) as export name →
 * the file that defines it (a path inside the kit) and its name there. */
export function kitIndex(
  index: string,
  files: readonly string[],
  at = "index.ts",
): Map<string, { file: string; name: string }> {
  const out = new Map<string, { file: string; name: string }>()
  for (const m of index.matchAll(/export\s*\{([^}]*)\}\s*from\s*["'](\.[^"']+)["']/g)) {
    const file = resolveKitFile(m[2], files, at)
    if (!file) continue
    for (const raw of m[1].split(",")) {
      const spec = raw.trim()
      if (!spec || spec.startsWith("type ")) continue
      const [name, as] = spec.split(/\s+as\s+/).map((x) => x.trim())
      out.set(as ?? name, { file, name })
    }
  }
  return out
}

/** A kit's whole index: its entry's exports (`kitIndex`) and those of every
 * kit file the entry re-exports whole (`export * from "../engine/api"`, the
 * engine's API every layer shares), each read through `read`. The entry's
 * own name for a thing wins. */
export async function loadKitIndex(
  read: (file: string) => Promise<string>,
  files: readonly string[],
  at = "index.ts",
  seen = new Set<string>(),
): Promise<Map<string, { file: string; name: string }>> {
  seen.add(at)
  const text = await read(at)
  const out = kitIndex(text, files, at)
  for (const m of text.matchAll(/export\s*\*\s*from\s*["'](\.[^"']+)["']/g)) {
    const file = resolveKitFile(m[1], files, at)
    if (!file || seen.has(file)) continue
    for (const [name, where] of await loadKitIndex(read, files, file, seen)) if (!out.has(name)) out.set(name, where)
  }
  return out
}

/** The kit files an example imports, in order of first use. */
export function kitFilesOf(
  example: string,
  exports: Map<string, { file: string; name: string }>,
  files: readonly string[],
): string[] {
  const out: string[] = []
  const add = (f?: string) => f && !out.includes(f) && out.push(f)
  for (const m of example.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    if (m[2] === PACKAGE)
      for (const raw of m[1].split(",")) {
        const name = raw
          .trim()
          .replace(/^type\s+/, "")
          .split(/\s+as\s+/)[0]
        if (name && !raw.trim().startsWith("type ")) add(exports.get(name)?.file)
      }
    else if (m[2].startsWith(`${PACKAGE}/`)) add(resolveKitFile(`./${m[2].slice(PACKAGE.length + 1)}`, files))
  }
  return out
}

const pascal = (id: string) => id.replace(/(^|[-_\s]+)([a-z0-9])/gi, (_, __, c: string) => c.toUpperCase())

/** The example's file name: `SwitchExample.tsx`, `install.sh`. */
export function exampleName(section: string, n: number, kind: ReturnType<typeof snippetKind>) {
  const suffix = n > 1 ? `${n}` : ""
  if (kind === "sfc" || kind === "fragment") return `${pascal(section || "docs")}Example${suffix}.tsx`
  return `${section || "example"}${suffix ? `-${suffix}` : ""}.${kind}`
}

/** Where a preview sits and what it shows: its section id, its place among
 * the section's previews, the section's title and line, its URL, and the
 * docs' install steps. */
export interface SourceContext {
  section: string
  n: number
  title: string
  description: string
  url: string
  install: string
}

export interface PromptContext {
  title: string
  description: string
  url: string
  install: string
  styling: string
}

const STYLE_NOTES: Record<string, string> = {
  tailwind: "Tailwind v4 utilities, as in the example; the kit's tokens (`theme.css`) are plain custom properties",
  css: "plain CSS, in the stylesheet the example imports; the kit's components read the tokens in `theme.css`",
  modules:
    "CSS Modules, in the `.module.css` the example imports as `styles`; the kit's components read the tokens in `theme.css`",
  stylex:
    "StyleX (`@stylexjs/stylex`, compiled by its bundler plugin) for the example's own elements: `{...stylex.props(…)}` on an element, the class it gives (`stylex.props(…).className`) as a kit component's `class`; the kit's components keep their own classes and read the tokens in `theme.css`",
}
/** Where a system without Tailwind gets the kit's own classes. */
const NO_TAILWIND = ". Without Tailwind, link the compiled kit stylesheet: https://dither-ui.com/kit/dither-kit.css"
/** prompt.md: the files handed to a coding agent, what to build, with
 * what, and how to check it against the live preview. */
export function promptFor(ctx: PromptContext, files: SourceFile[]): string {
  const example = files.find((f) => f.role === "example")
  const kit = files.filter((f) => f.role === "kit")
  const lines = [
    `# ${ctx.title}`,
    "",
    ctx.description,
    "",
    `Live preview: ${ctx.url}`,
    "",
    "## Build it",
    "",
    `- Stack: SolidJS (a \`.tsx\` component, signals) with TypeScript, and dither-kit (MIT) copied into the project — the kit is source you own, not a package.`,
    `- Styling: ${STYLE_NOTES[ctx.styling] ?? STYLE_NOTES.tailwind}${NO_TAILWIND}`,
    kit.length
      ? `- Uses: ${kit.map((f) => `\`${f.name}\` (\`${f.path}\`)`).join(", ")} — the kit's own source, included here so you read the real props, slots and defaults.`
      : "",
    "- Install:",
    "",
    "```sh",
    ctx.install,
    "```",
    "",
    "## Files",
    "",
    ...files.map((f) => `- \`${f.path}\` — ${ROLE[f.role]}`),
    "",
    "## Match the original",
    "",
    `- Render \`${example?.path ?? "the example"}\` and compare it with the live preview: the kit's dither is ordered (Bayer) and seeded, so the same props and seeds give the same pixels.`,
    "- Theme by overriding the tokens in `theme.css`, never by editing colours into the components.",
    "- Keep the floor the components already meet: a label on every control, visible focus rings, `prefers-reduced-motion` and `prefers-reduced-transparency` honoured.",
  ]
  return `${lines.filter((l, i) => l !== "" || lines[i - 1] !== "").join("\n")}\n`
}

const ROLE: Record<SourceFile["role"], string> = {
  example: "the example, as the preview renders it",
  styles: "the stylesheet the example imports",
  kit: "a kit file the example imports",
  tokens: "the kit's design tokens (light at `:root`, dark under `.dark`)",
  prompt: "this brief",
}
