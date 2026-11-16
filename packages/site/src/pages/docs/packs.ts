// The docs' section packs and the sections each holds (its sibling nav, by
// the one table, `DOCS` in `groups.ts`): a section's page holds only its
// own pack (measured: mounting every pack put 27k nodes on a section's
// page, about 85 per section, for the one on screen), each section a page
// of its own.
import { DOCS, type NavItem, type PackName } from "./groups.ts"

/** Each pack (by its component's name) and the sections it renders, in the
 * sidebar's order. */
export const PACKS = Object.fromEntries(DOCS.flatMap((family) => Object.entries(family.packs))) as Record<
  PackName,
  readonly NavItem[]
>

/** Every pack, in the sidebar's order. */
export const PACK_NAMES = Object.keys(PACKS) as PackName[]

const PACK_OF = new Map<string, PackName>(PACK_NAMES.flatMap((name) => PACKS[name].map((i) => [i.id, name] as const)))

/** The pack a section is in, or undefined for an id no section has. */
export const packOf = (id: string): PackName | undefined => PACK_OF.get(id)
