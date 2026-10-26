// What a docs preview is made of, as files: the example as a complete file
// in the reader's framework (a fragment gains its imports and template), the
// kit's own source for every kit export the example imports, the kit's
// tokens, and a prompt that hands the lot to a coding agent. Pure: the panel
// fetches the kit sources and renders these.

export type Flavor = "vue" | "svelte"
export type Lang = "vue" | "svelte" | "ts" | "css" | "md" | "sh"

export interface SourceFile {
  /** Its path in the download: the example and prompt at the root, the
   * kit's files under the kit's folder. */
  path: string
  /** The tab label. */
  name: string
  lang: Lang
  role: "example" | "kit" | "tokens" | "prompt"
  /** Where the kit's copy is served, relative to the site's base. */
  src?: string
  /** Generated content (the example, the prompt). */
  text?: string
}

export const KIT_FOLDER: Record<Flavor, string> = { vue: "dither-kit", svelte: "dither-kit-svelte" }
/** Each kit's public index, inside its folder: the Vue kit's components
 * live in a styling layer (`tailwind/`) over the shared `engine/`. */
export const KIT_INDEX: Record<Flavor, string> = { vue: "tailwind/index.ts", svelte: "index.ts" }
const PACKAGE: Record<Flavor, string> = { vue: "@dither-kit", svelte: "@dither-kit-svelte" }

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

/** A relative kit import (`./pixel`, `../engine/pixel`,
 * `./controls/Button.svelte`) made in the kit file `from` (the kit's root
 * when omitted) as the kit file it names, if the kit has it. */
export function resolveKitFile(spec: string, files: readonly string[], from = ""): string | undefined {
  const parts = from.split("/").slice(0, -1)
  for (const seg of spec.split("/")) {
    if (seg === "..") parts.pop()
    else if (seg !== ".") parts.push(seg)
  }
  const p = parts.join("/")
  return [p, `${p}.ts`, `${p}/index.ts`].find((f) => files.includes(f))
}

const VUE_API =
  /\b(ref|reactive|computed|watch|watchEffect|shallowRef|toRef|toRefs|nextTick|onMounted|onBeforeUnmount|onUnmounted)\b/g
const SCRIPT_LINE = /^(import|export|const|let|var|function|async function|type|interface|\/\/)\b|^\/\//

/** The kind of a snippet: a Vue SFC as written, a template fragment
 * (optionally led by loose script lines), or another language. */
export function snippetKind(code: string): "sfc" | "fragment" | "ts" | "css" | "sh" {
  const t = code.trim()
  if (/^<(script|template)\b/m.test(t)) return "sfc"
  const first = t.split("\n").find((l) => l.trim()) ?? ""
  const markup = /^\s*</m.test(t)
  if (first.startsWith("<")) return "fragment"
  if (markup && SCRIPT_LINE.test(first.trim())) return "fragment"
  if (/^(#|\$ |npx |npm |pnpm |bun |yarn )/.test(first)) return "sh"
  if (/^(\/\*|[:.#@a-z-][^\n{;=()]*\{)/.test(first) && !SCRIPT_LINE.test(first)) return "css"
  return "ts"
}

/** A Vue snippet as a complete SFC. A fragment's leading script lines (if
 * any) become its `<script setup>`, with the Vue APIs they call and the kit
 * exports the file uses imported; the markup becomes its `<template>`. */
export function asSfc(code: string, kitExports: ReadonlySet<string>): string {
  if (snippetKind(code) !== "fragment") return code
  const lines = code.replace(/^\n+|\s+$/g, "").split("\n")
  const at = lines.findIndex((l) => l.trim().startsWith("<"))
  const script = lines.slice(0, at).join("\n").trim()
  const markup = lines.slice(at)
  const used = new Set<string>()
  for (const m of markup.join("\n").matchAll(/<([A-Z][A-Za-z0-9]*)/g)) if (kitExports.has(m[1])) used.add(m[1])
  for (const m of code.matchAll(/\b([A-Za-z_]\w*)\s*\(/g)) if (kitExports.has(m[1])) used.add(m[1])
  const vue = [...new Set([...script.matchAll(VUE_API)].map((m) => m[1]))]
  const head = [
    vue.length ? `import { ${vue.join(", ")} } from "vue"` : "",
    used.size ? `import { ${[...used].join(", ")} } from "@dither-kit"` : "",
  ].filter(Boolean)
  const setup = [head.join("\n"), script].filter(Boolean).join("\n\n")
  const template = markup.map((l) => (l.trim() ? `  ${l}` : "")).join("\n")
  return `${setup ? `<script setup lang="ts">\n${setup}\n</script>\n\n` : ""}<template>\n${template}\n</template>`
}

/** The kit files an example imports, in order of first use. */
export function kitFilesOf(
  example: string,
  flavor: Flavor,
  exports: Map<string, { file: string; name: string }>,
  files: readonly string[],
): string[] {
  const pkg = PACKAGE[flavor]
  const out: string[] = []
  const add = (f?: string) => f && !out.includes(f) && out.push(f)
  for (const m of example.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    if (m[2] === pkg)
      for (const raw of m[1].split(",")) {
        const name = raw
          .trim()
          .replace(/^type\s+/, "")
          .split(/\s+as\s+/)[0]
        if (name && !raw.trim().startsWith("type ")) add(exports.get(name)?.file)
      }
    else if (m[2].startsWith(`${pkg}/`)) add(resolveKitFile(`./${m[2].slice(pkg.length + 1)}`, files))
  }
  return out
}

const pascal = (id: string) => id.replace(/(^|[-_\s]+)([a-z0-9])/gi, (_, __, c: string) => c.toUpperCase())

/** The example's file name: `SwitchExample.vue`, `install.sh`. */
export function exampleName(section: string, n: number, kind: ReturnType<typeof snippetKind>, flavor: Flavor) {
  const suffix = n > 1 ? `${n}` : ""
  if (kind === "sfc" || kind === "fragment") return `${pascal(section || "docs")}Example${suffix}.${flavor}`
  return `${section || "example"}${suffix ? `-${suffix}` : ""}.${kind}`
}

/** Where a preview sits and what it shows: its section id, its place among
 * the section's previews, the section's title and line, its URL, and the
 * docs' install steps per framework. */
export interface SourceContext {
  section: string
  n: number
  title: string
  description: string
  url: string
  install: Record<Flavor, string>
}

export interface PromptContext {
  title: string
  description: string
  url: string
  install: string
  flavor: Flavor
  styling: string
}

const STYLE_NOTES: Record<string, string> = {
  tailwind: "Tailwind v4 utilities, as in the example; the kit's tokens (`theme.css`) are plain custom properties",
  css: "plain CSS — the example's own `<style>` block; the kit's components read the tokens in `theme.css`",
  modules: "CSS Modules — the example's `<style module>`; the kit's components read the tokens in `theme.css`",
  stylex:
    "StyleX (`@stylexjs/stylex`, compiled by its bundler plugin); the kit's components read the tokens in `theme.css`",
}

/** prompt.md: the files handed to a coding agent — what to build, with
 * what, and how to check it against the live preview. */
export function promptFor(ctx: PromptContext, files: SourceFile[]): string {
  const example = files.find((f) => f.role === "example")
  const kit = files.filter((f) => f.role === "kit")
  const framework =
    ctx.flavor === "vue" ? 'Vue 3 (`<script setup lang="ts">`)' : 'Svelte 5 (runes, `<script lang="ts">`)'
  const lines = [
    `# ${ctx.title}`,
    "",
    ctx.description,
    "",
    `Live preview: ${ctx.url}`,
    "",
    "## Build it",
    "",
    `- Stack: ${framework} with TypeScript, and dither-kit (MIT) copied into the project — the kit is source you own, not a package.`,
    `- Styling: ${STYLE_NOTES[ctx.styling] ?? STYLE_NOTES.tailwind}. Without Tailwind, link the compiled kit stylesheet: https://dither-ui.com/kit/dither-kit.css`,
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
  kit: "a kit file the example imports",
  tokens: "the kit's design tokens (light at `:root`, dark under `.dark`)",
  prompt: "this brief",
}
