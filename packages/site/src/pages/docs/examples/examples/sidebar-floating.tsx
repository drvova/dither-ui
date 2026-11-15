import { createSignal, For, Show } from "solid-js"
import { DitherAvatar, DitherInput, DitherSidebar, DitherSidebarGroup, DitherSidebarItem } from "@dither-kit"

const FAVORITES = [
  "Print run planning & schedule",
  "Zine layouts & paste-ups",
  "Palette research notebook",
  "Client proofs & feedback",
]

export default function Example() {
  const [floatCollapsed, setFloatCollapsed] = createSignal(false)
  const [floatActive, setFloatActive] = createSignal("Home")
  const [favActive, setFavActive] = createSignal("")

  // a long label truncates
  return (
    <div class="relative mx-auto h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
      <div class="absolute inset-0 grid place-items-center text-[12px] text-muted-foreground" aria-hidden="true">
        Canvas
      </div>
      <DitherSidebar
        class="relative h-[calc(100%-1rem)]"
        modelValue={floatCollapsed()}
        onUpdateModelValue={setFloatCollapsed}
        label="Workspace nav"
        variant="floating"
        header={
          <>
            <button
              class="flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/40 p-1.5 text-left transition-colors hover:bg-card"
              type="button"
              aria-label="Switch workspace"
            >
              <DitherAvatar name="Acme Inc" size={22} color="blue" />
              <Show when={!floatCollapsed()}>
                <span class="min-w-0 flex-1 leading-tight">
                  <span class="block truncate text-[11px] text-foreground">Acme Inc</span>
                  <span class="block truncate text-[9px] text-muted-foreground">Enterprise</span>
                </span>
              </Show>
              <Show when={!floatCollapsed()}>
                <span class="text-[10px] text-muted-foreground" aria-hidden="true">
                  ⇅
                </span>
              </Show>
            </button>
            <Show when={!floatCollapsed()}>
              <DitherInput class="mt-2 w-full text-[11px]" placeholder="Search…" />
            </Show>
          </>
        }
        footer={
          <div class="flex items-center gap-2 border-t border-border/60 px-2 pt-2">
            <DitherAvatar name="Juno Bit" size={22} color="green" />
            <Show when={!floatCollapsed()}>
              <div class="min-w-0 leading-tight">
                <div class="truncate text-[11px] text-foreground">Juno Bit</div>
                <div class="truncate text-[10px] text-muted-foreground">juno@acme.io</div>
              </div>
            </Show>
          </div>
        }
      >
        <DitherSidebarItem
          label="Assistant"
          color="purple"
          active={floatActive() === "Assistant"}
          onSelect={() => setFloatActive("Assistant")}
        />
        <DitherSidebarItem label="Home" active={floatActive() === "Home"} onSelect={() => setFloatActive("Home")} />
        <DitherSidebarItem
          label="Inbox"
          badge={10}
          active={floatActive() === "Inbox"}
          onSelect={() => setFloatActive("Inbox")}
        />
        <DitherSidebarGroup label="Favorites">
          <For each={FAVORITES}>
            {(f) => (
              <DitherSidebarItem
                label={f}
                active={favActive() === f}
                onSelect={() => {
                  setFavActive(f)
                  setFloatActive("")
                }}
              />
            )}
          </For>
        </DitherSidebarGroup>
      </DitherSidebar>
    </div>
  )
}
