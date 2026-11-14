// The docs' section packs as chunks of their own: the page evaluates only
// the pack it shows (every pack's code was evaluated at load, most of the
// docs' first script: measured, about 400ms of a 4x-throttled load), so
// moving to another family loads its chunk once. The open section's pack is
// asked for as its route is (`preloadOpenPacks`, from the routes'
// `preload`), ahead of the page. Which sections a pack holds lives in the
// one table, `DOCS` in `groups.ts`; this is the browser's half of it, the
// chunk each pack is (a table the build reads under Node cannot name them:
// its bundler would follow every chunk), held to that table's packs by the
// type, every pack once.
import type { Component } from "solid-js"
import { type PackName, SECTIONS } from "@/pages/docs/groups"
import { packOf } from "@/pages/docs/packs"
import { type LazyPart, lazyPart } from "@/shared/lib"

/** Each pack's chunk. */
export const PACK_LOADERS = {
  QuickStart: () => import("./overview/QuickStart"),
  PrimitivesDocs: () => import("./primitives/PrimitivesDocs"),
  TypographyDocs: () => import("./typography/TypographyDocs"),
  HandbookDocs: () => import("./handbook/HandbookDocs"),
  PageExamples: () => import("./examples/PageExamples"),
  AuthExamples: () => import("./examples/AuthExamples"),
  ProductExamples: () => import("./examples/ProductExamples"),
  SidebarExamples: () => import("./examples/SidebarExamples"),
  StatsExamples: () => import("./examples/StatsExamples"),
  TableExamples: () => import("./examples/TableExamples"),
  ChatExamples: () => import("./examples/ChatExamples"),
  NotificationsExamples: () => import("./examples/NotificationsExamples"),
  ChartDocs: () => import("./components/ChartDocs"),
  BasicsDocs: () => import("./components/BasicsDocs"),
  FormDocs: () => import("./components/FormDocs"),
  FieldDocs: () => import("./components/FieldDocs"),
  FormsDocs: () => import("./forms/FormsDocs"),
  SelectionDocs: () => import("./components/SelectionDocs"),
  FeedbackDocs: () => import("./components/FeedbackDocs"),
  StructureDocs: () => import("./components/StructureDocs"),
  LayoutDocs: () => import("./components/LayoutDocs"),
  MediaDocs: () => import("./components/MediaDocs"),
  OverlayDocs: () => import("./components/OverlayDocs"),
  SurfaceDocs: () => import("./components/SurfaceDocs"),
  NavigationDocs: () => import("./components/NavigationDocs"),
  BackgroundsDocs: () => import("./backgrounds/BackgroundsDocs"),
  TextDocs: () => import("./text/TextDocs"),
  AnimationsDocs: () => import("./animations/AnimationsDocs"),
  UtilsDocs: () => import("./utils/UtilsDocs"),
} satisfies Record<PackName, () => Promise<{ default: Component }>>

/** Each pack as a component that loads its chunk when first mounted. */
export const PACK_COMPONENTS = {} as Record<PackName, LazyPart<Component>>
for (const name of Object.keys(PACK_LOADERS) as PackName[]) PACK_COMPONENTS[name] = lazyPart(() => PACK_LOADERS[name]())

// A server renders a page whole: every pack is loaded before the first
// page is, so none suspends and streams in after the shell (the bytes then
// hold the section in place, as a reader without scripts needs it).
if (import.meta.env.SSR)
  await Promise.all((Object.keys(PACK_COMPONENTS) as PackName[]).map((name) => PACK_COMPONENTS[name].preload()))

/** Load the pack a section is in, so its page renders with it; "" is the
 * docs' front, which opens on the first section. */
export function preloadOpenPacks(section: string): Promise<unknown> {
  const name = packOf(section || (SECTIONS[0]?.id ?? ""))
  return name ? PACK_COMPONENTS[name].preload() : Promise.resolve()
}
