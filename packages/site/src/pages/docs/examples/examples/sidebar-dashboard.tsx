import { createSignal, For, Show } from "solid-js"
import { DitherAvatar, DitherButton, DitherSidebar, DitherSidebarGroup, DitherSidebarItem } from "@dither-kit"

export default function Example() {
  const [dashCollapsed, setDashCollapsed] = createSignal(false)
  const [dashActive, setDashActive] = createSignal("Dashboard")

  return (
    <div class="overflow-x-auto">
      <div class="mx-auto flex h-96 min-w-[36rem] max-w-2xl overflow-hidden rounded-lg border border-border/60">
        <DitherSidebar
          modelValue={dashCollapsed()}
          onUpdateModelValue={setDashCollapsed}
          label="Dashboard nav"
          variant="washed"
          washColor="blue"
          toggle={false}
          header={
            <div class="flex h-8 items-center gap-2 px-2.5">
              <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
              <Show when={!dashCollapsed()}>
                <span class="text-[12px] tracking-tight">acme.io</span>
              </Show>
            </div>
          }
          footer={
            <>
              <Show when={!dashCollapsed()}>
                <div class="mb-2 rounded-md border border-border/60 bg-background/40 p-2.5">
                  <div class="text-[11px] text-foreground">Upgrade to pro</div>
                  <div class="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                    Unlock exports and presets.
                  </div>
                  <DitherButton class="mt-2 w-full py-1 text-[10px]" color="blue" variant="gradient">
                    Upgrade
                  </DitherButton>
                </div>
              </Show>
              <div class="flex items-center gap-2 border-t border-border/60 px-2 pt-2">
                <DitherAvatar name="Ada Byte" size={22} />
                <Show when={!dashCollapsed()}>
                  <div class="min-w-0 leading-tight">
                    <div class="truncate text-[11px] text-foreground">Ada Byte</div>
                    <div class="truncate text-[10px] text-muted-foreground">ada@acme.io</div>
                  </div>
                </Show>
              </div>
            </>
          }
        >
          <DitherSidebarGroup label="Main">
            <DitherSidebarItem
              label="Dashboard"
              active={dashActive() === "Dashboard"}
              onSelect={() => setDashActive("Dashboard")}
            />
            <DitherSidebarItem
              label="Projects"
              badge={12}
              active={dashActive() === "Projects"}
              onSelect={() => setDashActive("Projects")}
            />
            <DitherSidebarItem label="Team" active={dashActive() === "Team"} onSelect={() => setDashActive("Team")} />
            <DitherSidebarItem
              label="Settings"
              active={dashActive() === "Settings"}
              onSelect={() => setDashActive("Settings")}
            />
          </DitherSidebarGroup>
        </DitherSidebar>
        <div class="flex min-w-0 flex-1 flex-col">
          <div class="flex h-10 items-center gap-2 border-b border-border/60 px-3">
            <button
              class="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              type="button"
              aria-label={dashCollapsed() ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!dashCollapsed()}
              onClick={() => setDashCollapsed(!dashCollapsed())}
            >
              <span class="text-[12px] leading-none" aria-hidden="true">
                ▤
              </span>
            </button>
            <nav class="flex items-center gap-1.5 text-[11px] text-muted-foreground" aria-label="Breadcrumb">
              <span>Home</span>
              <span aria-hidden="true">/</span>
              <span>Projects</span>
              <span aria-hidden="true">/</span>
              <span class="text-foreground">{dashActive()}</span>
            </nav>
          </div>
          <div class="grid grid-cols-3 gap-3 p-4">
            <For
              each={[
                ["Revenue", "$12,480"],
                ["Active", "1,204"],
                ["Churn", "0.8%"],
              ]}
            >
              {(s) => (
                <div class="rounded-md border border-border/60 p-3">
                  <div class="text-[11px] text-muted-foreground">{s[0]}</div>
                  <div class="mt-1 text-[15px] tabular-nums text-foreground">{s[1]}</div>
                </div>
              )}
            </For>
          </div>
          <div class="mx-4 mb-4 flex-1 rounded-md border border-dashed border-border/60" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
