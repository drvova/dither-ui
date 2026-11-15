// The add command as the site hands it out: the `@dither-ui/add` script the
// build serves at `ADD_FILE`, the manifest and files it reads beside it
// (`build/kit-add.ts` writes them), the line that runs it, and the kit
// components a docs snippet uses, which a section's line names. Imported by
// the build's config and the crawler files as well as the docs, so it
// imports nothing.

/** Where the site serves the script, next to its pages. */
export const ADD_FILE = "add/dither-add.mjs"
/** What the script reads first: every file it can write and each
 * component's file set (the script's own `MANIFEST`). */
export const ADD_MANIFEST = "add/manifest.json"
/** Where the files only the script reads are served: the StyleX twin as a
 * copy imports it, the Tailwind layer's stylesheet entry. */
export const ADD_FILES = "add/files/"
/** The site the script reads when no `--from` names another (its `SITE`). */
export const ADD_SITE = "https://dither-ui.com/"

/** The line that adds `names` to a project: the script piped from `site`
 * (the page's own site, the default one unsaid) into Node, in `styling`
 * (Tailwind unsaid). */
export function addCommand(names: readonly string[], o: { styling?: string; site?: string } = {}): string {
  const site = o.site ?? ADD_SITE
  const flags: string[] = []
  if (o.styling && o.styling !== "tailwind") flags.push(`--styling ${o.styling}`)
  if (site !== ADD_SITE) flags.push(`--from ${site}`)
  return [`curl -fsSL ${site}${ADD_FILE} | node --input-type=module - add`, ...names, ...flags].join(" ")
}

/** Whether an export name is a component's: capitalized, never all capitals
 * (`DitherButton`, `XAxis`; not `BAYER8`). The build's manifest reads the
 * kit's index by it. */
export const isComponentName = (name: string): boolean => /^[A-Z](?=.*[a-z])\w*$/.test(name)

/** Solid's own components, which a snippet renders beside the kit's. */
const SOLID = new Set(["For", "Show", "Switch", "Match", "Index", "Dynamic", "Portal", "ErrorBoundary", "Suspense"])

/** The kit components a docs snippet uses, in order of first use: the
 * names it imports from `@dither-kit` and the tags it renders, less
 * Solid's and those the snippet defines itself. */
export function kitNamesIn(code: string): string[] {
  const own = new Set([...code.matchAll(/\b(?:function|const|let|class)\s+([A-Z]\w*)/g)].map((m) => m[1]))
  const names: string[] = []
  const take = (name: string) => {
    if (isComponentName(name) && !SOLID.has(name) && !own.has(name) && !names.includes(name)) names.push(name)
  }
  for (const m of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']@dither-kit["']/g))
    for (const raw of m[1].split(",")) {
      const spec = raw.trim()
      if (spec && !spec.startsWith("type ")) take(spec.split(/\s+as\s+/)[0])
    }
  for (const m of code.matchAll(/<([A-Z]\w*)[\s/>]/g)) take(m[1])
  return names
}
