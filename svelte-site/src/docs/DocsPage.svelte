<script lang="ts">
  import { onMount } from "svelte"
  import { GROUPS } from "./nav"
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

  const GITHUB = "https://github.com/drvova/dither-ui"

  let activeId = $state("getting-started")

  function go(id: string) {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" })
    history.replaceState(null, "", `#/docs/${id}`)
  }

  onMount(() => {
    // Wayfinding: the sidebar tracks the section in view; the hash tracks the
    // sidebar, so every section is shareable and survives a reload.
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) {
          activeId = vis[0].target.id
          history.replaceState(null, "", `#/docs/${activeId}`)
        }
      },
      { rootMargin: "-8% 0px -70% 0px" }
    )
    document.querySelectorAll("section[id]").forEach((s) => io.observe(s))
    const deep = location.hash.replace(/^#\/docs\/?/, "")
    if (deep) requestAnimationFrame(() => document.getElementById(deep)?.scrollIntoView())
    return () => io.disconnect()
  })
</script>

<div class="min-h-screen bg-background font-mono text-foreground antialiased">
  <!-- Header -->
  <header class="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
    <div class="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6 text-xs">
      <a href="#/" class="tracking-tight transition-colors hover:text-foreground">dither-ui <span class="text-muted-foreground">/ svelte</span></a>
      <nav class="flex items-center gap-5 text-muted-foreground">
        <a href="#/" class="-m-3 p-3 transition-colors hover:text-foreground">home</a>
        <a href={GITHUB} target="_blank" rel="noreferrer" class="-m-3 p-3 transition-colors hover:text-foreground">github</a>
      </nav>
    </div>
  </header>

  <div class="mx-auto flex w-full max-w-6xl gap-10 px-6">
    <!-- Sidebar -->
    <aside class="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-y-auto py-10 pr-4 lg:block">
      <nav class="grid gap-7">
        {#each GROUPS as group (group.title)}
          <div>
            <p class="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">{group.title}</p>
            <ul class="grid gap-0.5">
              {#each group.items as item (item.id)}
                <li>
                  <a
                    href="#/docs/{item.id}"
                    onclick={(e) => { e.preventDefault(); go(item.id) }}
                    class="block rounded px-2 py-1 text-[12px] transition-colors {activeId === item.id
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'}"
                  >
                    {item.label}
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </nav>
    </aside>

    <!-- Content: every section pack, in sidebar order -->
    <main class="min-w-0 flex-1 py-12">
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
    </main>
  </div>
</div>
