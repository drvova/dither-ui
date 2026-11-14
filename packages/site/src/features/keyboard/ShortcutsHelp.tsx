import { DitherFocusScope, DitherIcon } from "@dither-ui/kit"
import { Presence } from "@dither-ui/kit/solid/runtime/presence.tsx"
import { createSignal, For, onCleanup, onMount } from "solid-js"
import { isTyping } from "@/shared/lib/keys"
import "./ShortcutsHelp.css"

const GROUPS: { title: string; keys: [string, string][] }[] = [
  {
    title: "Edit",
    keys: [
      ["⌘Z", "Undo"],
      ["⌘⇧Z", "Redo"],
      ["⌘D", "Duplicate"],
      ["⌫", "Delete"],
      ["⌘G", "Group"],
      ["⌘⇧G", "Ungroup"],
      ["⌘L", "Lock / unlock"],
    ],
  },
  {
    title: "Move",
    keys: [
      ["↑↓←→", "Nudge 1px"],
      ["⇧ + arrows", "Nudge 10px"],
      ["Esc", "Deselect"],
    ],
  },
  {
    title: "View",
    keys: [
      ["⌘+ / ⌘−", "Zoom in / out"],
      ["⌘0", "Zoom to 100%"],
      ["⇧1", "Fit every frame"],
      ["⇧2", "Fit selection"],
    ],
  },
  {
    title: "Window",
    keys: [
      ["⌘K", "Search"],
      ["⌘I", "Chat"],
      ["⌘B", "Sidebar"],
      ["⌘⇧↑ / ⌘⇧↓", "Chat before / after"],
    ],
  },
]

export default function ShortcutsHelp() {
  const [open, setOpen] = createSignal(false)

  function onKey(e: KeyboardEvent) {
    if (open() && e.key === "Escape") {
      e.stopPropagation()
      setOpen(false)
      return
    }
    if (e.key === "?" && !isTyping(e.target)) {
      e.preventDefault()
      setOpen(!open())
    }
  }

  onMount(() => {
    window.addEventListener("keydown", onKey, true)
    onCleanup(() => window.removeEventListener("keydown", onKey, true))
  })

  return (
    <Presence when={open()} name="dk-fade">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        class="shortcuts-help-scope fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <DitherFocusScope class="hardshell w-full max-w-md bg-card p-5">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Keyboard shortcuts</span>
            <button
              type="button"
              class="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <DitherIcon name="Close" size={14} strokeWidth={1.5} />
            </button>
          </div>
          <div class="mt-4 grid gap-5">
            <For each={GROUPS}>
              {(g) => (
                <div>
                  <div class="text-[11.5px] font-medium text-muted-foreground">{g.title}</div>
                  <dl class="mt-2 grid gap-1.5">
                    <For each={g.keys}>
                      {([k, label]) => (
                        <div class="flex items-center justify-between text-xs">
                          <dt class="text-muted-foreground">{label}</dt>
                          <dd class="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                            {k}
                          </dd>
                        </div>
                      )}
                    </For>
                  </dl>
                </div>
              )}
            </For>
          </div>
          <p class="mt-5 text-[10px] text-muted-foreground">Press ? to toggle this panel</p>
        </DitherFocusScope>
      </div>
    </Presence>
  )
}
