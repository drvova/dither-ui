import { createSignal, For } from "solid-js"
import { DitherDrawer, DitherSidebarGroup, DitherSidebarItem } from "@dither-kit"

export default function Example() {
  const [drawerOpen, setDrawerOpen] = createSignal(false)
  const [drawerActive, setDrawerActive] = createSignal("Home")
  function drawerPick(label: string) {
    setDrawerActive(label)
    setDrawerOpen(false)
  }

  // mobile: the sidebar rides in a drawer; swipe-to-dismiss ships with it, Escape closes it and the
  // items work standalone; pick also closes the drawer
  return (
    <div class="relative mx-auto flex h-96 w-64 flex-col overflow-hidden rounded-lg border border-border/60 bg-background/40">
      <div class="flex h-11 shrink-0 items-center gap-2.5 border-b border-border/60 px-3">
        <button
          class="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          type="button"
          aria-label="Open navigation"
          onClick={() => setDrawerOpen(true)}
        >
          <span class="text-[13px] leading-none" aria-hidden="true">
            ☰
          </span>
        </button>
        <span class="text-[12px] text-foreground">{drawerActive()}</span>
      </div>
      <div class="grid flex-1 content-start gap-2 p-3" aria-hidden="true">
        <div class="h-24 rounded-md border border-border/60 bg-card/40" />
        <div class="h-2 w-3/4 rounded-sm bg-border/50" />
        <div class="h-2 w-1/2 rounded-sm bg-border/50" />
        <div class="h-16 rounded-md border border-border/60 bg-card/40" />
      </div>
      <DitherDrawer open={drawerOpen()} side="left" title="Navigation" onClose={() => setDrawerOpen(false)}>
        <DitherSidebarGroup label="Browse">
          <For each={["Home", "Discover", "Library"]}>
            {(i) => <DitherSidebarItem label={i} active={drawerActive() === i} onSelect={() => drawerPick(i)} />}
          </For>
        </DitherSidebarGroup>
        <DitherSidebarGroup label="You">
          <DitherSidebarItem
            label="Saved"
            badge={8}
            active={drawerActive() === "Saved"}
            onSelect={() => drawerPick("Saved")}
          />
          <DitherSidebarItem
            label="Settings"
            active={drawerActive() === "Settings"}
            onSelect={() => drawerPick("Settings")}
          />
        </DitherSidebarGroup>
      </DitherDrawer>
    </div>
  )
}
