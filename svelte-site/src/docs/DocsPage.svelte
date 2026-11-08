<script lang="ts">
  // The docs, laid out as the Vue docs (src/pages/docs/DocsPage.vue): the
  // site's header (the landing's, its Docs link current, the sections key
  // under lg), the obsidian ground under the grain, the sections rail
  // folding by family, one section a page under a breadcrumb with the pager
  // under it, "On this page" at xl, and the footer. The address names the
  // section (`#/docs/<id>`); `#/docs` opens on the first, under the front.
  import { onMount, tick } from "svelte"
  import "../fonts/display.css"
  import { GITHUB } from "../landing/links"
  import { VERSION } from "../landing/facts"
  import SiteHeader from "../landing/SiteHeader.svelte"
  import ToolMark from "../landing/ToolMark.svelte"
  import "./docs.css"
  // The kit's glyphs as data (the Svelte kit has no icon component): the
  // Vue docs' rail glyphs, its chevron and its sections key, the same paths.
  import { ICONS, type IconName } from "../../../dither-kit/engine/icons"
  import { GROUPS, SECTIONS as ITEMS, groupOf, neighbours, sectionOf } from "./nav"
  import GuidesDocs from "./GuidesDocs.svelte"
  import ExamplesDocs from "./ExamplesDocs.svelte"
  import ChartsDocs from "./ChartsDocs.svelte"
  import PrimitivesDocs from "./PrimitivesDocs.svelte"
  import FormDocs from "./FormDocs.svelte"
  import FieldDocs from "./FieldDocs.svelte"
  import SelectionDocs from "./SelectionDocs.svelte"
  import FeedbackDocs from "./FeedbackDocs.svelte"
  import StructureDocs from "./StructureDocs.svelte"
  import OverlayDocs from "./OverlayDocs.svelte"
  import SurfaceDocs from "./SurfaceDocs.svelte"
  import NavigationDocs from "./NavigationDocs.svelte"
  import BackgroundsDocs from "./BackgroundsDocs.svelte"
  import TextDocs from "./TextDocs.svelte"
  import AnimationsDocs from "./AnimationsDocs.svelte"
  import PaletteDocs from "./PaletteDocs.svelte"

  const FIRST = ITEMS[0]?.id ?? ""
  const SHEET_ID = "docs-sections"

  let activeId = $state(sectionOf(location.hash))
  const shown = $derived(activeId || FIRST)
  const near = $derived(neighbours(shown))
  const prev = $derived(near.prev)
  const next = $derived(near.next)
  const crumb = $derived(groupOf(shown))

  /** The families folded open: the current section's opens itself. */
  let opened = $state<ReadonlySet<string>>(new Set())
  $effect(() => {
    if (crumb && !opened.has(crumb.title)) opened = new Set([...opened, crumb.title])
  })
  const fold = (title: string) => {
    const o = new Set(opened)
    if (o.has(title)) o.delete(title)
    else o.add(title)
    opened = o
  }

  /* One section a page: the rest of the flow hidden; read from the top. */
  let flow = $state<HTMLElement | null>(null)
  type Part = { label: string; el: HTMLElement }
  let parts = $state<Part[]>([])
  $effect(() => {
    const id = shown
    if (!flow) return
    for (const s of flow.querySelectorAll<HTMLElement>(":scope > section")) s.hidden = s.id !== id
    void tick().then(() => {
      const section = document.getElementById(id)
      parts = section
        ? [...section.querySelectorAll<HTMLElement>("h2, h3, table")]
            .filter((el) => !el.closest("[data-demo-card]"))
            .map((el) => (el.tagName === "TABLE" ? { label: "API", el } : { label: el.textContent?.trim() ?? "", el }))
        : []
    })
  })
  const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth")
  const goTo = (el: HTMLElement) => window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 88, behavior: smooth() })

  onMount(() => {
    const onHash = () => {
      if (!location.hash.startsWith("#/docs")) return
      activeId = sectionOf(location.hash)
      window.scrollTo({ top: 0, behavior: "auto" })
    }
    addEventListener("hashchange", onHash)
    return () => removeEventListener("hashchange", onHash)
  })

  /* The sections sheet (under lg): a modal of the same list, shut by a
     pick, its close key or Escape, focus handed back to its key. */
  let sheet = $state<HTMLDialogElement | null>(null)
  let sheetKey = $state<HTMLButtonElement | null>(null)
  let sheetOpen = $state(false)
  function openSheet() {
    sheetOpen = true
    document.documentElement.style.overflow = "hidden"
    sheet?.showModal()
  }
  function closeSheet() {
    if (!sheetOpen) return
    sheetOpen = false
    document.documentElement.style.overflow = ""
    if (sheet?.open) sheet.close()
    sheetKey?.focus()
  }
  onMount(() => {
    const wide = matchMedia("(min-width: 1024px)")
    const onWide = (e: MediaQueryListEvent) => e.matches && closeSheet()
    wide.addEventListener("change", onWide)
    return () => {
      wide.removeEventListener("change", onWide)
      document.documentElement.style.overflow = ""
    }
  })
</script>

{#snippet glyph(name: IconName, size: number, stroke = 1.5, cls = "")}
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    class="shrink-0 {cls}"
    fill="none"
    stroke="currentColor"
    stroke-width={stroke}
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true">{#each ICONS[name] as d (d)}<path {d} />{/each}</svg
  >
{/snippet}

{#snippet sectionsNav(place: "rail" | "sheet")}
  <div class="docs-nav grid gap-3">
    {#each GROUPS as grp (grp.title)}
      <div>
        <button
          type="button"
          class="flex w-full items-center gap-2 py-1.5 text-left font-medium text-foreground {place === 'sheet'
            ? 'min-h-10 text-[15px]'
            : 'min-h-7 text-[11px]'}"
          aria-expanded={opened.has(grp.title)}
          aria-controls="{place}-{grp.title}"
          onclick={() => fold(grp.title)}
        >
          <span class="inline-flex items-center gap-2">{@render glyph(grp.icon, place === "sheet" ? 16 : 13)}{grp.title}</span>
          <span class="spec ml-auto tabular-nums">{grp.items.length}</span>
          {@render glyph("ChevronRight", 12, 1.75, "nav-chev text-muted-foreground")}
        </button>
        <ul id="{place}-{grp.title}" hidden={!opened.has(grp.title)} class="mt-1 grid gap-0.5 border-l border-border">
          {#each grp.items as it (it.id)}
            <li>
              <a
                href="#/docs/{it.id}"
                aria-current={shown === it.id ? "true" : undefined}
                onclick={() => place === "sheet" && closeSheet()}
                class="-ml-px block border-l pl-3 transition-colors {place === 'sheet'
                  ? 'py-2 text-[15px]'
                  : 'py-1 text-[11px]'} {shown === it.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground'}"
                >{it.label}</a
              >
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
{/snippet}

<div class="docs-root min-h-dvh bg-background font-mono text-foreground antialiased">
  <SiteHeader current="docs">
    {#snippet tools()}
      <button
        bind:this={sheetKey}
        type="button"
        class="flex size-8 items-center justify-center transition-colors hover:text-foreground lg:hidden"
        aria-label="Browse sections"
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        aria-controls={SHEET_ID}
        onclick={openSheet}
      >
        {@render glyph("Book", 15)}
      </button>
    {/snippet}
  </SiteHeader>

  <div class="mx-auto flex w-full max-w-6xl px-4 sm:px-6">
    <aside class="sticky top-16 hidden h-[calc(100dvh-4rem)] w-52 shrink-0 overflow-y-auto pt-10 pr-8 pb-10 lg:block">
      <nav aria-label="Docs sections">{@render sectionsNav("rail")}</nav>
    </aside>

    <main class="min-w-0 flex-1 pb-24 lg:pl-10">
      <div class="mt-10 flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {#if crumb}
          <nav aria-label="Breadcrumb" class="text-[11px] text-muted-foreground">
            <ol class="flex flex-wrap items-center gap-1.5">
              <li><a href="#/docs/{FIRST}" class="-my-1 py-1 transition-colors hover:text-foreground">Docs</a></li>
              <li aria-hidden="true">/</li>
              <li>
                <a
                  href="#/docs/{crumb.items[0]?.id}"
                  class="-my-1 py-1 transition-colors hover:text-foreground"
                  aria-current={crumb.items[0]?.id === shown ? "page" : undefined}>{crumb.title}</a
                >
              </li>
            </ol>
          </nav>
        {/if}
      </div>

      <div bind:this={flow} class="docs-flow max-w-2xl">
        <!-- The front, on the docs' own address: the title, the kit's spec
             on its baseline as speed tags, a line under it. -->
        <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 {activeId ? 'sr-only' : 'mt-6'}">
          <h1 class="font-[family-name:var(--display-face)] text-[1.6rem] leading-tight font-normal">Documentation</h1>
          <ul class="flex flex-wrap gap-1 pb-1" aria-label="The kit">
            <li class="speed-tag">{ITEMS.length} sections</li>
            <li class="speed-tag">Svelte 5</li>
            <li class="speed-tag">Tailwind v4</li>
          </ul>
        </div>
        {#if !activeId}
          <p class="mt-3 text-[13px] leading-relaxed text-pretty text-muted-foreground">
            Every component draws on canvas through the same ordered-dither engine. Compose charts from parts, or
            drop in a single primitive.
          </p>
        {/if}

        <GuidesDocs />
        <ExamplesDocs />
        <ChartsDocs />
        <PrimitivesDocs />
        <FormDocs />
        <FieldDocs />
        <SelectionDocs />
        <FeedbackDocs />
        <StructureDocs />
        <OverlayDocs />
        <SurfaceDocs />
        <NavigationDocs />
        <BackgroundsDocs />
        <TextDocs />
        <AnimationsDocs />
        <PaletteDocs />
      </div>

      <!-- The book's turn: the sections either side, in the sidebar's order. -->
      <nav aria-label="Previous and next sections" class="mt-16 mb-6 grid max-w-2xl gap-3 sm:grid-cols-2">
        {#if prev}
          <a href="#/docs/{prev.id}" class="rounded-xl border border-border px-4 py-3 transition-colors hover:border-foreground/40">
            <span class="block text-[11px] text-muted-foreground">Previous, {prev.group}</span>
            <span class="mt-1 block text-[14px] text-foreground">{prev.label}</span>
          </a>
        {/if}
        {#if next}
          <a
            href="#/docs/{next.id}"
            class="rounded-xl border border-border px-4 py-3 text-right transition-colors hover:border-foreground/40 sm:col-start-2"
          >
            <span class="block text-[11px] text-muted-foreground">Next, {next.group}</span>
            <span class="mt-1 block text-[14px] text-foreground">{next.label}</span>
          </a>
        {/if}
      </nav>
    </main>

    <aside class="sticky top-16 hidden h-[calc(100dvh-4rem)] w-40 shrink-0 overflow-y-auto py-10 pl-6 xl:block">
      {#if parts.length}
        <nav aria-label="On this page">
          <p class="text-[11px] font-medium text-foreground">On this page</p>
          <ul class="mt-2.5 grid gap-0.5 border-l border-border">
            {#each parts as p, i (i)}
              <li>
                <button
                  type="button"
                  class="-ml-px block w-full border-l py-1 pl-3 text-left text-[11px] transition-colors hover:border-foreground/40 hover:text-foreground {i ===
                  0
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground'}"
                  onclick={() => goTo(p.el)}>{p.label}</button
                >
              </li>
            {/each}
          </ul>
        </nav>
      {/if}
    </aside>
  </div>

  <footer class="border-t border-border">
    <div
      class="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-[11px] text-muted-foreground sm:px-6"
    >
      <a href="#/" class="-my-1 py-1 transition-colors hover:text-foreground">dither-ui</a>
      <div class="flex items-center gap-4">
        <a href={GITHUB} target="_blank" rel="noreferrer" class="-my-1 flex items-center gap-1.5 py-1 transition-colors hover:text-foreground"
          ><ToolMark id="github" size={12} />GitHub<span class="sr-only"> (opens in a new tab)</span></a
        >
        <span class="tabular-nums">v{VERSION}</span>
        <span>MIT license</span>
      </div>
    </div>
  </footer>

  <dialog
    id={SHEET_ID}
    bind:this={sheet}
    class="docs-sheet"
    aria-label="Docs sections"
    oncancel={(e) => {
      e.preventDefault()
      closeSheet()
    }}
    onclose={closeSheet}
  >
    {#if sheetOpen}
      <div class="flex h-full flex-col font-mono">
        <div class="flex items-center justify-between px-4 pt-4 pb-2 text-xs">
          <span class="flex items-center gap-2"
            >Sections <span class="spec tabular-nums">{ITEMS.length}</span></span
          >
          <!-- svelte-ignore a11y_autofocus (a modal's first stop: its close key) -->
          <button type="button" class="nav-a" autofocus aria-label="Close sections" onclick={closeSheet}>Close</button>
        </div>
        <nav aria-label="Docs sections" class="flex-1 overflow-y-auto px-4 pb-10">{@render sectionsNav("sheet")}</nav>
      </div>
    {/if}
  </dialog>
</div>
