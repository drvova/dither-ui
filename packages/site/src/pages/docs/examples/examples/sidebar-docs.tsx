import { createMutable } from "solid-js/store"
import { createMemo, createSignal, For, Show } from "solid-js"
import { DitherInput, DitherSidebar, DitherSidebarItem, DitherSidebarSub } from "@dither-kit"

const DOCS_TREE: Record<string, string[]> = {
  "Getting started": ["Introduction", "Installation", "Quick start", "Configuration"],
  "API reference": ["Props", "Events", "Slots"],
  Guides: ["Theming", "Composition"],
}

export default function Example() {
  const [docsSearch, setDocsSearch] = createSignal("")
  const [docsActive, setDocsActive] = createSignal("Installation")
  const docsOpen = createMutable<Record<string, boolean>>({
    "Getting started": true,
    "API reference": false,
    Guides: false,
  })
  const docsFiltered = createMemo(() => {
    const q = docsSearch().trim().toLowerCase()
    const out: Record<string, string[]> = {}
    for (const [group, items] of Object.entries(DOCS_TREE)) {
      const hit = q ? items.filter((i) => i.toLowerCase().includes(q)) : items
      if (hit.length) out[group] = hit
    }
    return out
  })

  // searching prunes the rows and forces their groups open
  return (
    <div class="overflow-x-auto">
      <div class="mx-auto flex h-96 min-w-[36rem] max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
        <DitherSidebar
          class="w-60 border-r border-border/60"
          label="Docs nav"
          collapse="none"
          density="compact"
          variant="inset"
          header={
            <div class="px-2.5">
              <div class="flex h-8 items-center justify-between">
                <span class="text-[12px] tracking-tight">dither-ui</span>
                <span class="rounded border border-border/60 px-1 text-[10px] tabular-nums text-muted-foreground">
                  v2.4
                </span>
              </div>
              <div class="relative">
                <DitherInput
                  class="w-full pr-8 text-[11px]"
                  modelValue={docsSearch()}
                  onUpdateModelValue={setDocsSearch}
                  placeholder="Search docs…"
                />
                <span class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-border/60 px-1 text-[9px] text-muted-foreground">
                  ⌘K
                </span>
              </div>
            </div>
          }
          footer={
            <div class="rounded-md border border-border/60 bg-background/40 p-2.5">
              <div class="text-[11px] text-foreground">Need help?</div>
              <div class="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                Ask in the community or file an issue.
              </div>
            </div>
          }
        >
          <For each={Object.keys(docsFiltered())}>
            {(group) => (
              <DitherSidebarSub
                label={group}
                modelValue={docsSearch().trim() ? true : docsOpen[group]}
                onUpdateModelValue={(v: boolean) => (docsOpen[group] = v)}
              >
                <For each={docsFiltered()[group]}>
                  {(item) => (
                    <DitherSidebarItem
                      label={item}
                      active={docsActive() === item}
                      onSelect={() => setDocsActive(item)}
                    />
                  )}
                </For>
              </DitherSidebarSub>
            )}
          </For>
          <Show when={!Object.keys(docsFiltered()).length}>
            <p class="px-2.5 py-4 text-[11px] text-muted-foreground">No pages match “{docsSearch()}”.</p>
          </Show>
        </DitherSidebar>
        <div class="min-w-0 flex-1 overflow-hidden p-5">
          <div class="text-[11px] text-muted-foreground">Docs / {docsActive()}</div>
          <div class="mt-2 text-[15px] tracking-tight text-foreground">{docsActive()}</div>
          <div class="mt-4 grid gap-2" aria-hidden="true">
            <div class="h-2 w-11/12 rounded-sm bg-border/50" />
            <div class="h-2 w-full rounded-sm bg-border/50" />
            <div class="h-2 w-3/4 rounded-sm bg-border/50" />
            <div class="mt-3 h-20 rounded-md border border-border/60 bg-background/40" />
            <div class="h-2 w-5/6 rounded-sm bg-border/50" />
          </div>
        </div>
      </div>
    </div>
  )
}
