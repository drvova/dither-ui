import { OVERVIEW_NAV } from "./overview/overview-nav.ts"
import { PRIMITIVES_NAV } from "./primitives/primitives-nav.ts"
import { TYPOGRAPHY_NAV } from "./typography/typography-nav.ts"
import { HANDBOOK_NAV } from "./handbook/handbook-nav.ts"
import { PAGE_NAV } from "./examples/page-nav.ts"
import { AUTH_NAV } from "./examples/auth-nav.ts"
import { PRODUCT_NAV } from "./examples/product-nav.ts"
import { SIDEBAR_NAV } from "./examples/sidebar-nav.ts"
import { STATS_NAV } from "./examples/stats-nav.ts"
import { TABLE_NAV } from "./examples/table-nav.ts"
import { CHAT_NAV } from "./examples/chat-nav.ts"
import { NOTIFICATIONS_NAV } from "./examples/notifications-nav.ts"
import { CHART_NAV } from "./components/chart-nav.ts"
import { BASICS_NAV } from "./components/basics-nav.ts"
import { FORM_NAV } from "./components/form-nav.ts"
import { FIELD_NAV } from "./components/field-nav.ts"
import { FORMS_NAV } from "./forms/forms-nav.ts"
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
import { UTILS_NAV } from "./utils/utils-nav.ts"

// The docs' IA, the single source of truth for section ids, labels,
// families and the packs that render them: each family (a sidebar group) is
// its packs in order, each pack (by its component's name) the sections it
// renders, its sibling `*-nav.ts`. Section ids are permanent deep links
// (`/docs/<id>`): relabel freely, never rename an id. Read under Node too
// (the build's crawl files): its imports stay `.ts` and data only, so each
// pack's chunk is named beside it, in `pack-loaders.ts`.

/** A section as the docs name it: its id, its sidebar label and, where the
 * section's heading says more than the label, that heading. */
export type NavItem = { readonly id: string; readonly label: string; readonly title?: string }

export const DOCS = [
  { title: "Overview", packs: { QuickStart: OVERVIEW_NAV } },
  { title: "Primitives", packs: { PrimitivesDocs: PRIMITIVES_NAV } },
  { title: "Typography", packs: { TypographyDocs: TYPOGRAPHY_NAV } },
  { title: "Handbook", packs: { HandbookDocs: HANDBOOK_NAV } },
  {
    title: "Examples",
    packs: {
      PageExamples: PAGE_NAV,
      AuthExamples: AUTH_NAV,
      ProductExamples: PRODUCT_NAV,
      SidebarExamples: SIDEBAR_NAV,
      StatsExamples: STATS_NAV,
      TableExamples: TABLE_NAV,
      ChatExamples: CHAT_NAV,
      NotificationsExamples: NOTIFICATIONS_NAV,
    },
  },
  {
    title: "Components",
    packs: {
      ChartDocs: CHART_NAV,
      BasicsDocs: BASICS_NAV,
      FormDocs: FORM_NAV,
      FieldDocs: FIELD_NAV,
      FormsDocs: FORMS_NAV,
      SelectionDocs: SELECTION_NAV,
      FeedbackDocs: FEEDBACK_NAV,
      StructureDocs: STRUCTURE_NAV,
      LayoutDocs: LAYOUT_NAV,
      MediaDocs: MEDIA_NAV,
      OverlayDocs: OVERLAY_NAV,
      SurfaceDocs: SURFACE_NAV,
      NavigationDocs: NAVIGATION_NAV,
    },
  },
  { title: "Backgrounds", packs: { BackgroundsDocs: BACKGROUNDS_NAV } },
  { title: "Text", packs: { TextDocs: TEXT_NAV } },
  { title: "Animations", packs: { AnimationsDocs: ANIMATIONS_NAV } },
  { title: "Utils", packs: { UtilsDocs: UTILS_NAV } },
] as const satisfies readonly { title: string; packs: Record<string, readonly NavItem[]> }[]

type Packs = (typeof DOCS)[number]["packs"]
/** A pack of sections, by its component's name. */
export type PackName = Packs extends infer P ? (P extends unknown ? keyof P : never) : never
/** Every section id the docs have. */
export type SectionId = (Packs extends infer P ? (P extends unknown ? P[keyof P] : never) : never)[number]["id"]

export interface DocsGroup {
  title: string
  items: readonly NavItem[]
}

/** The sidebar's groups: each family's sections, its packs' in order. */
export const GROUPS: DocsGroup[] = DOCS.map((family) => ({
  title: family.title,
  items: Object.values<readonly NavItem[]>(family.packs).flat(),
}))

export const SECTIONS = GROUPS.flatMap((g) => g.items)

const ITEMS = new Map<string, NavItem>(SECTIONS.map((s) => [s.id, s]))

/** A section's nav item: what its element, its heading and its links say. */
export function sectionItem(id: SectionId): NavItem {
  const item = ITEMS.get(id)
  if (!item) throw new Error(`No docs section "${id}"`)
  return item
}

/** The words a section's heading prints: its title, else its label. */
export const headingOf = (item: NavItem): string => item.title ?? item.label
