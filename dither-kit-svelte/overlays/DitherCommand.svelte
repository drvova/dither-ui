<script lang="ts" module>
  export type CommandItem = { value: string; label: string; group?: string; kbd?: string }
  let commandCount = 0
</script>

<script lang="ts">
  import { tick } from "svelte"
  import { portal } from "../runtime/portal"
  import { CONTROL_BUTTON, POPOVER } from "../runtime/control"
  import { cn } from "../runtime/lib"

  /** Command palette — type to filter, arrows to walk, Enter runs, Escape
   * leaves. Same open/close contract as the dialog; wire your own hotkey. */
  type Props = {
    open: boolean
    items: CommandItem[]
    placeholder?: string
    /** Shown when nothing matches. */
    empty?: string
    class?: string
    onclose?: () => void
    onselect?: (value: string) => void
  }

  let {
    open,
    items,
    placeholder = "Type a command…",
    empty = "No results.",
    class: className,
    onclose,
    onselect,
  }: Props = $props()

  const idBase = `dk-command-${commandCount++}`
  let query = $state("")
  let active = $state(0)
  let inputEl = $state<HTMLInputElement | null>(null)
  let previousFocus: HTMLElement | null = null

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase()
    return q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items
  })
  const groups = $derived.by(() => {
    const out = new Map<string, CommandItem[]>()
    for (const item of filtered) {
      const g = item.group ?? ""
      if (!out.has(g)) out.set(g, [])
      out.get(g)!.push(item)
    }
    return out
  })
  const flat = $derived([...groups.values()].flat())

  /** Mount of the panel is the open seam: capture focus, reset, restore on destroy. */
  function openSeam(_node: HTMLElement) {
    previousFocus = document.activeElement as HTMLElement | null
    query = ""
    active = 0
    tick().then(() => inputEl?.focus())
    return {
      destroy() {
        previousFocus?.focus()
        previousFocus = null
      },
    }
  }

  function pick(value: string) {
    onselect?.(value)
    onclose?.()
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation()
      onclose?.()
      return
    }
    const n = flat.length
    if (!n) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      active = (active + 1) % n
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      active = (active - 1 + n) % n
    } else if (e.key === "Home") {
      e.preventDefault()
      active = 0
    } else if (e.key === "End") {
      e.preventDefault()
      active = n - 1
    } else if (e.key === "Enter") {
      e.preventDefault()
      const item = flat[active]
      if (item) pick(item.value)
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div use:portal use:openSeam class="fixed inset-0 z-50 grid place-items-start justify-center pt-[18vh]" onkeydown={onKeydown}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-background/70 backdrop-blur-[2px]" aria-hidden="true" onclick={() => onclose?.()}></div>
    <div role="dialog" aria-modal="true" aria-label={placeholder} class={cn("relative w-[min(92vw,480px)] overflow-hidden font-mono", POPOVER, className)}>
      <div class="flex items-center gap-2 border-b border-border/60 px-3">
        <span class="text-[12px] text-muted-foreground" aria-hidden="true">›</span>
        <input
          bind:this={inputEl}
          bind:value={query}
          oninput={() => (active = 0)}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={`${idBase}-list`}
          aria-activedescendant={flat[active] ? `${idBase}-${flat.indexOf(flat[active])}` : undefined}
          {placeholder}
          class="h-11 w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        <span class="rounded border border-border/60 px-1 text-[9px] text-muted-foreground" aria-hidden="true">esc</span>
      </div>
      <ul id={`${idBase}-list`} role="listbox" class="max-h-72 overflow-y-auto p-1.5">
        {#if !flat.length}
          <li class="px-2.5 py-6 text-center text-[12px] text-muted-foreground">{empty}</li>
        {/if}
        {#each groups as [group, groupItems] (group || "top")}
          {#if group}
            <li aria-hidden="true" class="px-2.5 pt-2 pb-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">{group}</li>
          {/if}
          {#each groupItems as item (item.value)}
            <!-- svelte-ignore a11y_click_events_have_key_events (listbox options are pointer targets; the keyboard lives on the combobox input via aria-activedescendant) -->
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions (role=option is the interactive semantics; focus stays on the input) -->
            <li
              id={`${idBase}-${flat.indexOf(item)}`}
              role="option"
              aria-selected={flat.indexOf(item) === active}
              class={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] transition-colors",
                CONTROL_BUTTON,
                flat.indexOf(item) === active ? "bg-card text-foreground" : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
              )}
              onclick={() => pick(item.value)}
              onpointermove={() => (active = flat.indexOf(item))}
            >
              <span class="size-1.5 shrink-0 rounded-[1px] bg-current opacity-60" aria-hidden="true"></span>
              <span class="min-w-0 flex-1 truncate">{item.label}</span>
              {#if item.kbd}
                <kbd class="rounded border border-border/60 px-1 text-[9px] tabular-nums text-muted-foreground">{item.kbd}</kbd>
              {/if}
            </li>
          {/each}
        {/each}
      </ul>
    </div>
  </div>
{/if}
