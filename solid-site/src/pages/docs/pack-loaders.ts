// The docs' section packs as chunks of their own: the page evaluates only
// the pack it shows (every pack's code was evaluated at load, most of the
// docs' first script: measured, about 400ms of a 4x-throttled load), so
// moving to another family loads its chunk once. The open section's pack is
// asked for as its route is (`preloadOpenPacks`, from the route's
// `preload`), ahead of the page. Which sections a pack holds lives in
// `packs.ts`.
import { type Component, lazy } from "solid-js"
import { packOf, type PackName } from "@/pages/docs/packs"

/** Each pack's chunk. */
export const PACK_LOADERS = {
  FormDocs: () => import("./components/FormDocs"),
  PrimitivesDocs: () => import("./primitives/PrimitivesDocs"),
  TypographyDocs: () => import("./typography/TypographyDocs"),
  FeedbackDocs: () => import("./components/FeedbackDocs"),
  StructureDocs: () => import("./components/StructureDocs"),
  LayoutDocs: () => import("./components/LayoutDocs"),
  MediaDocs: () => import("./components/MediaDocs"),
  OverlayDocs: () => import("./components/OverlayDocs"),
  FieldDocs: () => import("./components/FieldDocs"),
  SelectionDocs: () => import("./components/SelectionDocs"),
  FormsDocs: () => import("./forms/FormsDocs"),
  SurfaceDocs: () => import("./components/SurfaceDocs"),
  NavigationDocs: () => import("./components/NavigationDocs"),
  AuthExamples: () => import("./examples/AuthExamples"),
  ProductExamples: () => import("./examples/ProductExamples"),
  SidebarExamples: () => import("./examples/SidebarExamples"),
  StatsExamples: () => import("./examples/StatsExamples"),
  TableExamples: () => import("./examples/TableExamples"),
  ChatExamples: () => import("./examples/ChatExamples"),
  NotificationsExamples: () => import("./examples/NotificationsExamples"),
  BackgroundsDocs: () => import("./backgrounds/BackgroundsDocs"),
  TextDocs: () => import("./text/TextDocs"),
  AnimationsDocs: () => import("./animations/AnimationsDocs"),
} satisfies Record<PackName, () => Promise<{ default: Component }>>

/** Each pack as a component that loads its chunk when first mounted. */
export const PACK_COMPONENTS = {} as Record<PackName, ReturnType<typeof lazy<Component>>>
for (const name of Object.keys(PACK_LOADERS) as PackName[]) PACK_COMPONENTS[name] = lazy(() => PACK_LOADERS[name]())

// A server renders a page whole: every pack is loaded before the first
// page is, so none suspends and streams in after the shell (the bytes then
// hold the section in place, as a reader without scripts needs it).
if (import.meta.env.SSR)
  await Promise.all((Object.keys(PACK_COMPONENTS) as PackName[]).map((name) => PACK_COMPONENTS[name].preload()))

/** Load the pack a section is in, so its page renders with it; a section
 * DocsPage writes itself has none. */
export function preloadOpenPacks(section: string): Promise<unknown> {
  const name = packOf(section)
  return name ? PACK_COMPONENTS[name].preload() : Promise.resolve()
}
