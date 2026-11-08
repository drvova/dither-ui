// The docs' section packs as chunks of their own: the page evaluates only
// the pack it shows (every pack's code was evaluated at load, most of the
// docs' first script: measured, about 400ms of a 4x-throttled load), and
// the browser fetches the rest at idle (prefetch), so moving to another
// family stays instant. The open section's pack is loaded before the page
// first renders (`preloadOpenPacks`, from `src/app/route-pages.ts`), so it never shows
// empty. Which sections a pack holds lives in `packs.ts`.
import { type Component, defineAsyncComponent } from "vue"
import { appPathname } from "@/shared/lib"
import { sectionOf } from "./pages"
import { ALL_SECTIONS_PARAM, PACKS, packOf, type PackName } from "./packs"

/** Each pack's chunk. */
export const PACK_LOADERS = {
  FormDocs: () => import(/* webpackPrefetch: true */ "./components/FormDocs.vue"),
  PrimitivesDocs: () => import(/* webpackPrefetch: true */ "./primitives/PrimitivesDocs.vue"),
  TypographyDocs: () => import(/* webpackPrefetch: true */ "./typography/TypographyDocs.vue"),
  FeedbackDocs: () => import(/* webpackPrefetch: true */ "./components/FeedbackDocs.vue"),
  StructureDocs: () => import(/* webpackPrefetch: true */ "./components/StructureDocs.vue"),
  LayoutDocs: () => import(/* webpackPrefetch: true */ "./components/LayoutDocs.vue"),
  MediaDocs: () => import(/* webpackPrefetch: true */ "./components/MediaDocs.vue"),
  OverlayDocs: () => import(/* webpackPrefetch: true */ "./components/OverlayDocs.vue"),
  FieldDocs: () => import(/* webpackPrefetch: true */ "./components/FieldDocs.vue"),
  SelectionDocs: () => import(/* webpackPrefetch: true */ "./components/SelectionDocs.vue"),
  FormsDocs: () => import(/* webpackPrefetch: true */ "./forms/FormsDocs.vue"),
  SurfaceDocs: () => import(/* webpackPrefetch: true */ "./components/SurfaceDocs.vue"),
  NavigationDocs: () => import(/* webpackPrefetch: true */ "./components/NavigationDocs.vue"),
  AuthExamples: () => import(/* webpackPrefetch: true */ "./examples/AuthExamples.vue"),
  ProductExamples: () => import(/* webpackPrefetch: true */ "./examples/ProductExamples.vue"),
  SidebarExamples: () => import(/* webpackPrefetch: true */ "./examples/SidebarExamples.vue"),
  StatsExamples: () => import(/* webpackPrefetch: true */ "./examples/StatsExamples.vue"),
  TableExamples: () => import(/* webpackPrefetch: true */ "./examples/TableExamples.vue"),
  ChatExamples: () => import(/* webpackPrefetch: true */ "./examples/ChatExamples.vue"),
  NotificationsExamples: () => import(/* webpackPrefetch: true */ "./examples/NotificationsExamples.vue"),
  BackgroundsDocs: () => import(/* webpackPrefetch: true */ "./backgrounds/BackgroundsDocs.vue"),
  TextDocs: () => import(/* webpackPrefetch: true */ "./text/TextDocs.vue"),
  AnimationsDocs: () => import(/* webpackPrefetch: true */ "./animations/AnimationsDocs.vue"),
} satisfies Record<PackName, () => Promise<{ default: Component }>>

/** Each pack as a component that loads its chunk when first mounted. */
export const PACK_COMPONENTS = {} as Record<PackName, Component>
for (const name of Object.keys(PACK_LOADERS) as PackName[])
  PACK_COMPONENTS[name] = defineAsyncComponent(PACK_LOADERS[name])

/** Load the packs the page opens on: the section in the address's, or
 * every pack for the prerender (`?all-sections`). */
export function preloadOpenPacks(): Promise<unknown> {
  if (new URLSearchParams(location.search).has(ALL_SECTIONS_PARAM))
    return Promise.all((Object.keys(PACKS) as PackName[]).map((name) => PACK_LOADERS[name]()))
  const name = packOf(sectionOf(appPathname(), location.hash))
  return name ? PACK_LOADERS[name]() : Promise.resolve()
}
