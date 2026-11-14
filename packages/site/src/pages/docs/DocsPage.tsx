import { DitherCommand, DitherIcon } from "@dither-ui/kit"
import { Meta } from "@solidjs/meta"
import { useNavigate } from "@solidjs/router"
import { createEffect, createMemo, createSignal, For, on, onCleanup, onMount, Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import { GROUPS, type PackName } from "@/pages/docs/groups"
import { PACK_NAMES, packOpen, visitPack } from "@/pages/docs/packs"
import { groupOf, neighbours, sectionOf, SECTION_IDS } from "@/pages/docs/pages"
import { docsMeta } from "@/pages/docs/seo"
import "@/shared/fonts/display.css"
import { version } from "../../../package.json"
import { modKey, routePath, useTheme } from "@/shared/lib"
import { restoreStyling, setStyling, STYLING_LABELS, styling, STYLINGS } from "@/shared/lib/restyle"
import { play, restoreSounds, setSounds, sounds } from "@/shared/lib/sound"
import AdSlot from "@/shared/ui/AdSlot"
import Mascot from "@/shared/ui/Mascot"
import ToolMark from "@/shared/ui/ToolMark"
import { SiteHeader } from "@/widgets/site-header"
import DocsNav, { docsUrl, type PagePart } from "./DocsNav"
import DocsSheet, { SHEET_ID } from "./DocsSheet"
import { SHOWN_SECTION } from "./DocSection"
import PageHead from "./PageHead"
import OnThisPage from "./OnThisPage"
import { PACK_COMPONENTS } from "./pack-loaders"
import SectionShare from "./SectionShare"
import "./DocsPage.css"

/** The docs' dark ground (`:root.dark[data-page="docs"]` in the site's
 * stylesheet): the browser chrome's colour until the page has painted and
 * `useTheme` reads the ground as computed. */
export const DOCS_GROUND = "#101214"

const commandItems = GROUPS.flatMap((g) => g.items.map((it) => ({ value: it.id, label: it.label, group: g.title })))

const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth")

type DocsPageProps = {
  /** The section this page shows (its route's), or "" for the docs' front,
   * which opens on the first section. */
  section: string
}

// One section per page: the URL names the section (`/docs/<id>`), the page
// shows that section alone, and the sidebar, search, the sheet and the
// pager open another as a new history entry (back and forward walk them).
// `/docs` itself opens on the first section. The address is the router's:
// each section is a route, and moving between them stays on this page.
export default function DocsPage(props: DocsPageProps) {
  const navigate = useNavigate()

  const activeId = () => props.section
  const shown = createMemo(() => activeId() || SECTION_IDS[0] || "")

  /* Per-section search metadata follows the section in view: title,
     canonical, description and breadcrumb structured data, rendered with
     the page on the server and kept in step as the section changes.
     `docsMeta("")` falls back to the generic /docs metadata. */
  const meta = createMemo(() => docsMeta(activeId()))

  /* On this page (xl and up, the rail right of the content): the parts of the
     section on this page, read from its DOM as it opens: its heading,
     each gallery heading and its props table. Headings inside a preview are
     the demo's, not the section's. */
  /** The docs' flow: every section a direct child of it. */
  let flow: HTMLDivElement | undefined
  /* Counts the sections arriving in the flow: a pack is a chunk of its own
     (`pack-loaders.ts`) and renders its sections after the page has, so
     whatever reads the flow's sections reads them again as they come (the
     hiding once missed them, and a family's every section showed at once). */
  const [arrived, setArrived] = createSignal(0)
  onMount(() => {
    if (!flow || typeof MutationObserver === "undefined") return
    const arrivals = new MutationObserver(() => setArrived((n) => n + 1))
    arrivals.observe(flow, { childList: true })
    onCleanup(() => arrivals.disconnect())
  })
  const [onPage, setOnPage] = createSignal<PagePart[]>([])
  /* Read once the flow has mounted too: a page opened straight on a section
     never changes `shown`, and the rail stood empty. */
  createEffect(
    on([shown, arrived], ([id]) => {
      const section = id ? document.getElementById(id) : null
      setOnPage(
        section
          ? [...section.querySelectorAll<HTMLElement>("h2, h3, table")]
              .filter((el) => !el.closest("[data-demo-card]"))
              .map((el) =>
                el.tagName === "TABLE" ? { label: "API", el } : { label: el.textContent?.trim() ?? "", el },
              )
          : [],
      )
    }),
  )
  function goTo(el: HTMLElement) {
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 88, behavior: smooth() })
  }

  /** Open a section: its page, a new history entry, read from the top. */
  function open(id: string) {
    if (!SECTION_IDS.includes(id)) return
    if (id !== activeId()) navigate(docsUrl(id), { resolve: false, scroll: false })
    else window.scrollTo({ top: 0, behavior: "auto" })
  }
  // Each section reads from its top, however it was reached (a link, the
  // search, back and forward).
  createEffect(on(activeId, () => window.scrollTo({ top: 0, behavior: "auto" }), { defer: true }))

  /* Only the section on this page shows. A pack of sections mounts once one
     of them has been opened here (`packs.ts`), then stays, hidden while
     another shows, while it is among the last `PACKS_KEPT` read, so going
     back is instant and keeps each demo's state, and a long read never holds
     the whole docs. */
  const kept = createMemo<readonly PackName[]>((before) => visitPack(before, shown()), [])
  createEffect(
    on([shown, arrived], ([id]) => {
      for (const s of flow?.querySelectorAll<HTMLElement>(":scope > section") ?? []) s.hidden = s.id !== id
    }),
  )

  const near = createMemo(() => neighbours(shown()))
  const crumbGroup = createMemo(() => groupOf(shown()))

  /* Docs search: the kit's own Command palette navigating the whole IA. */
  const [searchOpen, setSearchOpen] = createSignal(false)
  /* The sections sheet (under lg): the header's sections key opens it from
     anywhere on the page. A pick closes it first, so the page is free to scroll. */
  const [sheetOpen, setSheetOpen] = createSignal(false)
  function fromSheet(go: () => void) {
    setSheetOpen(false)
    queueMicrotask(go)
  }
  function searchHotkey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault()
      setSearchOpen(!searchOpen())
    }
  }
  function searchGo(id: string) {
    open(id)
  }

  /* Theme: dark by default, remembered, revealed as a circle from the toggle. */
  const { dark, ground, revealToggle } = useTheme()
  function flipTheme(e: MouseEvent) {
    play("theme")
    revealToggle(e)
  }
  /* Interface sounds (Kobra's): taps, switches, copies — the reader's switch. */
  function flipSounds() {
    setSounds(!sounds())
    if (sounds()) play("on")
  }
  /* A header toggle taps only when it changes something. */
  function choose(apply: () => void, already: boolean) {
    if (!already) play("tap")
    apply()
  }
  /* The search hint names the modifier the visitor actually has (read in
     the browser: a server knows no keyboard). */
  const [searchKbd, setSearchKbd] = createSignal(modKey("K", false))

  onMount(() => {
    setSearchKbd(modKey("K"))
    // the reader's own switches, read once in a browser
    restoreSounds()
    restoreStyling()
    window.addEventListener("keydown", searchHotkey)
    // A legacy link (`#/docs/<id>` on the docs' own address) lands on its
    // section's page, in place of the entry it came by.
    const legacy = () => {
      const id = activeId() ? "" : sectionOf("", location.hash)
      if (id) navigate(docsUrl(id), { resolve: false, replace: true, scroll: false })
    }
    legacy()
    window.addEventListener("hashchange", legacy)
    // The page opens on the section its URL names; each section reads from
    // its top, so the browser's own scroll restoration stays out of it.
    const restoration = history.scrollRestoration
    history.scrollRestoration = "manual"
    onCleanup(() => {
      window.removeEventListener("keydown", searchHotkey)
      window.removeEventListener("hashchange", legacy)
      history.scrollRestoration = restoration
    })
  })

  /** A pack of sections, mounted once one of them has been opened here. */
  const Pack = (p: { name: PackName }) => (
    <Show when={packOpen(p.name, kept())}>
      <Dynamic component={PACK_COMPONENTS[p.name]} />
    </Show>
  )
  /** A link that opens a section here, its address the section's own. */
  const to = (id: string) => (e: MouseEvent) => {
    e.preventDefault()
    open(id)
  }

  return (
    <div class="docs-root min-h-dvh bg-background font-mono text-foreground antialiased">
      <PageHead page="docs" section={meta().id} />
      {/* the page's ground, in the theme the reader picked */}
      <Meta name="theme-color" content={ground() ?? DOCS_GROUND} />

      {/* The site's header, the landing's own: the docs add search and,
          under lg, the key that opens the sections sheet. */}
      <SiteHeader
        current="docs"
        tools={
          <>
            <button
              type="button"
              class="nav-a gap-1.5 text-muted-foreground"
              aria-label="Search docs"
              onClick={() => setSearchOpen(true)}
            >
              <DitherIcon name="Search" size={12} strokeWidth={1.5} />
              <span class="max-sm:sr-only">Search</span>
              <kbd class="hidden rounded border border-border/60 px-1 text-[10px] md:inline">{searchKbd()}</kbd>
            </button>
            <button
              type="button"
              class="flex size-8 items-center justify-center transition-colors hover:text-foreground lg:hidden"
              aria-label="Browse sections"
              aria-haspopup="dialog"
              aria-expanded={sheetOpen()}
              aria-controls={SHEET_ID}
              onClick={() => setSheetOpen(true)}
            >
              <DitherIcon name="Book" size={15} strokeWidth={1.5} />
            </button>
          </>
        }
      />

      <div class="mx-auto flex w-full max-w-6xl px-4 sm:px-6">
        {/* Sidebar */}
        <aside
          class="sticky top-16 hidden h-[calc(100dvh-4rem)] w-52 shrink-0 overflow-y-auto pr-8 pb-10 lg:block"
          aria-label="Sections"
        >
          <nav aria-label="Docs sections">
            <DocsNav activeId={shown()} variant="rail" onGo={open} />
          </nav>
          <AdSlot />
        </aside>

        {/* Content */}
        <main class="min-w-0 flex-1 pb-24 lg:pl-10">
          {/* The page's row: where the reader is (the docs, then the
              section's group), and the switches that act on the whole page,
              what its code is written in, its sounds and its theme. */}
          <div class="mt-10 flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <Show when={crumbGroup()}>
              {(group) => (
                <nav aria-label="Breadcrumb" class="text-[11px] text-muted-foreground">
                  <ol class="flex flex-wrap items-center gap-1.5">
                    <li>
                      <a
                        href={docsUrl(SECTION_IDS[0] ?? "")}
                        class="-my-1 inline-flex min-h-6 items-center transition-colors hover:text-foreground"
                        onClick={to(SECTION_IDS[0] ?? "")}
                      >
                        Docs
                      </a>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li>
                      <a
                        href={docsUrl(group().items[0]?.id ?? "")}
                        class="-my-1 inline-flex min-h-6 items-center transition-colors hover:text-foreground"
                        aria-current={group().items[0]?.id === shown() ? "page" : undefined}
                        onClick={(e) => to(group().items[0]?.id ?? "")(e)}
                      >
                        {group().title}
                      </a>
                    </li>
                  </ol>
                </nav>
              )}
            </Show>
            <div class="flex flex-wrap items-center gap-2 text-muted-foreground">
              <div class="track max-lg:hidden" role="group" aria-label="Styling">
                <For each={STYLINGS}>
                  {(s) => (
                    <button
                      type="button"
                      aria-pressed={styling() === s}
                      class={`h-6 px-2.5 text-[11px] transition-colors ${styling() === s ? "ring-on" : "hover:text-foreground"}`}
                      onClick={() => choose(() => setStyling(s), styling() === s)}
                    >
                      {STYLING_LABELS[s]}
                    </button>
                  )}
                </For>
              </div>
              <button
                type="button"
                class="flex size-8 items-center justify-center transition-colors hover:text-foreground"
                aria-label="Interface sounds"
                aria-pressed={sounds()}
                title={`Interface sounds: ${sounds() ? "on" : "off"}`}
                onClick={flipSounds}
              >
                <DitherIcon name={sounds() ? "Volume" : "VolumeOff"} size={15} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                class="flex size-8 items-center justify-center transition-colors hover:text-foreground"
                aria-label={dark() ? "Use light theme" : "Use dark theme"}
                onClick={flipTheme}
              >
                <DitherIcon name={dark() ? "Sun" : "Moon"} size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <div ref={(el) => (flow = el)} class="docs-flow max-w-2xl">
            {/* Only the section on this page shows: this rule holds the rest
                of a pack back in the server's bytes and until the page has
                marked them `hidden`. */}
            <style>{`.docs-flow > section:not([id="${shown()}"]) { display: none }`}</style>
            {/* The title in chrome; on its baseline, the kit's spec as speed
                tags (beside the title, never an eyebrow over it). */}
            <div
              data-docs-front
              class={`flex flex-wrap items-end justify-between gap-x-6 gap-y-3 ${activeId() ? "sr-only" : "mt-6"}`}
            >
              <h1 class="font-display text-[1.6rem] leading-tight font-normal">Documentation</h1>
              <ul class="flex flex-wrap gap-1 pb-1" aria-label="The kit">
                <li class="speed-tag">{GROUPS.flatMap((g) => g.items).length} sections</li>
                <li class="speed-tag">Solid</li>
                <li class="speed-tag">Tailwind or StyleX</li>
              </ul>
            </div>
            <Show when={!activeId()}>
              <p data-docs-front class="mt-3 text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
                Every component draws on canvas through the same ordered-dither engine. Compose charts from parts, or
                drop in a single primitive.
              </p>
            </Show>

            {/* Every section, its pack's: the sidebar's order, one table (`DOCS`). */}
            <SHOWN_SECTION.Provider value={shown}>
              <For each={PACK_NAMES}>{(name) => <Pack name={name} />}</For>
            </SHOWN_SECTION.Provider>
          </div>

          {/* The book's turn: the sections either side, in the sidebar's order. */}
          <nav aria-label="Previous and next sections" class="mt-16 mb-6 grid max-w-2xl gap-3 sm:grid-cols-2">
            <Show when={near().prev}>
              {(prev) => (
                <a
                  href={docsUrl(prev().id)}
                  class="group rounded-xl border border-border/60 px-4 py-3 transition-colors hover:border-foreground/40"
                  onClick={(e) => to(prev().id)(e)}
                >
                  <span class="block text-[11px] text-muted-foreground">Previous, {prev().group}</span>
                  <span class="mt-1 block text-[14px] text-foreground">{prev().label}</span>
                </a>
              )}
            </Show>
            <Show when={near().next}>
              {(next) => (
                <a
                  href={docsUrl(next().id)}
                  class="group rounded-xl border border-border/60 px-4 py-3 text-right transition-colors hover:border-foreground/40 sm:col-start-2"
                  onClick={(e) => to(next().id)(e)}
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
          <Show when={onPage().length}>
            <OnThisPage parts={onPage()} onGo={goTo} />
          </Show>
          <Show when={activeId() && docsMeta(activeId()).id}>
            <SectionShare id={activeId()} />
          </Show>
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

      <DocsSheet
        open={sheetOpen()}
        activeId={shown()}
        parts={onPage()}
        onClose={() => setSheetOpen(false)}
        onGo={(id) => fromSheet(() => searchGo(id))}
        onPart={(el) => fromSheet(() => goTo(el))}
      />
      <DitherCommand
        open={searchOpen()}
        items={commandItems}
        placeholder="Search docs…"
        onSelect={searchGo}
        onClose={() => setSearchOpen(false)}
        // No section by that name: the mascot blinks at it.
        empty={(scope) => (
          <span class="flex flex-col items-center gap-2.5">
            <Mascot size={30} pose="blink" class="text-foreground" />
            <span>Nothing in the docs is called “{scope.query}”.</span>
          </span>
        )}
      />
    </div>
  )
}
