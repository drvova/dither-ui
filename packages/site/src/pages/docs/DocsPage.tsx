import { Meta } from "@solidjs/meta"
import { Show } from "solid-js"
import { packOf } from "@/pages/docs/packs"
import { groupOf, neighbours, SECTION_IDS } from "@/pages/docs/pages"
import { docsMeta } from "@/pages/docs/seo"
import "@/shared/fonts/display.css"
import { version } from "../../../package.json"
import { routePath } from "@/shared/lib/routes"
import ToolMark from "@/shared/ui/ToolMark"
import { docsUrl } from "./DocsNav"
import { DOCS } from "./islands"
import PageHead from "./PageHead"
import "./DocsPage.css"

/** The docs' dark ground (`:root.dark[data-page="docs"]` in the site's
 * stylesheet): the browser chrome's colour until the page has painted and
 * the theme's switch (`DocsSwitches`) reads the ground as computed. */
export const DOCS_GROUND = "#101214"

type DocsPageProps = {
  /** The section this page shows (its route's), or "" for the docs' front,
   * which opens on the first section. */
  section: string
}

// One section per page: the URL names the section (`/docs/<id>`), the page
// shows that section alone, and the sidebar, search, the sheet and the
// pager are links to another's page (back and forward walk them). `/docs`
// itself opens on the first section. A static page (`shared/lib/island`):
// the shell is the page's bytes, and what moves is an island of `DOCS`
// (`islands.ts`): the section's pack, the header's tools, the switches,
// the rails and the ad.
export default function DocsPage(props: DocsPageProps) {
  const shown = props.section || SECTION_IDS[0] || ""
  /* Per-section search metadata: title, canonical, description and
     breadcrumb structured data, rendered with the page. `docsMeta("")`
     falls back to the generic /docs metadata. */
  const meta = docsMeta(props.section)
  const near = neighbours(shown)
  const crumbGroup = groupOf(shown)
  const pack = packOf(shown)

  return (
    <div class="docs-root min-h-dvh bg-background font-mono text-foreground antialiased">
      <PageHead page="docs" section={meta.id} />
      {/* the page's ground, in the theme the reader picked (the switches
          tint it as the theme turns) */}
      <Meta name="theme-color" content={DOCS_GROUND} />

      {/* The site's header, the landing's own: the docs add search and,
          under lg, the key that opens the sections sheet. */}
      <DOCS.header shown={shown} />

      <div class="mx-auto flex w-full max-w-6xl px-4 sm:px-6">
        {/* Sidebar */}
        <aside
          class="sticky top-16 hidden h-[calc(100dvh-4rem)] w-52 shrink-0 overflow-y-auto pr-8 pb-10 lg:block"
          aria-label="Sections"
        >
          <nav aria-label="Docs sections">
            <DOCS.nav activeId={shown} variant="rail" />
          </nav>
          <DOCS.ad />
        </aside>

        {/* Content */}
        <main class="min-w-0 flex-1 pb-24 lg:pl-10">
          {/* The page's row: where the reader is (the docs, then the
              section's group), and the switches that act on the whole page,
              what its code is written in, its sounds and its theme. */}
          <div class="mt-10 flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <Show when={crumbGroup}>
              {(group) => (
                <nav aria-label="Breadcrumb" class="text-[11px] text-muted-foreground">
                  <ol class="flex flex-wrap items-center gap-1.5">
                    <li>
                      <a
                        href={docsUrl(SECTION_IDS[0] ?? "")}
                        class="-my-1 inline-flex min-h-6 items-center transition-colors hover:text-foreground"
                      >
                        Docs
                      </a>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li>
                      <a
                        href={docsUrl(group().items[0]?.id ?? "")}
                        class="-my-1 inline-flex min-h-6 items-center transition-colors hover:text-foreground"
                        aria-current={group().items[0]?.id === shown ? "page" : undefined}
                      >
                        {group().title}
                      </a>
                    </li>
                  </ol>
                </nav>
              )}
            </Show>
            <DOCS.switches />
          </div>
          <Show when={pack}>{(name) => <DOCS.flow pack={name()} shown={shown} front={!props.section} />}</Show>

          {/* The book's turn: the sections either side, in the sidebar's order. */}
          <nav aria-label="Previous and next sections" class="mt-16 mb-6 grid max-w-2xl gap-3 sm:grid-cols-2">
            <Show when={near.prev}>
              {(prev) => (
                <a
                  href={docsUrl(prev().id)}
                  class="group rounded-xl border border-border/60 px-4 py-3 transition-colors hover:border-foreground/40"
                >
                  <span class="block text-[11px] text-muted-foreground">Previous, {prev().group}</span>
                  <span class="mt-1 block text-[14px] text-foreground">{prev().label}</span>
                </a>
              )}
            </Show>
            <Show when={near.next}>
              {(next) => (
                <a
                  href={docsUrl(next().id)}
                  class="group rounded-xl border border-border/60 px-4 py-3 text-right transition-colors hover:border-foreground/40 sm:col-start-2"
                >
                  <span class="block text-[11px] text-muted-foreground">Next, {next().group}</span>
                  <span class="mt-1 block text-[14px] text-foreground">{next().label}</span>
                </a>
              )}
            </Show>
          </nav>
        </main>

        <aside
          class="sticky top-16 hidden h-[calc(100dvh-4rem)] w-40 shrink-0 overflow-y-auto py-10 pl-6 xl:block"
          aria-label="This section"
        >
          <DOCS.aside shown={shown} share={!!(props.section && meta.id)} />
        </aside>
      </div>

      {/* Footer */}
      <footer class="border-t border-border/60">
        <div class="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-[11px] text-muted-foreground sm:px-6">
          <a href={routePath("/")} class="-my-1 py-1 transition-colors hover:text-foreground">
            dither-ui.com
          </a>
          <div class="flex items-center gap-4">
            <a
              href="https://github.com/drvova/dither-ui"
              target="_blank"
              rel="noreferrer"
              class="-my-1 flex items-center gap-1.5 py-1 transition-colors hover:text-foreground"
            >
              <ToolMark id="github" size={12} />
              GitHub<span class="sr-only"> (opens in a new tab)</span>
            </a>
            <span class="tabular-nums">v{version}</span>
            <span>MIT license</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
