// The landing's docs data: every docs family with its true size, the
// families "What's inside" lists, and the example bento's cards.
// Static on purpose — the landing does not load the docs IA — and held
// honest by tests/hub.spec.ts, which checks every id resolves to a docs
// section of the family it names and every count against the family's size.

/** Every docs family in sidebar order with its section count. */
export const FAMILIES = [
  { title: "Overview", count: 1 },
  { title: "Primitives", count: 19 },
  { title: "Typography", count: 25 },
  { title: "Handbook", count: 7 },
  { title: "Examples", count: 32 },
  { title: "Components", count: 100 },
  { title: "Backgrounds", count: 47 },
  { title: "Text", count: 24 },
  { title: "Animations", count: 50 },
  { title: "Utils", count: 2 },
] as const

export const SECTION_COUNT = FAMILIES.reduce((n, f) => n + f.count, 0)

const count = (title: string) => FAMILIES.find((f) => f.title === title)?.count ?? 0

/** The big families, each with a line and the section it opens on. */
export type DocsFamily = { label: string; count: number; note: string; first: string }
export const DOCS_FAMILIES: DocsFamily[] = [
  {
    label: "Components",
    count: count("Components"),
    note: "A live example, its props API and copy-ready code.",
    first: "area",
  },
  {
    label: "Backgrounds",
    count: count("Backgrounds"),
    note: "A full-bleed canvas surface on your palette.",
    first: "aurora",
  },
  {
    label: "Text",
    count: count("Text"),
    note: "A DOM text effect that honours reduced motion.",
    first: "gradient-text",
  },
  {
    label: "Animations",
    count: count("Animations"),
    note: "An interaction or motion effect for any element.",
    first: "animated-content",
  },
  { label: "Examples", count: count("Examples"), note: "A whole screen composed from the kit.", first: "dashboard" },
]

/** The example bento, row by row: live kit components, each a card that
 * leads into its docs section. Planned as one picture: neighbours, across
 * and down, are different kinds (a moving surface beside a figure, a
 * control or a statement, never two moving surfaces side by side), and no
 * card repeats another's words. Its layout lives on `Examples.vue`'s
 * `.t-<id>` cards. */
export type BentoTile = { id: string; label: string; family: string }
export const BENTO: BentoTile[] = [
  { id: "world", label: "3D model", family: "Components" },
  { id: "rating", label: "Rating", family: "Components" },
  { id: "stats-cards", label: "Stat card", family: "Examples" },
  { id: "print-screens", label: "Print screens", family: "Utils" },
  { id: "area", label: "Area chart", family: "Components" },
  { id: "ferrofluid", label: "Ferrofluid", family: "Backgrounds" },
  { id: "shader", label: "Shader", family: "Components" },
  { id: "decrypted-text", label: "Decrypted text", family: "Text" },
  { id: "styling", label: "Styling systems", family: "Handbook" },
  { id: "slide-action", label: "Slide action", family: "Animations" },
  { id: "button", label: "Button", family: "Components" },
  { id: "silk", label: "Silk", family: "Backgrounds" },
]

/** The beat between neighbours' reveals, seconds: the cards of a row arrive
 * one after another in reading order, never at once. */
export const STAGGER = 0.09

/** Each card's reveal delay from where it lies: its place left to right
 * among the cards that share its top, counting only those that start
 * inside the bento's width (a rail's cards beyond it arrive as they are
 * swiped in, on time). */
export const staggers = (boxes: readonly { top: number; left: number }[], width: number): number[] =>
  boxes.map((b) =>
    b.left >= width ? 0 : boxes.filter((o) => Math.abs(o.top - b.top) < 2 && o.left < b.left).length * STAGGER,
  )
