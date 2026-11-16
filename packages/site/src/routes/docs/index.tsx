// The docs' opening page: their front (the title, the kit's spec, the
// intro) over the first section. A static page, its islands woken in the
// browser (`shared/lib/island`). The page sets its own head.
import type { RouteDefinition } from "@solidjs/router"
import DocsPage from "@/pages/docs/DocsPage"
import { DOCS } from "@/pages/docs/islands"
import { Static } from "@/shared/lib/island"

// The first section's pack is asked for with the route, ahead of the page,
// as a section's route asks for its own (`[section].tsx`).
export const route = {
  preload: () => void import("@/pages/docs/pack-loaders").then((packs) => packs.preloadOpenPacks("")),
} satisfies RouteDefinition

/** The page, on a server only. */
const OnServer = import.meta.env.SSR ? () => <DocsPage section="" /> : undefined

export default function Docs() {
  return <Static islands={DOCS} page={OnServer} />
}
