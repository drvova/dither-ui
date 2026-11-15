// One docs section per page (`/docs/<id>`), a static page, its islands
// woken in the browser (`shared/lib/island`); an id no section has is an
// address nothing lives at, and gets the missing page with its 404. The
// page sets its own head from the section.
import { type RouteDefinition, useParams } from "@solidjs/router"
import DocsPage from "@/pages/docs/DocsPage"
import { DOCS } from "@/pages/docs/islands"
import { SECTION_IDS } from "@/pages/docs/pages"
import { Static } from "@/shared/lib/island"
import { lazyPart } from "@/shared/lib/lazy-part"

// The missing page, its own chunk: a section's page never carries it (nor
// its stylesheets, which held up every section's first paint). A static
// host serves `404.html` for an unknown section, whose head loads that
// chunk ahead, and the app renders it anew there (that file was rendered at
// its own address). A server renders it in place.
const Missing = lazyPart(() => import("../[...404]"))
if (import.meta.env.SSR) await Missing.preload()

// The section's pack (its island's chunk) is asked for with its route,
// ahead of the page. The route's preload ships in every page's entry, so
// the docs' pack table is fetched by it, never carried into the landing's
// or the Studio's first load.
export const route = {
  preload: ({ params }) =>
    void import("@/pages/docs/pack-loaders").then((packs) => packs.preloadOpenPacks(params.section ?? "")),
} satisfies RouteDefinition

/** The section's page, on a server only. */
const OnServer = import.meta.env.SSR ? () => <DocsPage section={useParams().section ?? ""} /> : undefined

export default function DocsSection() {
  const params = useParams()
  return SECTION_IDS.includes(params.section ?? "") ? <Static islands={DOCS} page={OnServer} /> : <Missing />
}
