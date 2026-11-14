// The docs' opening page: their front (the title, the kit's spec, the
// intro) over the first section. The page sets its own head.
import type { RouteDefinition } from "@solidjs/router"
import DocsPage from "@/pages/docs/DocsPage"

// The first section's pack is asked for with the route, ahead of the page,
// as a section's route asks for its own (`[section].tsx`).
export const route = {
  preload: () => void import("@/pages/docs/pack-loaders").then((packs) => packs.preloadOpenPacks("")),
} satisfies RouteDefinition

export default function Docs() {
  return <DocsPage section="" />
}
