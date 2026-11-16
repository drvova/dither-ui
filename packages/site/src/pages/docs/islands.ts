// The docs page's islands (`shared/lib/island`): the flow of the section's
// pack (its demos are live), the header's tools, the page's switches, the
// rails and the ad. The breadcrumb, the pager and the footer are the page's
// bytes.
import { islands, islandsReady } from "@/shared/lib/island"
import SpriteRoot from "@/shared/ui/SpriteRoot"

export const DOCS = islands(
  {
    /** The flow: the front's title over the section's pack. */
    flow: { load: () => import("./DocsPack"), when: "load" },
    /** The header with search and the sections sheet. */
    header: { load: () => import("./DocsHeader") },
    /** Styling, sounds and theme. */
    switches: { load: () => import("./DocsSwitches"), when: "idle" },
    /** The sections rail: its folds and its place. */
    nav: { load: () => import("./DocsNav"), when: "idle" },
    /** On this page and Share. */
    aside: { load: () => import("./DocsAside"), when: "idle" },
    /** The rail's ad, which loads only near the view. */
    ad: { load: () => import("@/shared/ui/AdSlot") },
  },
  SpriteRoot,
)

if (import.meta.env.SSR) await islandsReady(DOCS)
