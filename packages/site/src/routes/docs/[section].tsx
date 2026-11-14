// One docs section per page (`/docs/<id>`); an id no section has is an
// address nothing lives at, and gets the missing page with its 404. The
// page sets its own head from the section; moving between sections keeps
// this route, so the page and the packs it has read stay mounted.
import { type RouteDefinition, useParams } from "@solidjs/router"
import { createMemo } from "solid-js"
import { SECTION_IDS } from "@/pages/docs/pages"
import DocsPage from "@/pages/docs/DocsPage"
import { lazyPart } from "@/shared/lib/lazy-part"

// The missing page, its own chunk: a section's page never carries it (nor
// its stylesheets, which held up every section's first paint). A static
// host serves `404.html` for an unknown section, whose head loads that
// chunk ahead, and the app renders it anew there (that file was rendered at
// its own address). A server renders it in place.
const Missing = lazyPart(() => import("../[...404]"))
if (import.meta.env.SSR) await Missing.preload()

// The section's pack is asked for with its route, ahead of the page. The
// route's preload ships in every page's entry, so the docs' pack table is
// fetched by it, never carried into the landing's or the Studio's first load.
export const route = {
  preload: ({ params }) =>
    void import("@/pages/docs/pack-loaders").then((packs) => packs.preloadOpenPacks(params.section ?? "")),
} satisfies RouteDefinition

export default function DocsSection() {
  const params = useParams()
  const known = createMemo(() => SECTION_IDS.includes(params.section ?? ""))
  const page = createMemo(() => (known() ? <DocsPage section={params.section ?? ""} /> : <Missing />))
  return <>{page()}</>
}
