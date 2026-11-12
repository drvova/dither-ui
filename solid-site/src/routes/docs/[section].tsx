// One docs section per page (`/docs/<id>`); an id no section has is an
// address nothing lives at, and gets the missing page with its 404. The
// page sets its own head from the section; moving between sections keeps
// this route, so the page and the packs it has read stay mounted.
import { type RouteDefinition, useParams } from "@solidjs/router"
import { createMemo } from "solid-js"
import { SECTION_IDS } from "@/pages/docs/pages"
import { DocsPage, preloadOpenPacks } from "~/pages/docs"
import Missing from "../[...404]"

// The section's pack is asked for with its route, ahead of the page.
export const route = {
  preload: ({ params }) => void preloadOpenPacks(params.section ?? ""),
} satisfies RouteDefinition

export default function DocsSection() {
  const params = useParams()
  const known = createMemo(() => SECTION_IDS.includes(params.section ?? ""))
  // Called, not mounted as a component: the missing page then hydrates over
  // the bytes a static host serves for this address (`404.html`, rendered
  // as that route's own component).
  const page = createMemo(() => (known() ? <DocsPage section={params.section ?? ""} /> : Missing()))
  return <>{page()}</>
}
