import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  type JSX,
  mergeProps,
  on,
  onMount,
  Show,
} from "solid-js"
import { Portal } from "solid-js/web"
import { CONTROL_BUTTON, POPOVER } from "../tailwind/control"
import { cn } from "../tailwind/lib"

export type CommandItem = { value: string; label: string; group?: string; kbd?: string }

/** Command palette — type to filter, arrows to walk, Enter runs, Escape
 * leaves. Same open/close contract as the dialog; wire your own hotkey:
 * `window.addEventListener("keydown", e => e.metaKey && e.key === "k" && open())`. */
export type DitherCommandProps = {
  open: boolean
  items: CommandItem[]
  placeholder?: string
  /** Shown when nothing matches; given as a function (of the query), it
   * draws that instead. */
  empty?: string | ((scope: { query: string }) => JSX.Element)
  class?: string
  onClose?: () => void
  onSelect?: (value: string) => void
}

export default function DitherCommand(raw: DitherCommandProps) {
  const props = mergeProps({ placeholder: "Type a command…", empty: "No results." }, raw)

  const idBase = `dk-command-${createUniqueId()}`
  const [query, setQuery] = createSignal("")
  const [active, setActive] = createSignal(0)
  let input: HTMLInputElement | undefined
  let previousFocus: HTMLElement | null = null

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase()
    return q ? props.items.filter((i) => i.label.toLowerCase().includes(q)) : props.items
  })
  /** Group order follows first appearance; ungrouped items fall under "". */
  const groups = createMemo(() => {
    const out = new Map<string, CommandItem[]>()
    for (const item of filtered()) {
      const g = item.group ?? ""
      if (!out.has(g)) out.set(g, [])
      out.get(g)!.push(item)
    }
    return out
  })
  const flat = createMemo(() => [...groups().values()].flat())

  onMount(() => {
    createEffect(
      on(
        () => props.open,
        (open) => {
          if (open) {
            previousFocus = document.activeElement as HTMLElement | null
            setQuery("")
            setActive(0)
            queueMicrotask(() => input?.focus())
          } else {
            previousFocus?.focus()
            previousFocus = null
          }
        },
        { defer: true },
      ),
    )
    createEffect(on(query, () => setActive(0), { defer: true }))
  })

  function pick(value: string) {
    props.onSelect?.(value)
    props.onClose?.()
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation()
      props.onClose?.()
      return
    }
    // Modal: Tab never leaves the palette — the input is its one field and
    // the list is driven by the arrow keys.
    if (e.key === "Tab") {
      e.preventDefault()
      input?.focus()
      return
    }
    const n = flat().length
    if (!n) return
    if (e.key === "ArrowDown") (e.preventDefault(), setActive((active() + 1) % n))
    else if (e.key === "ArrowUp") (e.preventDefault(), setActive((active() - 1 + n) % n))
    else if (e.key === "Home") (e.preventDefault(), setActive(0))
    else if (e.key === "End") (e.preventDefault(), setActive(n - 1))
    else if (e.key === "Enter") {
      e.preventDefault()
      const item = flat()[active()]
      if (item) pick(item.value)
    }
  }
  const indexOf = (item: CommandItem) => flat().indexOf(item)
  const empty = () => {
    const e = props.empty
    return typeof e === "function" ? e({ query: query().trim() }) : e
  }

  return (
    <Portal>
      <Show when={props.open}>
        <div class="fixed inset-0 z-50 grid place-items-start justify-center pt-[18vh]" onKeyDown={onKeydown}>
          <div
            class="absolute inset-0 bg-background/70 backdrop-blur-[2px]"
            aria-hidden="true"
            onClick={() => props.onClose?.()}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={props.placeholder}
            class={cn("relative w-[min(92vw,480px)] overflow-hidden font-mono", POPOVER, props.class)}
          >
            <div class="flex items-center gap-2 border-b border-border/60 px-3">
              <span class="text-[12px] text-muted-foreground" aria-hidden="true">
                ›
              </span>
              <input
                ref={(el) => (input = el)}
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
                type="text"
                role="combobox"
                aria-expanded={true}
                aria-controls={`${idBase}-list`}
                aria-activedescendant={flat()[active()] ? `${idBase}-${indexOf(flat()[active()])}` : undefined}
                placeholder={props.placeholder}
                class="h-11 w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-placeholder"
              />
              <span class="rounded border border-border/60 px-1 text-[9px] text-muted-foreground" aria-hidden="true">
                esc
              </span>
            </div>
            <ul id={`${idBase}-list`} role="listbox" class="max-h-72 overflow-y-auto p-1.5">
              <Show when={!flat().length}>
                <li class="px-2.5 py-6 text-center text-[12px] text-muted-foreground">{empty()}</li>
              </Show>
              <For each={[...groups()]}>
                {([group, groupItems]) => (
                  <>
                    <Show when={group}>
                      <li
                        aria-hidden="true"
                        class="px-2.5 pt-2 pb-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground"
                      >
                        {group}
                      </li>
                    </Show>
                    <For each={groupItems}>
                      {(item) => (
                        <li
                          id={`${idBase}-${indexOf(item)}`}
                          role="option"
                          aria-selected={indexOf(item) === active()}
                          class={cn(
                            "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] transition-colors",
                            CONTROL_BUTTON,
                            indexOf(item) === active()
                              ? "bg-card text-foreground"
                              : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                          )}
                          onClick={() => pick(item.value)}
                          onPointerMove={() => setActive(indexOf(item))}
                        >
                          <span class="size-1.5 shrink-0 rounded-[1px] bg-current opacity-60" aria-hidden="true" />
                          <span class="min-w-0 flex-1 truncate">{item.label}</span>
                          <Show when={item.kbd}>
                            <kbd class="rounded border border-border/60 px-1 text-[9px] tabular-nums text-muted-foreground">
                              {item.kbd}
                            </kbd>
                          </Show>
                        </li>
                      )}
                    </For>
                  </>
                )}
              </For>
            </ul>
          </div>
        </div>
      </Show>
    </Portal>
  )
}
