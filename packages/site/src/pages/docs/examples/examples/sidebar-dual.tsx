import { createSignal, For } from "solid-js"
import { DitherSidebar, DitherSidebarItem } from "@dither-kit"

const PANELS: Record<string, { title: string; items: { label: string; badge?: number }[] }> = {
  Inbox: {
    title: "Inbox",
    items: [
      { label: "All mail", badge: 24 },
      { label: "Starred", badge: 3 },
      { label: "Drafts" },
      { label: "Archive" },
    ],
  },
  Files: {
    title: "Files",
    items: [{ label: "Recent" }, { label: "Shared with me", badge: 5 }, { label: "Exports" }, { label: "Trash" }],
  },
  Tasks: {
    title: "Tasks",
    items: [{ label: "Today", badge: 4 }, { label: "Upcoming", badge: 12 }, { label: "Someday" }, { label: "Done" }],
  },
}

export default function Example() {
  const [railActive, setRailActive] = createSignal("Inbox")
  const [dualActive, setDualActive] = createSignal("All mail")

  // tier 1: a permanent icon rail; tier 2: the panel it picks
  return (
    <div class="overflow-x-auto">
      <div class="mx-auto flex h-96 min-w-[36rem] max-w-2xl overflow-hidden rounded-lg border border-border/60">
        <DitherSidebar
          class="border-r-0"
          label="Context rail"
          collapse="rail"
          modelValue={true}
          toggle={false}
          header={
            <div class="grid h-8 place-items-center">
              <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
            </div>
          }
        >
          <For each={Object.keys(PANELS)}>
            {(name) => (
              <DitherSidebarItem
                label={name}
                active={railActive() === name}
                onSelect={() => {
                  setRailActive(name)
                  setDualActive(PANELS[name].items[0].label)
                }}
              />
            )}
          </For>
        </DitherSidebar>
        <DitherSidebar
          class="w-52 border-r border-border/60 bg-background/20"
          label="Context panel"
          collapse="none"
          variant="inset"
          header={
            <div class="flex h-8 items-center px-2.5 text-[12px] tracking-tight text-foreground">
              {PANELS[railActive()].title}
            </div>
          }
        >
          <For each={PANELS[railActive()].items}>
            {(item) => (
              <DitherSidebarItem
                label={item.label}
                badge={item.badge}
                active={dualActive() === item.label}
                onSelect={() => setDualActive(item.label)}
              />
            )}
          </For>
        </DitherSidebar>
        <div class="grid min-w-0 flex-1 place-items-center">
          <div class="text-center">
            <div class="text-[11px] text-muted-foreground">{railActive()}</div>
            <div class="mt-1 text-[13px] text-foreground">{dualActive()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
