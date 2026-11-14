// The docs' section packs and the sections each holds (its sibling nav, by
// the one table, `DOCS` in `groups.ts`): a pack mounts only once one of its
// sections has been opened on this page, and stays mounted while it is
// among the last few read (its demos keep their state, going back is
// instant). The other 300-odd sections cost the page nothing until asked
// for (measured: mounting every pack put 27k nodes on a section's page,
// about 85 per section, for the one on screen), and a long read never holds
// them all (measured: every section opened in one tab kept 62k nodes and
// 461 canvases mounted).
import { DOCS, type NavItem, type PackName } from "./groups.ts"

/** Each pack (by its component's name) and the sections it renders, in the
 * sidebar's order. */
export const PACKS = Object.fromEntries(DOCS.flatMap((family) => Object.entries(family.packs))) as Record<
  PackName,
  readonly NavItem[]
>

/** Every pack, in the sidebar's order. */
export const PACK_NAMES = Object.keys(PACKS) as PackName[]

/** How many packs stay mounted: the one on screen and the last ones read
 * before it. */
export const PACKS_KEPT = 3

const PACK_OF = new Map<string, PackName>(PACK_NAMES.flatMap((name) => PACKS[name].map((i) => [i.id, name] as const)))

/** The pack a section is in, or undefined for an id no section has. */
export const packOf = (id: string): PackName | undefined => PACK_OF.get(id)

/** The packs kept mounted, least recently read first, after opening section
 * `id`: its pack moves to the end, and the oldest beyond `PACKS_KEPT` lets
 * go. An id no section has leaves them as they are. */
export function visitPack(kept: readonly PackName[], id: string): readonly PackName[] {
  const name = PACK_OF.get(id)
  if (!name || kept.at(-1) === name) return kept
  return [...kept.filter((k) => k !== name), name].slice(-PACKS_KEPT)
}

/** Whether a pack is mounted: it is among the packs kept. */
export const packOpen = (name: PackName, kept: readonly PackName[]): boolean => kept.includes(name)
