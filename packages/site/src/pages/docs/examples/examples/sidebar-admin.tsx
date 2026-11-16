import { createSignal, For } from "solid-js"
import { DitherAvatar, DitherMeter, DitherSidebar, DitherSidebarGroup, DitherSidebarItem } from "@dither-kit"

export default function Example() {
  const [adminHidden, setAdminHidden] = createSignal(false)
  const [adminActive, setAdminActive] = createSignal("Members")

  return (
    <div class="overflow-x-auto">
      <div class="mx-auto flex h-96 min-w-[36rem] max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
        <DitherSidebar
          modelValue={adminHidden()}
          onUpdateModelValue={setAdminHidden}
          label="Admin nav"
          collapse="hide"
          variant="floating"
          toggle={false}
          header={
            <div class="flex h-8 items-center gap-2 px-2.5">
              <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
              <span class="text-[12px] tracking-tight">admin</span>
            </div>
          }
          footer={
            <>
              <div class="mb-2 rounded-md border border-border/60 bg-background/40 p-2.5">
                <div class="flex items-baseline justify-between">
                  <span class="text-[11px] text-foreground">Storage</span>
                  <span class="text-[10px] tabular-nums text-muted-foreground">68%</span>
                </div>
                <DitherMeter class="mt-1.5 h-2 w-full" value={68} />
                <div class="mt-1 text-[10px] text-muted-foreground">6.8 of 10 GB used</div>
              </div>
              <div class="flex items-center gap-2 border-t border-border/60 px-2 pt-2">
                <DitherAvatar name="Rei Toma" size={22} color="purple" />
                <div class="min-w-0 flex-1 leading-tight">
                  <div class="truncate text-[11px] text-foreground">Rei Toma</div>
                  <div class="truncate text-[10px] text-muted-foreground">Owner</div>
                </div>
                <button
                  class="grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                  type="button"
                  aria-label="Sign out"
                >
                  <span class="text-[11px]" aria-hidden="true">
                    ⏻
                  </span>
                </button>
              </div>
            </>
          }
        >
          <DitherSidebarGroup label="Manage">
            <DitherSidebarItem
              label="Members"
              badge={24}
              active={adminActive() === "Members"}
              onSelect={() => setAdminActive("Members")}
            />
            <DitherSidebarItem
              label="Roles"
              active={adminActive() === "Roles"}
              onSelect={() => setAdminActive("Roles")}
            />
            <DitherSidebarItem
              label="Audit log"
              badge="!"
              color="red"
              active={adminActive() === "Audit log"}
              onSelect={() => setAdminActive("Audit log")}
            />
          </DitherSidebarGroup>
          <DitherSidebarGroup label="Quick actions">
            <DitherSidebarItem
              label="New member"
              active={adminActive() === "New member"}
              onSelect={() => setAdminActive("New member")}
            />
            <DitherSidebarItem
              label="Create invite"
              color="green"
              active={adminActive() === "Create invite"}
              onSelect={() => setAdminActive("Create invite")}
            />
            <DitherSidebarItem
              label="Support"
              active={adminActive() === "Support"}
              onSelect={() => setAdminActive("Support")}
            />
          </DitherSidebarGroup>
        </DitherSidebar>
        <div class="flex min-w-0 flex-1 flex-col">
          <div class="flex h-10 items-center gap-3 border-b border-border/60 px-3">
            <button
              class="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              type="button"
              aria-label={adminHidden() ? "Show sidebar" : "Hide sidebar"}
              aria-expanded={!adminHidden()}
              onClick={() => setAdminHidden(!adminHidden())}
            >
              <span class="text-[13px] leading-none" aria-hidden="true">
                ☰
              </span>
            </button>
            <span class="text-[12px] text-foreground">{adminActive()}</span>
          </div>
          <div class="grid gap-2 p-4" aria-hidden="true">
            <For each={Array.from({ length: 5 }, (_, k) => k + 1)}>
              {(i) => (
                <div class="flex h-8 items-center gap-3 rounded-md border border-border/60 px-3">
                  <span class="size-3 rounded-[2px] bg-border/70" />
                  <span
                    class="h-2 rounded-sm bg-border/50"
                    style={{ width: `${[33.33, 25, 40, 33.33, 20][i - 1]}%` }}
                  />
                  <span class="ml-auto h-2 w-10 rounded-sm bg-border/40" />
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  )
}
