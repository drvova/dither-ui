import { GROUPS } from "./groups"

/** The docs as pages: one section per page, in the sidebar's order. */
export const SECTION_IDS: readonly string[] = GROUPS.flatMap((g) => g.items.map((i) => i.id))

/** The section a docs URL names: canonical `/docs/<id>`, its directory form
 * `/docs/<id>/` (a static host's prerendered page) or the legacy
 * `#/docs/<id>`; "" for anything else, the docs' own front. */
export function sectionOf(path: string, hash: string): string {
  const id = (path.startsWith("/docs/") ? path.slice("/docs/".length) : hash.replace(/^#\/docs\/?/, "")).replace(
    /\/+$/,
    "",
  )
  return SECTION_IDS.includes(id) ? id : ""
}

/** A section as the pager and the breadcrumb name it. */
export type SectionRef = { id: string; label: string; group: string }
const REFS = new Map<string, SectionRef>(
  GROUPS.flatMap((g) => g.items.map((it) => [it.id, { id: it.id, label: it.label, group: g.title }] as const)),
)

/** The sections either side of one, in the sidebar's order. */
export function neighbours(id: string): { prev: SectionRef | null; next: SectionRef | null } {
  const at = SECTION_IDS.indexOf(id)
  const ref = (i: number) => (i >= 0 ? (REFS.get(SECTION_IDS[i] ?? "") ?? null) : null)
  return { prev: at > 0 ? ref(at - 1) : null, next: at >= 0 ? ref(at + 1) : null }
}

/** The group a section belongs to, which the breadcrumb links by its first section. */
export const groupOf = (id: string) => GROUPS.find((g) => g.items.some((it) => it.id === id)) ?? null
