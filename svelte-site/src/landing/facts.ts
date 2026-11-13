// The kit as the landing states it. Every figure is read, never typed: the
// component count from the Svelte kit's own barrel, the matrix and screens
// from its engine, the packages and version from its package.json, the docs
// families and their sizes from this site's docs IA (`docs/nav.ts`), which
// ships in the same bundle. A kit or docs change moves the page with it.
import * as kit from "@dither-kit-svelte"
import { SCREENS, SCREEN_KINDS } from "@dither-kit-svelte"
import pkg from "../../../dither-kit-svelte/package.json"
import { GROUPS } from "../docs/nav"
import type { MarkId } from "../shared/marks"

/** Every component the kit's barrel exports (a Svelte 5 component is a
 * function; the barrel's other capitalised names are data). */
export const COMPONENT_COUNT = Object.entries(kit).filter(
  ([name, value]) => /^[A-Z]/.test(name) && typeof value === "function",
).length

/** The threshold matrix every surface prints through, as the page writes it. */
export const MATRIX = `${SCREENS.bayer.length}×${SCREENS.bayer[0].length}`

/** The packages the kit needs beside Svelte, in its package.json's order. */
export const RUNTIME_DEPS = Object.keys(pkg.dependencies)

export const VERSION = pkg.version

export const SECTION_COUNT = GROUPS.reduce((n, g) => n + g.items.length, 0)

const SECTIONS = new Set(GROUPS.flatMap((g) => g.items.map((i) => i.id)))

/** A docs link. A section id the docs do not render throws, so a dead link
 * fails the page instead of shipping. */
export function docsHref(id?: string): string {
  if (id === undefined) return "#/docs"
  if (!SECTIONS.has(id)) throw new Error(`landing: no docs section "${id}"`)
  return `#/docs/${id}`
}

/** The big families, each with its size, a line and the section it opens on
 * (its first). */
const NOTES = {
  Components: "A live example, its props API and copy-ready code.",
  Backgrounds: "A full-bleed canvas surface on your palette.",
  Text: "A DOM text effect that honours reduced motion.",
  Animations: "An interaction or motion effect for any element.",
  Examples: "A whole screen composed from the kit.",
} as const

export const DOCS_FAMILIES = (Object.keys(NOTES) as (keyof typeof NOTES)[]).map((label) => {
  const group = GROUPS.find((g) => g.title === label)
  if (!group?.items.length) throw new Error(`landing: no docs family "${label}"`)
  return { label, note: NOTES[label], count: group.items.length, href: docsHref(group.items[0].id) }
})

/** The spec sheet that closes the install: label and value, each value read
 * from the kit where it can be. */
export const SPECS: readonly { label: string; value: string }[] = [
  { label: "Components", value: `${COMPONENT_COUNT} for Svelte 5, ported from the Solid kit` },
  { label: "Docs", value: `${SECTION_COUNT} live sections, each with its props and code` },
  { label: "Engine", value: `One seeded ${MATRIX} threshold matrix under every surface` },
  { label: "Screens", value: SCREEN_KINDS.join(", ") },
  { label: "Rendering", value: "Canvas on the CPU, one cell at a time" },
  { label: "Runes", value: "Svelte 5 runes only, no legacy API" },
  { label: "Packages", value: RUNTIME_DEPS.join(", ") },
  { label: "Styling", value: "Tailwind v4 over theme tokens you override" },
]

/** What the kit styles with, each under its own mark: Svelte 5, Tailwind v4
 * and the plain CSS custom properties it themes from. */
export const WORKS: readonly { id: MarkId; name: string }[] = [
  { id: "svelte", name: "Svelte 5" },
  { id: "tailwind", name: "Tailwind v4" },
  { id: "css", name: "CSS variables" },
]

/** The harnesses `bridge/dither-bridge.mjs` knows (its HARNESSES: ids and
 * names), in its order. */
export const HARNESSES: readonly { id: MarkId; name: string }[] = [
  { id: "claude", name: "Claude Code" },
  { id: "codex", name: "Codex" },
  { id: "gemini", name: "Gemini CLI" },
  { id: "qwen", name: "Qwen Code" },
  { id: "omp", name: "oh-my-pi" },
  { id: "goose", name: "Goose" },
  { id: "opencode", name: "OpenCode" },
  { id: "auggie", name: "Auggie" },
]
