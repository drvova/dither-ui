// The site's header on the docs, with the docs' tools in its slot: search
// (the kit's Command palette over the whole IA, ⌘K from anywhere) and,
// under lg, the key that opens the sections sheet. A pick leaves for the
// section's page: each section is a page of its own. An island of the docs.
import { createSignal, onCleanup, onMount } from "solid-js"
import { DitherCommand, DitherIcon } from "@dither-ui/kit"
import { GROUPS } from "@/pages/docs/groups"
import { modKey } from "@/shared/lib/keys"
import Mascot from "@/shared/ui/Mascot"
import { SiteHeader } from "@/widgets/site-header"
import { docsUrl, goTo, partsOf, type PagePart } from "./DocsNav"
import DocsSheet, { SHEET_ID } from "./DocsSheet"

const commandItems = GROUPS.flatMap((g) => g.items.map((it) => ({ value: it.id, label: it.label, group: g.title })))

/** The section the page shows (the first, on the docs' front). */
type DocsHeaderProps = { shown: string }

export default function DocsHeader(props: DocsHeaderProps) {
  const [searchOpen, setSearchOpen] = createSignal(false)
  const [sheetOpen, setSheetOpen] = createSignal(false)
  const [parts, setParts] = createSignal<PagePart[]>([])
  /* The search hint names the modifier the visitor actually has (read in
     the browser: a server knows no keyboard). */
  const [searchKbd, setSearchKbd] = createSignal(modKey("K", false))
  function searchHotkey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault()
      setSearchOpen(!searchOpen())
    }
  }
  onMount(() => {
    setSearchKbd(modKey("K"))
    window.addEventListener("keydown", searchHotkey)
    onCleanup(() => window.removeEventListener("keydown", searchHotkey))
  })
  const go = (id: string) => location.assign(docsUrl(id))
  function openSheet() {
    setParts(partsOf(props.shown))
    setSheetOpen(true)
  }
  /* A pick closes the sheet first, so the page is free to scroll. */
  function fromSheet(then: () => void) {
    setSheetOpen(false)
    queueMicrotask(then)
  }
  return (
    <>
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
              onClick={openSheet}
            >
              <DitherIcon name="Book" size={15} strokeWidth={1.5} />
            </button>
          </>
        }
      />
      <DocsSheet
        open={sheetOpen()}
        activeId={props.shown}
        parts={parts()}
        onClose={() => setSheetOpen(false)}
        onGo={() => setSheetOpen(false)}
        onPart={(el) => fromSheet(() => goTo(el))}
      />
      <DitherCommand
        open={searchOpen()}
        items={commandItems}
        placeholder="Search docs…"
        onSelect={go}
        onClose={() => setSearchOpen(false)}
        // No section by that name: the mascot blinks at it.
        empty={(scope) => (
          <span class="flex flex-col items-center gap-2.5">
            <Mascot size={30} pose="blink" class="text-foreground" />
            <span>Nothing in the docs is called “{scope.query}”.</span>
          </span>
        )}
      />
    </>
  )
}
