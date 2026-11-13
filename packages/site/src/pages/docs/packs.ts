// The docs' section packs and the sections each holds (its sibling nav):
// a pack mounts only once one of its sections has been opened on this page,
// and stays mounted while it is among the last few read (its demos keep
// their state, going back is instant). The other 300-odd sections cost the
// page nothing until asked for (measured: mounting every pack put 27k nodes
// on a section's page, about 85 per section, for the one on screen), and a
// long read never holds them all (measured: every section opened in one tab
// kept 62k nodes and 461 canvases mounted). The prerender asks for all of
// them (`ALL_SECTIONS_PARAM`).
import { AUTH_NAV } from "./examples/auth-nav.ts"
import { CHAT_NAV } from "./examples/chat-nav.ts"
import { NOTIFICATIONS_NAV } from "./examples/notifications-nav.ts"
import { PRODUCT_NAV } from "./examples/product-nav.ts"
import { SIDEBAR_NAV } from "./examples/sidebar-nav.ts"
import { STATS_NAV } from "./examples/stats-nav.ts"
import { TABLE_NAV } from "./examples/table-nav.ts"
import { PRIMITIVES_NAV } from "./primitives/primitives-nav.ts"
import { TYPOGRAPHY_NAV } from "./typography/typography-nav.ts"
import { FORM_NAV } from "./components/form-nav.ts"
import { FORMS_NAV } from "./forms/forms-nav.ts"
import { FIELD_NAV } from "./components/field-nav.ts"
import { SELECTION_NAV } from "./components/selection-nav.ts"
import { FEEDBACK_NAV } from "./components/feedback-nav.ts"
import { STRUCTURE_NAV } from "./components/structure-nav.ts"
import { LAYOUT_NAV } from "./components/layout-nav.ts"
import { MEDIA_NAV } from "./components/media-nav.ts"
import { OVERLAY_NAV } from "./components/overlay-nav.ts"
import { SURFACE_NAV } from "./components/surface-nav.ts"
import { NAVIGATION_NAV } from "./components/navigation-nav.ts"
import { BACKGROUNDS_NAV } from "./backgrounds/backgrounds-nav.ts"
import { TEXT_NAV } from "./text/text-nav.ts"
import { ANIMATIONS_NAV } from "./animations/animations-nav.ts"

/** Each pack (by its component's name) and the sections it renders. */
export const PACKS = {
  PrimitivesDocs: PRIMITIVES_NAV,
  TypographyDocs: TYPOGRAPHY_NAV,
  AuthExamples: AUTH_NAV,
  ProductExamples: PRODUCT_NAV,
  SidebarExamples: SIDEBAR_NAV,
  StatsExamples: STATS_NAV,
  TableExamples: TABLE_NAV,
  ChatExamples: CHAT_NAV,
  NotificationsExamples: NOTIFICATIONS_NAV,
  FormDocs: FORM_NAV,
  FeedbackDocs: FEEDBACK_NAV,
  StructureDocs: STRUCTURE_NAV,
  LayoutDocs: LAYOUT_NAV,
  MediaDocs: MEDIA_NAV,
  FieldDocs: FIELD_NAV,
  SelectionDocs: SELECTION_NAV,
  FormsDocs: FORMS_NAV,
  OverlayDocs: OVERLAY_NAV,
  SurfaceDocs: SURFACE_NAV,
  NavigationDocs: NAVIGATION_NAV,
  BackgroundsDocs: BACKGROUNDS_NAV,
  TextDocs: TEXT_NAV,
  AnimationsDocs: ANIMATIONS_NAV,
} as const satisfies Record<string, readonly { id: string }[]>

export type PackName = keyof typeof PACKS

/** The query that mounts every pack at once (`/docs?all-sections`): the
 * prerender's, which lifts each section into its own page. */
export const ALL_SECTIONS_PARAM = "all-sections"

/** How many packs stay mounted: the one on screen and the last ones read
 * before it. */
export const PACKS_KEPT = 3

const PACK_OF = new Map<string, PackName>(
  (Object.entries(PACKS) as [PackName, readonly { id: string }[]][]).flatMap(([name, nav]) =>
    nav.map((i) => [i.id, name] as const),
  ),
)

/** The pack a section is in, or undefined for one DocsPage writes itself. */
export const packOf = (id: string): PackName | undefined => PACK_OF.get(id)

/** The packs kept mounted, least recently read first, after opening section
 * `id`: its pack moves to the end, and the oldest beyond `PACKS_KEPT` lets
 * go. A section DocsPage writes itself leaves them as they are. */
export function visitPack(kept: readonly PackName[], id: string): readonly PackName[] {
  const name = PACK_OF.get(id)
  if (!name || kept.at(-1) === name) return kept
  return [...kept.filter((k) => k !== name), name].slice(-PACKS_KEPT)
}

/** Whether a pack is mounted: it is among the packs kept, or every pack is
 * asked for. */
export const packOpen = (name: PackName, kept: readonly PackName[], all: boolean): boolean => all || kept.includes(name)
