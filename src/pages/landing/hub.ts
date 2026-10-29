// The landing's docs data: every docs family with its true size (the
// directory's chart), the big families the footer leads into, and the
// directory's bento.
// Static on purpose — the landing does not load the docs IA — and held
// honest by tests/hub.spec.ts, which checks every id resolves to a docs
// section of the family it names and every count against the family's size.

/** Every docs family in sidebar order with its section count: the
 * directory's chart draws one bar per family. */
export const FAMILIES = [
  { title: "Overview", count: 1 },
  { title: "Primitives", count: 19 },
  { title: "Typography", count: 25 },
  { title: "Handbook", count: 5 },
  { title: "Examples", count: 32 },
  { title: "Components", count: 100 },
  { title: "Backgrounds", count: 46 },
  { title: "Text", count: 24 },
  { title: "Animations", count: 49 },
  { title: "Utils", count: 1 },
] as const

export const SECTION_COUNT = FAMILIES.reduce((n, f) => n + f.count, 0)

const count = (title: string) => FAMILIES.find((f) => f.title === title)?.count ?? 0

/** The big families, each with the section it opens on. */
export type DocsFamily = { label: string; count: number; first: string }
export const DOCS_FAMILIES: DocsFamily[] = [
  { label: "Components", count: count("Components"), first: "area" },
  { label: "Backgrounds", count: count("Backgrounds"), first: "aurora" },
  { label: "Text", count: count("Text"), first: "gradient-text" },
  { label: "Animations", count: count("Animations"), first: "animated-content" },
  { label: "Examples", count: count("Examples"), first: "dashboard" },
]

/** The directory's bento, row by row: big live kit components, each a
 * tile that leads into its docs section. Its layout lives on `Hub.vue`'s
 * `.t-<id>` tiles. */
export type BentoTile = { id: string; label: string; family: string }
export const BENTO: BentoTile[] = [
  { id: "radar", label: "Radar chart", family: "Components" },
  { id: "world", label: "3D model", family: "Components" },
  { id: "meta-balls", label: "Meta balls", family: "Animations" },
  { id: "decrypted-text", label: "Decrypted text", family: "Text" },
  { id: "stats-cards", label: "Stat card", family: "Examples" },
  { id: "rating", label: "Rating", family: "Components" },
  { id: "pie", label: "Pie chart", family: "Components" },
  { id: "progress", label: "Progress", family: "Components" },
  { id: "galaxy", label: "Galaxy", family: "Backgrounds" },
]
